import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'faculties', timestamps: true })
export class Faculty extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  shortName?: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const FacultySchema = SchemaFactory.createForClass(Faculty);
