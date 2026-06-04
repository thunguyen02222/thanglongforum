import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'poll_options', timestamps: true })
export class PollOption extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Question', required: true })
  questionId: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ default: 0 })
  voteCount: number;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const PollOptionSchema = SchemaFactory.createForClass(PollOption);
