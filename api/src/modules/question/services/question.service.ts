import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Question } from '../schemas/question.schema';
import { CreateQuestionDto, UpdateQuestionDto, SearchQuestionDto } from '../dtos/question.dto';
import { TagService } from '../../tag/services/tag.service';
import { PollService } from '../../poll/services/poll.service';
import { FileService } from '../../file/services/file.service';
import { createPageableData } from 'src/kernel/common/pageable-data';
import { resolveAvatarUrl } from 'src/kernel/helpers/avatar.helper';

@Injectable()
export class QuestionService {
  constructor(
    @InjectModel(Question.name) private questionModel: Model<Question>,
    private tagService: TagService,
    @Inject(forwardRef(() => PollService)) private pollService: PollService,
    private fileService: FileService
  ) {}

  private readonly cuteNames = [
    'Thỏ hóm hỉnh', 'Hươu biết tuốt', 'Cáo lém lỉnh', 'Mèo lười lỉnh', 'Cún đáng yêu',
    'Gấu mũm mĩm', 'Sóc lanh lợi', 'Chim sẻ nhỏ', 'Hổ nhút nhát', 'Cú vọ thông thái',
    'Sư tử hiền lành', 'Voi hiền từ', 'Nhím xù lông', 'Heo mập mạp', 'Khỉ vui nhộn', 'Ếch cốm'
  ];

  private getFallbackAnonymousName(id: string): string {
    if (!id) return this.cuteNames[0];
    const hashStr = id.toString().slice(-4);
    const hash = parseInt(hashStr, 16) || 0;
    return this.cuteNames[hash % this.cuteNames.length];
  }

  async create(userId: string, dto: CreateQuestionDto) {
    // Tăng questionCount cho chủ đề
    if (dto.topicId) {
      await this.tagService.incrementQuestionCount([new Types.ObjectId(dto.topicId)]);
    }

    let anonymousName: string | undefined;
    if (dto.isAnonymous) {
      anonymousName = this.cuteNames[Math.floor(Math.random() * this.cuteNames.length)];
    }

    const question = await this.questionModel.create({
      userId: new Types.ObjectId(userId),
      title: dto.title,
      content: dto.content,
      type: dto.type || 'text',
      isAnonymous: dto.isAnonymous || false,
      anonymousName,
      topicId: dto.topicId ? new Types.ObjectId(dto.topicId) : null
    });

    // Tạo poll options nếu type=poll
    if (dto.type === 'poll' && dto.pollOptions?.length) {
      await this.pollService.createOptions(question._id.toString(), dto.pollOptions);
    }

    return question;
  }

  async update(id: string, userId: string, dto: UpdateQuestionDto) {
    const question = await this.questionModel.findById(id);
    if (!question) throw new NotFoundException('Không tìm thấy câu hỏi');
    if (question.userId.toString() !== userId.toString()) {
      throw new ForbiddenException('Bạn không có quyền sửa câu hỏi này');
    }

    const $set: any = { updatedAt: new Date() };
    const updateQuery: any = { $set };
    
    // Lưu lịch sử chỉnh sửa nếu có đổi tiêu đề/nội dung
    if (
      (dto.title && dto.title !== question.title) || 
      (dto.content && dto.content !== question.content)
    ) {
      updateQuery.$push = {
        editHistory: {
          editedAt: new Date(),
          title: question.title,
          content: question.content
        }
      };
    }

    if (dto.title) $set.title = dto.title;
    if (dto.content) $set.content = dto.content;
    if (dto.isAnonymous !== undefined) $set.isAnonymous = dto.isAnonymous;

    if (dto.topicId !== undefined) {
      // Giảm count chủ đề cũ
      if (question.topicId) {
        await this.tagService.decrementQuestionCount([question.topicId]);
      }
      // Tăng count chủ đề mới
      if (dto.topicId) {
        await this.tagService.incrementQuestionCount([new Types.ObjectId(dto.topicId)]);
      }
      $set.topicId = dto.topicId ? new Types.ObjectId(dto.topicId) : null;
    }

    if (question.type === 'poll' && dto.pollOptions?.length) {
      await this.pollService.addMissingOptions(id, dto.pollOptions);
    }

    const result = await this.questionModel.findByIdAndUpdate(id, updateQuery, { new: true })
      .populate('topicId')
      .populate('userId', 'name firstName lastName role avatarId avatarUrl')
      .lean();

    if (result) await resolveAvatarUrl([result], this.fileService);
    return result;
  }

