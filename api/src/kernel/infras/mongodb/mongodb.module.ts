import { Global, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { MONGODB_PROVIDER } from './mongodb.provider';

@Global()
@Module({
  providers: [
    {
      provide: MONGODB_PROVIDER,
      useFactory: (connection: Connection): Connection => {
        return connection;
      },
      inject: [getConnectionToken()]
    }
  ],
  exports: [MONGODB_PROVIDER]
})
export class MongoDBModule {}
