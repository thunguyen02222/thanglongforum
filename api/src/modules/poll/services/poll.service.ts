import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PollOption } from '../schemas/poll-option.schema';
import { PollVote } from '../schemas/poll-vote.schema';

@Injectable()
export class PollService {
  constructor(
    @InjectModel(PollOption.name) private pollOptionModel: Model<PollOption>,
    @InjectModel(PollVote.name) private pollVoteModel: Model<PollVote>
  ) {}

  async createOptions(questionId: string, options: string[]) {
    if (!options?.length || options.length < 2) {
      throw new BadRequestException('Poll cần ít nhất 2 lựa chọn');
    }
    const docs = options.map((content) => ({
      questionId: new Types.ObjectId(questionId),
      content: content.trim()
    }));
    return this.pollOptionModel.insertMany(docs);
  }

  async addMissingOptions(questionId: string, options: string[]) {
    const normalizedOptions = (options || [])
      .map((content) => content?.trim())
      .filter(Boolean) as string[];

    const existingOptions = await this.getOptions(questionId);
    const existingContents = new Set(
      existingOptions.map((option: any) => option.content.trim().toLowerCase())
    );

    const seenNewOptions = new Set<string>();
    const newOptions = normalizedOptions.filter((content) => {
      const normalized = content.toLowerCase();
      if (existingContents.has(normalized) || seenNewOptions.has(normalized)) {
        return false;
      }
      seenNewOptions.add(normalized);
      return true;
    });

    const totalOptions = existingOptions.length + newOptions.length;
    if (totalOptions < 2) {
      throw new BadRequestException('Poll cần ít nhất 2 lựa chọn');
    }

    if (!newOptions.length) {
      return existingOptions;
    }

    await this.pollOptionModel.insertMany(
      newOptions.map((content) => ({
        questionId: new Types.ObjectId(questionId),
        content
      }))
    );

    return this.getOptions(questionId);
  }

  async getOptions(questionId: string) {
    return this.pollOptionModel.find({ questionId: new Types.ObjectId(questionId) })
      .sort({ createdAt: 1 })
      .lean();
  }

  async vote(questionId: string, optionId: string, userId: string) {
    const questionObjId = new Types.ObjectId(questionId);
    const userObjId = new Types.ObjectId(userId);
    const optionObjId = new Types.ObjectId(optionId);

    // Kiểm tra option tồn tại
    const option = await this.pollOptionModel.findOne({ _id: optionObjId, questionId: questionObjId });
    if (!option) throw new NotFoundException('Không tìm thấy lựa chọn');

    // Kiểm tra đã vote chưa
    const existingVote = await this.pollVoteModel.findOne({ userId: userObjId, questionId: questionObjId });

    if (existingVote) {
      // Đã vote → đổi vote
      if (existingVote.optionId.toString() === optionId) {
        throw new BadRequestException('Bạn đã chọn lựa chọn này rồi');
      }
      // Giảm count option cũ
      await this.pollOptionModel.findByIdAndUpdate(existingVote.optionId, { $inc: { voteCount: -1 } });
      // Tăng count option mới
      await this.pollOptionModel.findByIdAndUpdate(optionObjId, { $inc: { voteCount: 1 } });
      // Cập nhật vote
      existingVote.optionId = optionObjId;
      await existingVote.save();
    } else {
      // Chưa vote → tạo mới
      await this.pollVoteModel.create({ userId: userObjId, questionId: questionObjId, optionId: optionObjId });
      await this.pollOptionModel.findByIdAndUpdate(optionObjId, { $inc: { voteCount: 1 } });
    }

    // Trả về kết quả poll hiện tại
    const options = await this.getOptions(questionId);
    const myVote = await this.pollVoteModel.findOne({ userId: userObjId, questionId: questionObjId }).lean();
    return { options, myVote };
  }

  async getMyVote(questionId: string, userId: string) {
    return this.pollVoteModel.findOne({
      userId: new Types.ObjectId(userId),
      questionId: new Types.ObjectId(questionId)
    }).lean();
  }

  async getResults(questionId: string) {
    const options = await this.getOptions(questionId);
    const totalVotes = options.reduce((sum: number, o: any) => sum + (o.voteCount || 0), 0);
    return { options, totalVotes };
  }

  async deleteByQuestion(questionId: string) {
    const questionObjId = new Types.ObjectId(questionId);
    await this.pollOptionModel.deleteMany({ questionId: questionObjId });
    await this.pollVoteModel.deleteMany({ questionId: questionObjId });
  }
}
