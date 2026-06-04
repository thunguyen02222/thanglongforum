import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Report } from '../schemas/report.schema';
import { Question } from '../../question/schemas/question.schema';
import { Answer } from '../../answer/schemas/answer.schema';
import { Comment } from '../../comment/schemas/comment.schema';
import { NotificationService } from '../../notification/services/notification.service';
import { createPageableData } from 'src/kernel/common/pageable-data';

@Injectable()
export class ReportService {
  constructor(
    @InjectModel(Report.name) private reportModel: Model<Report>,
    @InjectModel(Question.name) private questionModel: Model<Question>,
    @InjectModel(Answer.name) private answerModel: Model<Answer>,
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
    private readonly notificationService: NotificationService
  ) {}

  async create(userId: string, data: {
    targetType: string;
    targetId: string;
    reason: string;
    description?: string;
  }) {
    let targetOwnerId: string | null = null;
    if (data.targetType === 'question') {
      const q = await this.questionModel.findById(data.targetId).select('userId').lean();
      if (!q) throw new NotFoundException('Không tìm thấy bài viết');
      targetOwnerId = q.userId?.toString() || null;
    } else if (data.targetType === 'answer') {
      const a = await this.answerModel.findById(data.targetId).select('userId').lean();
      if (!a) throw new NotFoundException('Không tìm thấy câu trả lời');
      targetOwnerId = a.userId?.toString() || null;
    } else if (data.targetType === 'comment') {
      const c = await this.commentModel.findById(data.targetId).select('userId').lean();
      if (!c) throw new NotFoundException('Không tìm thấy bình luận');
      targetOwnerId = c.userId?.toString() || null;
    }

    if (targetOwnerId && targetOwnerId === userId.toString()) {
      throw new BadRequestException('Không được phép báo cáo nội dung do chính mình tạo');
    }

    if ((data.reason === 'Khác' || data.reason === 'other') && (!data.description || !data.description.trim())) {
      throw new BadRequestException('Vui lòng cung cấp mô tả chi tiết cho lý do này');
    }

    return this.reportModel.create({
      userId: new Types.ObjectId(userId),
      targetType: data.targetType,
      targetId: new Types.ObjectId(data.targetId),
      reason: data.reason,
      description: data.description
    });
  }

  async findAll(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (status) filter.status = status;

    const [data, total] = await Promise.all([
      this.reportModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name firstName lastName role')
        .lean(),
      this.reportModel.countDocuments(filter)
    ]);

    // Lấy thêm thông tin target (title câu hỏi hoặc questionId của answer/comment)
    const enriched = await Promise.all(
      data.map(async (r: any) => {
        try {
          if (r.targetType === 'question') {
            const q = await this.questionModel.findById(r.targetId).select('title').lean();
            r.targetTitle = (q as any)?.title || null;
            r.targetQuestionId = r.targetId;
          } else if (r.targetType === 'answer') {
            const a = await this.answerModel.findById(r.targetId).select('questionId content').lean();
            r.targetQuestionId = (a as any)?.questionId || null;
            r.targetPreview = (a as any)?.content?.slice(0, 100) || null;
          } else if (r.targetType === 'comment') {
            const c = await this.commentModel.findById(r.targetId).select('answerId content').lean();
            r.targetPreview = (c as any)?.content?.slice(0, 100) || null;
          }
        } catch { /* silent */ }
        return r;
      })
    );

    return createPageableData(enriched, total, page, limit);
  }

  async updateStatus(id: string, status: string, adminNote?: string) {
    const report = await this.reportModel.findById(id).lean();
    if (!report) throw new NotFoundException('Không tìm thấy báo cáo');

    // Lấy nội dung target để lưu lại
    let targetContent = report.targetContent || '';
    if (!targetContent) {
      try {
        if (report.targetType === 'question') {
          const q = await this.questionModel.findById(report.targetId).select('title').lean();
          targetContent = (q as any)?.title || '';
        } else if (report.targetType === 'answer') {
          const a = await this.answerModel.findById(report.targetId).select('content').lean();
          targetContent = (a as any)?.content?.slice(0, 200) || '';
        } else if (report.targetType === 'comment') {
          const c = await this.commentModel.findById(report.targetId).select('content').lean();
          targetContent = (c as any)?.content?.slice(0, 200) || '';
        }
      } catch { /* silent */ }
    }

    const doc = await this.reportModel.findByIdAndUpdate(
      id,
      { status, adminNote, targetContent, updatedAt: new Date() },
      { new: true }
    ).lean();
    return doc;
  }

  async deleteTarget(reportId: string) {
    const report = await this.reportModel.findById(reportId).lean();
    if (!report) throw new NotFoundException('Không tìm thấy báo cáo');

    let targetContent = '';
    let targetOwnerId: string | null = null;

    if (report.targetType === 'question') {
      const deleted = await this.questionModel.findByIdAndDelete(report.targetId);
      if (!deleted) throw new BadRequestException('Nội dung không tồn tại hoặc đã bị xóa');
      targetContent = (deleted as any).title || '';
      targetOwnerId = (deleted as any).userId?.toString() || null;
    } else if (report.targetType === 'answer') {
      const deleted = await this.answerModel.findByIdAndDelete(report.targetId);
      if (!deleted) throw new BadRequestException('Nội dung không tồn tại hoặc đã bị xóa');
      await this.questionModel.findByIdAndUpdate((deleted as any).questionId, { $inc: { answerCount: -1 } });
      targetContent = (deleted as any).content?.slice(0, 200) || '';
      targetOwnerId = (deleted as any).userId?.toString() || null;
    } else if (report.targetType === 'comment') {
      const deleted = await this.commentModel.findByIdAndDelete(report.targetId);
      if (!deleted) throw new BadRequestException('Nội dung không tồn tại hoặc đã bị xóa');
      await this.answerModel.findByIdAndUpdate((deleted as any).answerId, { $inc: { commentCount: -1 } });
      targetContent = (deleted as any).content?.slice(0, 200) || '';
      targetOwnerId = (deleted as any).userId?.toString() || null;
    }

    // Lưu nội dung và tự động resolve report
    await this.reportModel.findByIdAndUpdate(reportId, {
      status: 'resolved',
      adminNote: 'Đã xóa nội dung vi phạm',
      targetContent,
      updatedAt: new Date()
    });

    // Gửi thông báo cho user chủ bài viết
    if (targetOwnerId) {
      const message = `Câu hỏi của bạn đã bị xóa do vi phạm quy chuẩn cộng đồng (Lý do: ${report.reason}).`;
      await this.notificationService.create({
        userId: targetOwnerId,
        type: 'system',
        message
      });
    }

    return { message: 'Đã xóa nội dung vi phạm và đánh dấu báo cáo là đã xử lý' };
  }

  async countPending() {
    return this.reportModel.countDocuments({ status: 'pending' });
  }
}
