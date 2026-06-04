import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'majors', timestamps: true })
export class Major extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  shortName?: string;

  @Prop({ type: Types.ObjectId, ref: 'faculties', required: true })
  facultyId: Types.ObjectId;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const MajorSchema = SchemaFactory.createForClass(Major);
