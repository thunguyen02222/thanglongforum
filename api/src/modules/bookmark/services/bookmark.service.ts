import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Bookmark } from '../schemas/bookmark.schema';
import { createPageableData } from 'src/kernel/common/pageable-data';

@Injectable()
export class BookmarkService {
  constructor(@InjectModel(Bookmark.name) private bookmarkModel: Model<Bookmark>) {}

  async toggle(userId: string, questionId: string) {
    const userObjId = new Types.ObjectId(userId);
    const questionObjId = new Types.ObjectId(questionId);

    const existing = await this.bookmarkModel.findOne({ userId: userObjId, questionId: questionObjId });
    if (existing) {
      await this.bookmarkModel.findByIdAndDelete(existing._id);
      return { bookmarked: false };
    }

    await this.bookmarkModel.create({ userId: userObjId, questionId: questionObjId });
    return { bookmarked: true };
  }

  async isBookmarked(userId: string, questionId: string) {
    const doc = await this.bookmarkModel.findOne({
      userId: new Types.ObjectId(userId),
      questionId: new Types.ObjectId(questionId)
    });
    return { bookmarked: !!doc };
  }

  async findByUser(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const filter = { userId: new Types.ObjectId(userId) };

    const [data, total] = await Promise.all([
      this.bookmarkModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'questionId',
          populate: [
            { path: 'userId', select: 'name firstName lastName role avatarId' },
            { path: 'tagIds' }
          ]
        })
        .lean(),
      this.bookmarkModel.countDocuments(filter)
    ]);

    return createPageableData(data, total, page, limit);
  }

  async removeBookmark(userId: string, questionId: string) {
    await this.bookmarkModel.deleteOne({
      userId: new Types.ObjectId(userId),
      questionId: new Types.ObjectId(questionId)
    });
    return { message: 'Đã xóa bookmark' };
  }
}
