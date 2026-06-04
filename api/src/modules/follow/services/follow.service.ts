import { Injectable, Inject, forwardRef, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Follow } from '../schemas/follow.schema';
import { createPageableData } from 'src/kernel/common/pageable-data';
import { Question } from '../../question/schemas/question.schema';
import { NotificationService } from '../../notification/services/notification.service';

@Injectable()
export class FollowService {
  constructor(
    @InjectModel(Follow.name) private followModel: Model<Follow>,
    @InjectModel(Question.name) private questionModel: Model<Question>,
    @Inject(forwardRef(() => NotificationService)) private notificationService: NotificationService
  ) {}

  async toggle(userId: string, questionId: string) {
    const userObjId = new Types.ObjectId(userId);
    const questionObjId = new Types.ObjectId(questionId);
    const question = await this.questionModel.findById(questionId).select('title userId').lean();
    if (!question) throw new NotFoundException('Không tìm thấy câu hỏi');

    const existing = await this.followModel.findOne({ userId: userObjId, questionId: questionObjId });
    if (existing) {
      await this.followModel.findByIdAndDelete(existing._id);
      return { following: false };
    }

    await this.followModel.create({ userId: userObjId, questionId: questionObjId });

    if ((question as any).userId?.toString() !== userId.toString()) {
      await this.notificationService.create({
        userId: (question as any).userId.toString(),
        type: 'follow',
        message: `có người theo dõi câu hỏi "${(question as any).title}"`,
        questionId,
        actorId: userId
      });
    }

    return { following: true };
  }

  async isFollowing(userId: string, questionId: string) {
    const doc = await this.followModel.findOne({
      userId: new Types.ObjectId(userId),
      questionId: new Types.ObjectId(questionId)
    });
    return { following: !!doc };
  }

  async getFollowerIds(questionId: string): Promise<string[]> {
    const follows = await this.followModel.find({
      questionId: new Types.ObjectId(questionId)
    }).select('userId').lean();
    return follows.map((f: any) => f.userId.toString());
  }

  async getMyFollowing(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const filter = { userId: new Types.ObjectId(userId) };

    const [data, total] = await Promise.all([
      this.followModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'questionId',
          populate: [
            { path: 'topicId', select: 'name slug' },
            { path: 'userId', select: 'name firstName lastName role avatarId' }
          ]
        })
        .lean(),
      this.followModel.countDocuments(filter)
    ]);

    const questions = data
      .map((f: any) => f.questionId)
      .filter(Boolean);

    return createPageableData(questions, total, page, limit);
  }
}
