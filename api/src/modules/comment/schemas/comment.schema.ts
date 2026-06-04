import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'comments', timestamps: true })
export class Comment extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Answer', required: true })
  answerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ type: [{ editedAt: Date, content: String }], default: [] })
  editHistory: { editedAt: Date; content: string }[];
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
