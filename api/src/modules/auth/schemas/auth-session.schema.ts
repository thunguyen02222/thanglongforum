import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'auth_sessions', timestamps: true })
export class AuthSession extends Document {
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  token: string;

  @Prop()
  userAgent?: string;

  @Prop()
  ipAddress?: string;

  @Prop({ default: Date.now })
  expiresAt: Date;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const AuthSessionSchema = SchemaFactory.createForClass(AuthSession);

