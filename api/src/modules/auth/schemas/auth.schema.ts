import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'auths', timestamps: true })
export class Auth extends Document {
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, lowercase: true })
  email: string;

  @Prop({ required: true, lowercase: true })
  username: string;

  @Prop({ default: '' })
  password: string;

  @Prop({ default: '' })
  salt: string;

  @Prop({ default: 'local', enum: ['local', 'google'] })
  provider: string;

  @Prop()
  googleId?: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const AuthSchema = SchemaFactory.createForClass(Auth);
