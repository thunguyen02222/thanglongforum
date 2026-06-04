import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Answer } from '../schemas/answer.schema';
import { Question } from '../../question/schemas/question.schema';
import { CreateAnswerDto, UpdateAnswerDto, SearchAnswerDto } from '../dtos/answer.dto';
import { NotificationService } from '../../notification/services/notification.service';
import { FollowService } from '../../follow/services/follow.service';
import { FileService } from '../../file/services/file.service';
import { resolveAvatarUrl } from 'src/kernel/helpers/avatar.helper';

function getPlainTextContent(html?: string | null) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|h[1-6]|li|ul|ol|blockquote)>/gi, ' ')
    .replace(/<[^>]*>?/gm, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&[a-zA-Z#0-9]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

@Injectable()
export class AnswerService {
  constructor(
    @InjectModel(Answer.name) private answerModel: Model<Answer>,
    @InjectModel(Question.name) private questionModel: Model<Question>,
    @Inject(forwardRef(() => NotificationService)) private notificationService: NotificationService,
    @Inject(forwardRef(() => FollowService)) private followService: FollowService,
    private fileService: FileService
  ) {}

  async create(questionId: string, userId: string, dto: CreateAnswerDto) {
    const question = await this.questionModel.findById(questionId);
    if (!question) throw new NotFoundException('Không tìm thấy câu hỏi');
    if (!getPlainTextContent(dto.content)) {
      throw new BadRequestException('Nội dung không được để trống');
    }

    const answer = await this.answerModel.create({
      questionId: new Types.ObjectId(questionId),
      userId: new Types.ObjectId(userId),
      content: dto.content
    });

    await this.questionModel.findByIdAndUpdate(questionId, { $inc: { answerCount: 1 } });

    // Thông báo cho question owner
    if (question.userId.toString() !== userId.toString()) {
      await this.notificationService.create({
        userId: question.userId.toString(),
        type: 'answer',
        message: `có người trả lời câu hỏi "${question.title}"`,
        questionId,
        actorId: userId
      });
    }

    // Thông báo cho followers
    const followerIds = await this.followService.getFollowerIds(questionId);
    const notifyFollowers = followerIds.filter((fId) => fId.toString() !== userId.toString() && fId.toString() !== question.userId.toString());
    if (notifyFollowers.length) {
      await this.notificationService.createForMany(notifyFollowers, {
        type: 'follow',
        message: `có câu trả lời mới cho câu hỏi "${question.title}" mà bạn đang theo dõi`,
        questionId,
        actorId: userId
      });
    }

    return answer;
  }

  async update(id: string, userId: string, dto: UpdateAnswerDto) {
    const answer = await this.answerModel.findById(id);
    if (!answer) throw new NotFoundException('Không tìm thấy câu trả lời');
    if (answer.userId.toString() !== userId.toString()) {
      throw new ForbiddenException('Bạn không có quyền sửa câu trả lời này');
    }
    if (dto.content !== undefined && !getPlainTextContent(dto.content)) {
      throw new BadRequestException('Nội dung không được để trống');
    }

    const $set: any = { content: dto.content, updatedAt: new Date() };
    const updateQuery: any = { $set };
    if (dto.content && dto.content !== answer.content) {
      updateQuery.$push = {
        editHistory: {
          editedAt: new Date(),
          content: answer.content
        }
      };
    }

    const result = await this.answerModel.findByIdAndUpdate(id, updateQuery, { new: true })
      .populate('userId', 'name firstName lastName role avatarId avatarUrl').lean();

    if (result) await resolveAvatarUrl([result], this.fileService);
    return result;
  }

  async delete(id: string, userId: string, userRole: string) {
    const answer = await this.answerModel.findById(id);
    if (!answer) throw new NotFoundException('Không tìm thấy câu trả lời');
    if (answer.userId.toString() !== userId.toString() && userRole !== 'admin') {
      throw new ForbiddenException('Bạn không có quyền xóa câu trả lời này');
    }

    await this.answerModel.findByIdAndDelete(id);
    await this.questionModel.findByIdAndUpdate(answer.questionId, { $inc: { answerCount: -1 } });
    return { message: 'Xóa câu trả lời thành công' };
  }

  async findByQuestion(questionId: string, sort: string = 'votes') {
    const answers = await this.answerModel
      .find({ questionId: new Types.ObjectId(questionId) })
      .populate('userId', 'name firstName lastName role avatarId avatarUrl')
      .lean();

    await resolveAvatarUrl(answers, this.fileService);

    return answers.sort((a, b) => {
      const aIsTeacher = (a.userId as any)?.role === 'teacher' ? 1 : 0;
      const bIsTeacher = (b.userId as any)?.role === 'teacher' ? 1 : 0;
      if (bIsTeacher !== aIsTeacher) return bIsTeacher - aIsTeacher;

      if (b.isAccepted !== a.isAccepted) return (b.isAccepted ? 1 : 0) - (a.isAccepted ? 1 : 0);
      if (b.isPinned !== a.isPinned) return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
      if (sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (b.voteScore !== a.voteScore) return b.voteScore - a.voteScore;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }

  async acceptAnswer(id: string, userId: string, userRole: string) {
    const answer = await this.answerModel.findById(id);
    if (!answer) throw new NotFoundException('Không tìm thấy câu trả lời');

    const question = await this.questionModel.findById(answer.questionId);
    if (!question) throw new NotFoundException('Không tìm thấy câu hỏi');

    // Chỉ question owner, teacher, admin mới accept
    if (question.userId.toString() !== userId.toString() && !['admin', 'teacher'].includes(userRole)) {
      throw new ForbiddenException('Bạn không có quyền chấp nhận câu trả lời');
    }

    // Bỏ accept tất cả answer khác của câu hỏi này
    await this.answerModel.updateMany(
      { questionId: answer.questionId },
      { isAccepted: false }
    );

    // Accept answer này
    const updated = await this.answerModel.findByIdAndUpdate(
      id,
      { isAccepted: true, updatedAt: new Date() },
      { new: true }
    ).populate('userId', 'name firstName lastName role avatarId avatarUrl').lean();

    if (updated) await resolveAvatarUrl([updated], this.fileService);

    // Đánh dấu question resolved
    await this.questionModel.findByIdAndUpdate(answer.questionId, { status: 'resolved' });

    // Thông báo cho answer owner
    if (answer.userId.toString() !== userId.toString()) {
      await this.notificationService.create({
        userId: answer.userId.toString(),
        type: 'accept',
        message: `câu trả lời của bạn cho "${question.title}" đã được chấp nhận`,
        questionId: question._id.toString(),
        actorId: userId
      });
    }

    return updated;
  }

  async pinAnswer(id: string, userId: string, userRole: string) {
    if (!['admin', 'teacher'].includes(userRole)) {
      throw new ForbiddenException('Chỉ giảng viên hoặc admin mới có thể ghim câu trả lời');
    }

    const answer = await this.answerModel.findById(id);
    if (!answer) throw new NotFoundException('Không tìm thấy câu trả lời');

    const updated = await this.answerModel.findByIdAndUpdate(
      id,
      { isPinned: !answer.isPinned, updatedAt: new Date() },
      { new: true }
    ).populate('userId', 'name firstName lastName role avatarId avatarUrl').lean();

    if (updated) await resolveAvatarUrl([updated], this.fileService);

    return updated;
  }

  async adminSearch(dto: SearchAnswerDto) {
    const { page = 1, limit = 20, questionId } = dto;
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (questionId) filter.questionId = new Types.ObjectId(questionId);

    const [data, total] = await Promise.all([
      this.answerModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name firstName lastName role avatarId avatarUrl')
        .populate('questionId', 'title')
        .lean(),
      this.answerModel.countDocuments(filter)
    ]);

    await resolveAvatarUrl(data, this.fileService);

    const totalPages = Math.ceil(total / limit);
    return { data, total, page, limit, totalPages };
  }
}
