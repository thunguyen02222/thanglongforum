import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'questions', timestamps: true })
export class Question extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: 'text', enum: ['text', 'poll'] })
  type: string;

  @Prop({ default: false })
  isAnonymous: boolean;

  @Prop({ type: String })
  anonymousName: string;

  @Prop({ default: 'open', enum: ['open', 'closed', 'resolved'] })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'Tag', default: null })
  topicId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  viewerIds: Types.ObjectId[];

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0 })
  answerCount: number;

  @Prop({ default: 0 })
  voteScore: number;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ type: [{ editedAt: Date, title: String, content: String }], default: [] })
  editHistory: { editedAt: Date; title: string; content: string }[];
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
