import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'users', timestamps: true })
export class User extends Document {
  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, lowercase: true, unique: true })
  email: string;

  @Prop({ required: true, lowercase: true, unique: true })
  username: string;

  @Prop({ unique: true, sparse: true })
  userCode?: string;

  @Prop({ default: 'student', enum: ['admin', 'student', 'teacher'] })
  role: string;

  @Prop({ default: 'active', enum: ['active', 'inactive', 'deleted'] })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'classes' })
  classId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'files' })
  avatarId?: Types.ObjectId;

  @Prop()
  avatarUrl?: string;

  @Prop()
  phone?: string;

  @Prop()
  department?: string; // Khoa

  @Prop()
  major?: string; // Ngành

  @Prop()
  studentClass?: string; // Lớp

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
