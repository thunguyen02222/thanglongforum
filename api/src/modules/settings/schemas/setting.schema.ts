import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'settings', timestamps: true })
export class Setting extends Document {
  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ type: Object, required: true })
  value: any;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ default: 'text' })
  type: string;

  @Prop()
  group?: string;

  @Prop({ default: 0 })
  ordering: number;

  @Prop({ default: true })
  visible: boolean;

  @Prop({ default: true })
  editable: boolean;

  @Prop({ default: false })
  public: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const SettingSchema = SchemaFactory.createForClass(Setting);

