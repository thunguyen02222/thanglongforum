import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'notifications', timestamps: true })
export class Notification extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: ['answer', 'comment', 'vote', 'accept', 'follow', 'system'] })
  type: string;

  @Prop()
  message: string;

  @Prop({ type: Types.ObjectId, ref: 'Question' })
  questionId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  actorId?: Types.ObjectId;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'SystemBroadcast' })
  broadcastId?: Types.ObjectId;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