  async delete(id: string, userId: string, userRole: string) {
    const question = await this.questionModel.findById(id);
    if (!question) throw new NotFoundException('Không tìm thấy câu hỏi');
    if (question.userId.toString() !== userId.toString() && userRole !== 'admin') {
      throw new ForbiddenException('Bạn không có quyền xóa câu hỏi này');
    }

    if (question.topicId) {
      await this.tagService.decrementQuestionCount([question.topicId]);
    }
    await this.questionModel.findByIdAndDelete(id);
    return { message: 'Xóa câu hỏi thành công' };
  }

  async findById(id: string, userId?: string) {
    const question: any = await this.questionModel.findById(id)
      .populate('topicId')
      .populate('userId', 'name firstName lastName role avatarId avatarUrl userCode')
      .lean();

    if (!question) throw new NotFoundException('Không tìm thấy câu hỏi');

    // Tăng viewCount nếu user đã đăng nhập và chưa xem
    if (userId) {
      const viewerIds = (question.viewerIds || []).map((v: any) => v.toString());
      if (!viewerIds.includes(userId.toString())) {
        await this.questionModel.updateOne(
          { _id: id },
          { $inc: { viewCount: 1 }, $addToSet: { viewerIds: new Types.ObjectId(userId) } }
        );
        question.viewCount = (question.viewCount || 0) + 1;
      }
    }

    // Ẩn user info nếu anonymous
    if (question.isAnonymous) {
      (question as any).userId = {
        _id: (question.userId as any)?._id,
        name: question.anonymousName || this.getFallbackAnonymousName(question._id),
        role: 'student'
      };
    }

    await resolveAvatarUrl([question], this.fileService);

    return question;
  }

  // Bảng ánh xạ ký tự không dấu → regex match cả có dấu
  private readonly diacriticsMap: Record<string, string> = {
    'a': '[aàáảãạăắằẳẵặâấầẩẫậ]',
    'e': '[eèéẻẽẹêếềểễệ]',
    'i': '[iìíỉĩị]',
    'o': '[oòóỏõọôốồổỗộơớờởỡợ]',
    'u': '[uùúủũụưứừửữự]',
    'y': '[yỳýỷỹỵ]',
    'd': '[dđ]',
  };

