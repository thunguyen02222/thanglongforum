import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'classes', timestamps: true })
export class Class extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  shortName?: string;

  @Prop({ type: Types.ObjectId, ref: 'majors', required: true })
  majorId: Types.ObjectId;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ClassSchema = SchemaFactory.createForClass(Class);
