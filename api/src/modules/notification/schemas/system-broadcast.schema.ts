import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'system_broadcasts', timestamps: true })
export class SystemBroadcast extends Document {
  @Prop({ required: true })
  message: string;

  @Prop()
  targetRole?: string;

  @Prop({ default: 0 })
  sentCount: number;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const SystemBroadcastSchema = SchemaFactory.createForClass(SystemBroadcast);
