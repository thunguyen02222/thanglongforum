import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Question } from '../../question/schemas/question.schema';
import { Answer } from '../../answer/schemas/answer.schema';
import { User } from '../../user/schemas/user.schema';
import { Report } from '../../report/schemas/report.schema';
import { Tag } from '../../tag/schemas/tag.schema';
import { Vote } from '../../vote/schemas/vote.schema';
import { FileService } from '../../file/services/file.service';

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(Question.name) private questionModel: Model<Question>,
    @InjectModel(Answer.name) private answerModel: Model<Answer>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Report.name) private reportModel: Model<Report>,
    @InjectModel(Tag.name) private tagModel: Model<Tag>,
    @InjectModel(Vote.name) private voteModel: Model<Vote>,
    private fileService: FileService
  ) {}

  async getOverview() {
    const [totalQuestions, totalAnswers, totalUsers, resolvedQuestions] = await Promise.all([
      this.questionModel.countDocuments(),
      this.answerModel.countDocuments(),
      this.userModel.countDocuments({ status: 'active' }),
      this.questionModel.countDocuments({ status: 'resolved' })
    ]);
    return { totalQuestions, totalAnswers, totalUsers, resolvedQuestions };
  }

  async getLeaderboard(timeFilter?: string) {
    // Tính startDate dựa trên timeFilter
    const now = new Date();
    let startDate: Date | null = null;

    if (timeFilter === 'Hôm nay') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (timeFilter === 'Tuần này') {
      const day = now.getDay() || 7;
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
    } else if (timeFilter === 'Tháng này') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timeFilter === 'Năm nay') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const pipeline: any[] = [];

    // Lọc vote theo thời gian vote được bấm
    if (startDate) {
      pipeline.push({ $match: { createdAt: { $gte: startDate } } });
    }

    pipeline.push(
      // Lookup answer để lấy userId (người viết câu trả lời nhận vote)
      {
        $lookup: {
          from: 'answers',
          localField: 'answerId',
          foreignField: '_id',
          as: 'answer'
        }
      },
      { $unwind: '$answer' },
      // Lookup user từ answer.userId
      {
        $lookup: {
          from: 'users',
          localField: 'answer.userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      // Chỉ xếp hạng sinh viên
      { $match: { 'user.role': 'student' } },
      // Group theo userId, mỗi vote = 10 điểm (type=1)
      {
        $group: {
          _id: '$answer.userId',
          totalVotes: { $sum: '$type' },
          name: { $first: '$user.name' },
          userCode: { $first: '$user.userCode' },
          role: { $first: '$user.role' },
          avatarId: { $first: '$user.avatarId' },
          avatarUrl: { $first: '$user.avatarUrl' }
        }
      },
      {
        $addFields: {
          score: { $multiply: ['$totalVotes', 10] }
        }
      },
      { $match: { score: { $gt: 0 } } },
      { $sort: { score: -1, totalVotes: -1 } },
      { $limit: 10 }
    );

    const results = await this.voteModel.aggregate(pipeline);

    // Resolve avatarUrl từ avatarId cho các user chưa có avatarUrl
    const needResolve = results.filter((r: any) => r.avatarId && !r.avatarUrl);
    if (needResolve.length > 0) {
      const ids = needResolve.map((r: any) => r.avatarId.toString());
      const files = await this.fileService.findByIds(ids);
      const urlMap = new Map<string, string>();
      files.forEach((f) => {
        const id = f._id?.toString?.();
        if (id) urlMap.set(id, f.getUrl());
      });
      for (const r of results) {
        if (r.avatarId && !r.avatarUrl) {
          r.avatarUrl = urlMap.get(r.avatarId.toString()) || undefined;
        }
      }
    }

    return results;
  }

  async getDashboard() {
    const [
      totalQuestions,
      totalAnswers,
      totalUsers,
      pendingReports,
      answeredQuestions,
      recentQuestions,
      topContributors
    ] = await Promise.all([
      this.questionModel.countDocuments(),
      this.answerModel.countDocuments(),
      this.userModel.countDocuments(),
      this.reportModel.countDocuments({ status: 'pending' }),
      this.questionModel.countDocuments({ answerCount: { $gt: 0 } }),
      this.questionModel.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userId', 'name firstName lastName role')
        .populate('topicId', 'name')
        .lean(),
      this.getTopContributors(5)
    ]);

    return {
      totalQuestions,
      totalAnswers,
      totalUsers,
      pendingReports,
      answeredQuestions,
      resolveRate: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0,
      recentQuestions,
      topContributors
    };
  }

  async getQuestionStats(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.questionModel.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return stats.map((s: any) => ({ date: s._id, count: s.count }));
  }

  async getQuestionStatsMonthly() {
    const stats = await this.questionModel.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return stats.map((s: any) => ({ date: s._id, count: s.count }));
  }

  async getHotTopics(days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.questionModel.aggregate([
      { $match: { createdAt: { $gte: startDate }, topicId: { $ne: null } } },
      {
        $group: {
          _id: '$topicId',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'tags',
          localField: '_id',
          foreignField: '_id',
          as: 'topic'
        }
      },
      { $unwind: '$topic' },
      {
        $project: {
          _id: 1,
          count: 1,
          name: '$topic.name'
        }
      }
    ]);

    return stats;
  }

  async getUserStats() {
    const byRole = await this.userModel.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const activeUsers = await this.answerModel.aggregate([
      {
        $group: {
          _id: '$userId',
          answerCount: { $sum: 1 }
        }
      },
      { $sort: { answerCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          answerCount: 1,
          name: '$user.name',
          role: '$user.role'
        }
      }
    ]);

    return { byRole, activeUsers };
  }

  private async getTopContributors(limit: number) {
    return this.answerModel.aggregate([
      { $group: { _id: '$userId', answerCount: { $sum: 1 } } },
      { $sort: { answerCount: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          answerCount: 1,
          name: '$user.name',
          role: '$user.role'
        }
      }
    ]);
  }
}
