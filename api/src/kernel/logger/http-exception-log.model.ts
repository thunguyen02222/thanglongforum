import * as mongoose from 'mongoose';
import { HttpExceptionLogSchema } from './http-exception-log.schema';

mongoose.connect(process.env.MONGO_URI || '');

export const HttpExceptionLogModel = mongoose.model(
  'HttpExceptionLog',
  HttpExceptionLogSchema
);

