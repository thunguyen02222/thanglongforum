import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification } from '../schemas/notification.schema';
import { createPageableData } from 'src/kernel/common/pageable-data';
import { UserConnectedGateway } from '../../websocket/gateways/user-connected.gateway';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    private readonly userConnectedGateway: UserConnectedGateway
  ) {}

  async create(data: {
    userId: string;
    type: string;
    message: string;
    questionId?: string;
    actorId?: string;
  }) {
    const notif = await this.notificationModel.create({
      userId: new Types.ObjectId(data.userId),
      type: data.type,
      message: data.message,
      questionId: data.questionId ? new Types.ObjectId(data.questionId) : undefined,
      actorId: data.actorId ? new Types.ObjectId(data.actorId) : undefined
    });

    const populated = await notif.populate([
      { path: 'actorId', select: 'name firstName lastName role avatarId' },
      { path: 'questionId', select: 'title' }
    ]);
    this.userConnectedGateway.emitToUser(data.userId, 'notification:new', populated);

    return notif;
  }

  async createForMany(userIds: string[], data: {
    type: string;
    message: string;
    questionId?: string;
    actorId?: string;
  }) {
    const docs = userIds.map((userId) => ({
      userId: new Types.ObjectId(userId),
      type: data.type,
      message: data.message,
      questionId: data.questionId ? new Types.ObjectId(data.questionId) : undefined,
      actorId: data.actorId ? new Types.ObjectId(data.actorId) : undefined
    }));
    const createdDocs = await this.notificationModel.insertMany(docs);
    
    // Emit for each user asynchronously
    createdDocs.forEach(async (doc) => {
      const populated = await doc.populate([
        { path: 'actorId', select: 'name firstName lastName role avatarId' },
        { path: 'questionId', select: 'title' }
      ]);
      this.userConnectedGateway.emitToUser(doc.userId.toString(), 'notification:new', populated);
    });

    return createdDocs;
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const filter = { userId: new Types.ObjectId(userId) };

    const [data, total] = await Promise.all([
      this.notificationModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actorId', 'name firstName lastName role avatarId')
        .populate('questionId', 'title')
        .lean(),
      this.notificationModel.countDocuments(filter)
    ]);

    return createPageableData(data, total, page, limit);
  }

  async countUnread(userId: string) {
    return this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.notificationModel.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      { isRead: true, updatedAt: new Date() },
      { new: true }
    ).lean();
  }

  async markAllAsRead(userId: string) {
    await this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { isRead: true, updatedAt: new Date() }
    );
    return { message: 'Đã đánh dấu tất cả đã đọc' };
  }

  async sendSystem(userIds: string[], message: string, broadcastId?: string) {
    const docs = userIds.map((uid) => ({
      userId: new Types.ObjectId(uid),
      type: 'system',
      message,
      broadcastId: broadcastId ? new Types.ObjectId(broadcastId) : undefined
    }));
    return this.notificationModel.insertMany(docs);
  }

  async deleteByBroadcastId(broadcastId: string): Promise<any> {
    return this.notificationModel.deleteMany({
      broadcastId: new Types.ObjectId(broadcastId)
    });
  }
}
