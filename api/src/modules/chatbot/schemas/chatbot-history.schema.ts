import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'chatbotHistories', timestamps: true })
export class ChatbotHistory extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ default: 'Cuộc trò chuyện mới' })
  title: string;

  @Prop({ type: [{ role: String, content: String, createdAt: { type: Date, default: Date.now } }], default: [] })
  messages: { role: string; content: string; createdAt: Date }[];

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ChatbotHistorySchema = SchemaFactory.createForClass(ChatbotHistory);
