import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment } from '../schemas/comment.schema';
import { Answer } from '../../answer/schemas/answer.schema';
import { Question } from '../../question/schemas/question.schema';
import { CreateCommentDto, UpdateCommentDto } from '../dtos/comment.dto';
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
export class CommentService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
    @InjectModel(Answer.name) private answerModel: Model<Answer>,
    @InjectModel(Question.name) private questionModel: Model<Question>,
    @Inject(forwardRef(() => NotificationService)) private notificationService: NotificationService,
    @Inject(forwardRef(() => FollowService)) private followService: FollowService,
    private fileService: FileService
  ) {}

  async create(answerId: string, userId: string, dto: CreateCommentDto) {
    const answer = await this.answerModel.findById(answerId);
    if (!answer) throw new NotFoundException('Không tìm thấy câu trả lời');
    if (!getPlainTextContent(dto.content)) {
      throw new BadRequestException('Nội dung bình luận không được để trống');
    }

    const comment = await this.commentModel.create({
      answerId: new Types.ObjectId(answerId),
      userId: new Types.ObjectId(userId),
      content: dto.content
    });

    await this.answerModel.findByIdAndUpdate(answerId, { $inc: { commentCount: 1 } });

    // Thông báo cho answer owner khi có comment mới (không tự notify chính mình)
    if (answer.userId.toString() !== userId.toString()) {
      const question = await this.questionModel.findById(answer.questionId).select('title').lean();
      await this.notificationService.create({
        userId: answer.userId.toString(),
        type: 'comment',
        message: `có bình luận mới dưới câu trả lời của bạn${question ? ` trong câu hỏi "${(question as any).title}"` : ''}`,
        questionId: answer.questionId.toString(),
        actorId: userId
      });
    }

    // Thông báo cho followers
    const questionForTitle = await this.questionModel.findById(answer.questionId).select('title userId').lean();
    if (questionForTitle) {
      const followerIds = await this.followService.getFollowerIds(answer.questionId.toString());
      const notifyFollowers = followerIds.filter(
        (fId) => fId.toString() !== userId.toString() && fId.toString() !== (questionForTitle as any).userId.toString() && fId.toString() !== answer.userId.toString()
      );
      
      if (notifyFollowers.length) {
        await this.notificationService.createForMany(notifyFollowers, {
          type: 'follow',
          message: `có bình luận mới trong câu hỏi "${(questionForTitle as any).title}" mà bạn đang theo dõi`,
          questionId: answer.questionId.toString(),
          actorId: userId
        });
      }
    }

    return comment;
  }

  async update(id: string, userId: string, dto: UpdateCommentDto) {
    const comment = await this.commentModel.findById(id);
    if (!comment) throw new NotFoundException('Không tìm thấy bình luận');
    if (comment.userId.toString() !== userId.toString()) {
      throw new ForbiddenException('Bạn không có quyền sửa bình luận này');
    }
    if (dto.content !== undefined && !getPlainTextContent(dto.content)) {
      throw new BadRequestException('Nội dung bình luận không được để trống');
    }

    const updateData: any = { content: dto.content, updatedAt: new Date() };
    if (dto.content && dto.content !== comment.content) {
      updateData.$push = {
        editHistory: {
          editedAt: new Date(),
          content: comment.content
        }
      };
    }

    const result = await this.commentModel.findByIdAndUpdate(id, updateData, { new: true })
      .populate('userId', 'name firstName lastName role avatarId avatarUrl').lean();

    if (result) await resolveAvatarUrl([result], this.fileService);
    return result;
  }

  async delete(id: string, userId: string, userRole: string) {
    const comment = await this.commentModel.findById(id);
    if (!comment) throw new NotFoundException('Không tìm thấy bình luận');
    if (comment.userId.toString() !== userId.toString() && userRole !== 'admin') {
      throw new ForbiddenException('Bạn không có quyền xóa bình luận này');
    }

    await this.commentModel.findByIdAndDelete(id);
    await this.answerModel.findByIdAndUpdate(comment.answerId, { $inc: { commentCount: -1 } });
    return { message: 'Xóa bình luận thành công' };
  }

  async findByAnswer(answerId: string) {
    const comments = await this.commentModel.find({ answerId: new Types.ObjectId(answerId) })
      .sort({ createdAt: 1 })
      .populate('userId', 'name firstName lastName role avatarId avatarUrl')
      .lean();

    await resolveAvatarUrl(comments, this.fileService);
    return comments;
  }
}
