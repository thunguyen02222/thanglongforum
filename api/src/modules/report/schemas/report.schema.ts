import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'reports', timestamps: true })
export class Report extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: ['question', 'answer', 'comment'] })
  targetType: string;

  @Prop({ type: Types.ObjectId, required: true })
  targetId: Types.ObjectId;

  @Prop({ required: true })
  reason: string;

  @Prop()
  description?: string;

  @Prop({ default: 'pending', enum: ['pending', 'resolved', 'rejected'] })
  status: string;

  @Prop()
  adminNote?: string;

  @Prop()
  targetContent?: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
