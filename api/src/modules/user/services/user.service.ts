import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../schemas/user.schema';
import { UpdateUserDto } from '../dtos/user.dto';
import { Question } from '../../question/schemas/question.schema';
import { Answer } from '../../answer/schemas/answer.schema';
import { Vote } from '../../vote/schemas/vote.schema';
import { FileService } from '../../file/services/file.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Question.name) private questionModel: Model<Question>,
    @InjectModel(Answer.name) private answerModel: Model<Answer>,
    @InjectModel(Vote.name) private voteModel: Model<Vote>,
    @Inject(forwardRef(() => FileService)) private fileService: FileService
  ) {}

  async findById(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return user;
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  async findByUserCode(userCode: string) {
    return this.userModel.findOne({
      userCode: { $regex: new RegExp(`^${userCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
  }

  async findByUsername(username: string) {
    return this.userModel.findOne({ username: username.toLowerCase() });
  }

  async findByEmailOrUsername(identifier: string) {
    const lowerIdentifier = identifier.toLowerCase();
    return this.userModel.findOne({
      $or: [
        { email: lowerIdentifier },
        { username: lowerIdentifier },
        { userCode: { $regex: new RegExp(`^${identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
      ]
    });
  }

  async create(data: Partial<User>) {
    // Kiểm tra email đã tồn tại
    if (data.email) {
      const existingEmail = await this.findByEmail(data.email);
      if (existingEmail) {
        throw new BadRequestException('Email đã được sử dụng');
      }
    }

    // Kiểm tra username đã tồn tại
    if (data.username) {
      const existingUsername = await this.findByUsername(data.username);
      if (existingUsername) {
        throw new BadRequestException('Username  đã được sử dụng');
      }
    }

    // Kiểm tra userCode đã tồn tại
    if (data.userCode) {
      const existingCode = await this.findByUserCode(data.userCode);
      if (existingCode) {
        throw new BadRequestException('Mã đã được sử dụng');
      }
    }

    return this.userModel.create({
      ...data,
      email: data.email?.toLowerCase(),
      username: data.username?.toLowerCase()
    });
  }

  async update(id: string, updateDto: UpdateUserDto) {
    if (updateDto.email) {
      const existingEmail = await this.userModel.findOne({
        email: updateDto.email.toLowerCase(),
        _id: { $ne: id }
      });
      if (existingEmail) throw new BadRequestException('Email đã được sử dụng');
    }

    if (updateDto.username) {
      const existingUsername = await this.userModel.findOne({
        username: updateDto.username.toLowerCase(),
        _id: { $ne: id }
      });
      if (existingUsername) throw new BadRequestException('Username  đã được sử dụng');
    }

    if (updateDto.userCode) {
      const existingCode = await this.userModel.findOne({
        userCode: updateDto.userCode,
        _id: { $ne: id }
      });
      if (existingCode) throw new BadRequestException('Mã đã được sử dụng');
    }

    const updateData: any = { ...updateDto, updatedAt: new Date() };
    if (updateDto.email) updateData.email = updateDto.email.toLowerCase();
    if (updateDto.username) updateData.username = updateDto.username.toLowerCase();

    // Resolve avatarUrl từ avatarId để các query populate có sẵn URL
    if (updateDto.avatarId) {
      const fileDto = await this.fileService.getById(updateDto.avatarId);
      if (fileDto) updateData.avatarUrl = fileDto.getUrl();
    }

    const user = await this.userModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return user;
  }

  async getProfile(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId)
      .select('-password -salt')
      .lean();
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const uid = new Types.ObjectId(userId);

    const [questionCount, answerCount, acceptedCount] = await Promise.all([
      this.questionModel.countDocuments({ userId: uid }),
      this.answerModel.countDocuments({ userId: uid }),
      this.answerModel.countDocuments({ userId: uid, isAccepted: true })
    ]);

    // Tính tổng điểm đóng góp = tổng vote nhận được * 10 (giống bảng xếp hạng)
    const voteAgg = await this.voteModel.aggregate([
      {
        $lookup: {
          from: 'answers',
          localField: 'answerId',
          foreignField: '_id',
          as: 'answer'
        }
      },
      { $unwind: '$answer' },
      { $match: { 'answer.userId': uid } },
      { $group: { _id: null, totalVotes: { $sum: '$type' } } }
    ]);
    const totalVotes = voteAgg[0]?.totalVotes || 0;
    const contributionScore = totalVotes * 10;

    // Xếp hạng tuần: dựa trên vote nhận được trong tuần (giống bảng xếp hạng filter 'Tuần này')
    const now = new Date();
    const weekDay = now.getDay() || 7;
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - weekDay + 1);
    let weekRank: number | null = null;
    try {
      const weeklyRanking = await this.voteModel.aggregate([
        { $match: { createdAt: { $gte: weekStart } } },
        {
          $lookup: {
            from: 'answers',
            localField: 'answerId',
            foreignField: '_id',
            as: 'answer'
          }
        },
        { $unwind: '$answer' },
        {
          $group: {
            _id: '$answer.userId',
            totalVotes: { $sum: '$type' }
          }
        },
        {
          $addFields: {
            score: { $multiply: ['$totalVotes', 10] }
          }
        },
        { $match: { score: { $gt: 0 } } },
        { $sort: { score: -1, totalVotes: -1 } }
      ]);
      const idx = weeklyRanking.findIndex((w: any) => w._id?.toString() === userId);
      weekRank = idx >= 0 ? idx + 1 : null;
    } catch { /* bỏ qua */ }

    // Recent questions
    const recentQuestions = await this.questionModel.find({ userId: uid })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('topicId', 'name slug')
      .lean();

    // Recent answers
    let recentAnswers: any[] = [];
    try {
      recentAnswers = await this.answerModel.find({ userId: uid })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('questionId', 'title')
        .lean();
    } catch { /* bỏ qua */ }

    // Biểu đồ hoạt động 6 tháng gần nhất (câu hỏi + câu trả lời theo tháng)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [questionsByMonth, answersByMonth] = await Promise.all([
      this.questionModel.aggregate([
        { $match: { userId: uid, createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      this.answerModel.aggregate([
        { $match: { userId: uid, createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    // Build 6 tháng labels
    const monthlyActivity: { month: string; questions: number; answers: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const qCount = questionsByMonth.find((q: any) => q._id === key)?.count || 0;
      const aCount = answersByMonth.find((a: any) => a._id === key)?.count || 0;
      monthlyActivity.push({
        month: `T${d.getMonth() + 1}`,
        questions: qCount,
        answers: aCount
      });
    }

    let avatarUrl = (user as any).avatarUrl || null;
    if (user.avatarId) {
      try {
        const fileDto = await this.fileService.getById(user.avatarId.toString());
        if (fileDto) avatarUrl = fileDto.getUrl();
      } catch {
        // giữ avatarUrl từ DB
      }
    }

    return {
      ...user,
      avatarUrl,
      questionCount,
      answerCount,
      acceptedCount,
      voteScore: totalVotes,
      contributionScore,
      weekRank,
      recentQuestions,
      recentAnswers,
      monthlyActivity
    };
  }
}
