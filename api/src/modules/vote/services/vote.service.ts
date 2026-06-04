import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Vote } from '../schemas/vote.schema';
import { Answer } from '../../answer/schemas/answer.schema';
import { Question } from '../../question/schemas/question.schema';
import { User } from '../../user/schemas/user.schema';
import { CreateVoteDto } from '../dtos/vote.dto';
import { NotificationService } from '../../notification/services/notification.service';

@Injectable()
export class VoteService {
  constructor(
    @InjectModel(Vote.name) private voteModel: Model<Vote>,
    @InjectModel(Answer.name) private answerModel: Model<Answer>,
    @InjectModel(Question.name) private questionModel: Model<Question>,
    @InjectModel(User.name) private userModel: Model<User>,
    @Inject(forwardRef(() => NotificationService)) private notificationService: NotificationService
  ) {}

  async toggle(answerId: string, userId: string, dto: CreateVoteDto) {
    const answer = await this.answerModel.findById(answerId);
    if (!answer) throw new NotFoundException('Không tìm thấy câu trả lời');

    const question = await this.questionModel.findById(answer.questionId);
    if (!question) throw new NotFoundException('Không tìm thấy câu hỏi');
    
    // 1. Không tự vote cho bản thân
    if (answer.userId.toString() === userId.toString()) {
      throw new BadRequestException('Không được tự vote cho câu trả lời của chính mình');
    }

    const voter = await this.userModel.findById(userId).select('role').lean();
    const userRole = voter?.role || 'student';

    const isAuthor = question.userId.toString() === userId.toString();
    const isTeacher = userRole === 'teacher';
    const isAdmin = userRole === 'admin';

    // 2. Chỉ người đăng, giảng viên, và admin được vote
    if (!isAuthor && !isTeacher && !isAdmin) {
      throw new BadRequestException('Chỉ người đăng câu hỏi hoặc giảng viên mới có quyền Vote');
    }

    const userObjId = new Types.ObjectId(userId);
    const answerObjId = new Types.ObjectId(answerId);
    const existingVote = await this.voteModel.findOne({ userId: userObjId, answerId: answerObjId });

    // Trạng thái chuẩn bị Toggle: luôn luôn dùng type=1 cho Xác Nhận
    // Tránh Toggle nếu chạm giới hạn
    if (!existingVote) {
      // Đang muốn VOTE MỚI
      
      // Lấy danh sách ID answer của question này
      const answersOfQuestion = await this.answerModel.find({ questionId: question._id }, '_id');
      const answerIdsInQ = answersOfQuestion.map(a => a._id);

      // Kiểm tra xem user này ĐÃ vote cho CÂU NÀO KHÁC trong bài này chưa? (1 vote/bài)
      const voteInThisPost = await this.voteModel.findOne({
        userId: userObjId,
        answerId: { $in: answerIdsInQ }
      });
      
      if (voteInThisPost) {
        throw new BadRequestException('Mỗi bài đăng bạn chỉ có 1 lượt Vote');
      }

      // Nếu KHÔNG phải giảng viên/admin (Chỉ là Sinh viên) -> kiểm tra giới hạn 2 vote/ngày
      if (isAuthor && !isTeacher && !isAdmin) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const votesToday = await this.voteModel.countDocuments({
          userId: userObjId,
          createdAt: { $gte: today }
        });
        if (votesToday >= 2) {
          throw new BadRequestException('Bạn đã hết lượt Vote hôm nay (Tối đa 2 lượt/ngày)');
        }
      }

      await this.voteModel.create({ userId: userObjId, answerId: answerObjId, type: 1 });
      await this.answerModel.findByIdAndUpdate(answerId, { $inc: { voteScore: 1 } });
      
      // Tích hợp: Đánh dấu bài viết đã có câu trả lời đúng (resolved) 
      // Do là bài có Vote nên coi như Resolved nếu là Author, hoặc luôn coi resolved.
      await this.questionModel.findByIdAndUpdate(question._id, { status: 'resolved' });

      // Gửi thông báo cho answer owner (nếu không phải là chính mình)
      if (answer.userId.toString() !== userId.toString()) {
        await this.notificationService.create({
          userId: answer.userId.toString(),
          type: 'vote',
          message: `có người đã vote cho câu trả lời của bạn trong câu hỏi "${question.title}"`,
          questionId: question._id.toString(),
          actorId: userId
        });
      }

    } else {
      // HỦY VOTE
      await this.voteModel.findByIdAndDelete(existingVote._id);
      await this.answerModel.findByIdAndUpdate(answerId, { $inc: { voteScore: -1 } });
    }

    const currentVote = await this.voteModel.findOne({ userId: userObjId, answerId: answerObjId }).lean();
    const updatedAnswer = await this.answerModel.findById(answerId).select('voteScore').lean();

    return {
      vote: currentVote,
      voteScore: updatedAnswer?.voteScore || 0
    };
  }

  async getMyVote(answerId: string, userId: string) {
    return this.voteModel.findOne({
      userId: new Types.ObjectId(userId),
      answerId: new Types.ObjectId(answerId)
    }).lean();
  }

  async getMyVotesForAnswers(answerIds: string[], userId: string) {
    const votes = await this.voteModel.find({
      userId: new Types.ObjectId(userId),
      answerId: { $in: answerIds.map((id) => new Types.ObjectId(id)) }
    }).lean();

    const map: Record<string, number> = {};
    votes.forEach((v: any) => {
      map[v.answerId.toString()] = v.type;
    });
    return map;
  }
}