  private buildDiacriticRegex(keyword: string): string {
    // Bỏ dấu để chuẩn hóa
    const normalized = keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();
    let pattern = '';
    for (const ch of normalized) {
      pattern += this.diacriticsMap[ch] || ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    return pattern;
  }

  async search(query: SearchQuestionDto) {
    const { page = 1, limit = 10, q, status, tagSlug, userId, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (q) {
      // Build regex cho cả cụm từ, giữ khoảng trắng và loại trừ base64/chuỗi dính liền
      const normalized = '(?<![a-zA-Z0-9_])' + q.trim().replace(/\s+/g, ' ').split(' ').map(w => this.buildDiacriticRegex(w)).join('\\s+') + '(?![a-zA-Z0-9_])';
      filter.$or = [
        { title: { $regex: normalized, $options: 'i' } },
        { content: { $regex: normalized, $options: 'i' } }
      ];
    }
    if (status) filter.status = status;
    if (userId) filter.userId = new Types.ObjectId(userId);

    // Filter theo chủ đề (slug)
    if (tagSlug) {
      try {
        const topic = await this.tagService.findBySlug(tagSlug);
        filter.topicId = topic._id;
      } catch {
        // Chủ đề không tồn tại → trả rỗng
        return createPageableData([], 0, page, limit);
      }
    }

    // Sort logic
    let sortObj: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    if (sortBy === 'popular') {
      sortObj = { answerCount: -1, viewCount: -1, voteScore: -1, createdAt: -1 };
    } else if (sortBy === 'votes') {
      sortObj = { voteScore: -1, createdAt: -1 };
    } else if (sortBy === 'unanswered') {
      filter.answerCount = 0;
      sortObj = { createdAt: -1 };
    } else if (sortBy === 'discussing') {
      filter.answerCount = { $gt: 0 };
      filter.status = { $ne: 'resolved' };
      sortObj = { createdAt: -1 };
    }

    const [data, total] = await Promise.all([
      this.questionModel.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate('topicId')
        .populate('userId', 'name firstName lastName role avatarId avatarUrl')
        .lean(),

      this.questionModel.countDocuments(filter)
    ]);

    // Ẩn user info cho anonymous questions
    const processedData = data.map((q: any) => {
      if (q.isAnonymous) {
        q.userId = {
          _id: q.userId?._id,
          name: q.anonymousName || this.getFallbackAnonymousName(q._id),
          role: 'student'
        };
      }
      return q;
    });

    await resolveAvatarUrl(processedData, this.fileService);

    return createPageableData(processedData, total, page, limit);
  }

  // Admin search - KHÔNG ẩn danh, admin nhìn thấy userId thật + đánh dấu isAnonymous
  async searchForAdmin(query: SearchQuestionDto) {
    const { page = 1, limit = 10, q, status, tagSlug, userId, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (q) {
      const normalized = '(?<![a-zA-Z0-9_])' + q.trim().replace(/\s+/g, ' ').split(' ').map(w => this.buildDiacriticRegex(w)).join('\\s+') + '(?![a-zA-Z0-9_])';
      filter.$or = [
        { title: { $regex: normalized, $options: 'i' } },
        { content: { $regex: normalized, $options: 'i' } }
      ];
    }
    if (status) filter.status = status;
    if (userId) filter.userId = new Types.ObjectId(userId);

    if (tagSlug) {
      try {
        const topic = await this.tagService.findBySlug(tagSlug);
        filter.topicId = topic._id;
      } catch {
        return createPageableData([], 0, page, limit);
      }
    }

    let sortObj: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    if (sortBy === 'popular') {
      sortObj = { answerCount: -1, viewCount: -1, voteScore: -1, createdAt: -1 };
    } else if (sortBy === 'votes') {
      sortObj = { voteScore: -1, createdAt: -1 };
    } else if (sortBy === 'unanswered') {
      filter.answerCount = 0;
      sortObj = { createdAt: -1 };
    } else if (sortBy === 'discussing') {
      filter.answerCount = { $gt: 0 };
      filter.status = { $ne: 'resolved' };
      sortObj = { createdAt: -1 };
    }

    const [data, total] = await Promise.all([
      this.questionModel.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate('topicId')
        .populate('userId', 'name firstName lastName role avatarId avatarUrl userCode')
        .lean(),
      this.questionModel.countDocuments(filter)
    ]);

    await resolveAvatarUrl(data, this.fileService);

    return createPageableData(data, total, page, limit);
  }

  async close(id: string, userId: string, userRole: string) {
    const question = await this.questionModel.findById(id);
    if (!question) throw new NotFoundException('Không tìm thấy câu hỏi');
    if (question.userId.toString() !== userId.toString() && !['admin', 'teacher'].includes(userRole)) {
      throw new ForbiddenException('Bạn không có quyền đóng câu hỏi này');
    }
    return this.questionModel.findByIdAndUpdate(id, { status: 'closed', updatedAt: new Date() }, { new: true }).lean();
  }

  async resolve(id: string, userId: string) {
    const question = await this.questionModel.findById(id);
    if (!question) throw new NotFoundException('Không tìm thấy câu hỏi');
    if (question.userId.toString() !== userId.toString()) {
      throw new ForbiddenException('Chỉ người đặt câu hỏi mới được đánh dấu đã giải quyết');
    }
    return this.questionModel.findByIdAndUpdate(id, { status: 'resolved', updatedAt: new Date() }, { new: true }).lean();
  }
}
