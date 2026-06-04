import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'files', timestamps: true })
export class File extends Document {
  @Prop({ default: '' })
  type: string;

  @Prop({ default: '' })
  name: string;

  @Prop({ default: '' })
  fileName: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: '' })
  mimeType: string;

  @Prop({ default: 'diskStorage' })
  server: string;

  @Prop({ default: '' })
  path: string;

  @Prop({ default: '' })
  absolutePath: string;

  @Prop({ default: '' })
  publicUrl: string;

  @Prop({ default: 500 })
  width: number;

  @Prop({ default: 500 })
  height: number;

  @Prop({ default: 0 })
  size: number;

  @Prop({ default: '' })
  status: string;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;

  @Prop({ default: '' })
  thumbnailPath: string;

  @Prop({ default: '' })
  thumbnailAbsolutePath: string;

  @Prop({ type: Types.ObjectId })
  uploadedBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  createdBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  updatedBy?: Types.ObjectId;
}

export const FileSchema = SchemaFactory.createForClass(File);
