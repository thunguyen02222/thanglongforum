import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'votes', timestamps: true })
export class Vote extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Answer', required: true })
  answerId: Types.ObjectId;

  @Prop({ required: true, enum: [1, -1] })
  type: number;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const VoteSchema = SchemaFactory.createForClass(Vote);
VoteSchema.index({ userId: 1, answerId: 1 }, { unique: true });
