import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'poll_votes', timestamps: true })
export class PollVote extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Question', required: true })
  questionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'PollOption', required: true })
  optionId: Types.ObjectId;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const PollVoteSchema = SchemaFactory.createForClass(PollVote);
PollVoteSchema.index({ userId: 1, questionId: 1 }, { unique: true });
