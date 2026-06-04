import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'answers', timestamps: true })
export class Answer extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Question', required: true })
  questionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ default: false })
  isAccepted: boolean;

  @Prop({ default: false })
  isPinned: boolean;

  @Prop({ default: 0 })
  voteScore: number;

  @Prop({ default: 0 })
  commentCount: number;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ type: [{ editedAt: Date, content: String }], default: [] })
  editHistory: { editedAt: Date; content: string }[];
}

export const AnswerSchema = SchemaFactory.createForClass(Answer);
