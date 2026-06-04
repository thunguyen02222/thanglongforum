import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoDBModule } from 'src/kernel';
import { FileService, VideoThumbnailService } from './services';
import { FileController } from './controllers';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { File, FileSchema } from './schemas/file.schema';

@Module({
  imports: [
    ConfigModule,
    MongoDBModule,
    MongooseModule.forFeature([{ name: File.name, schema: FileSchema }]),
    forwardRef(() => AuthModule),
    forwardRef(() => UserModule)
  ],
  controllers: [FileController],
  providers: [
    FileService,
    VideoThumbnailService
  ],
  exports: [FileService, VideoThumbnailService]
})
export class FileModule {}
