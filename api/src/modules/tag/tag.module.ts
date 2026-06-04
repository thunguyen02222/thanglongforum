import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tag, TagSchema } from './schemas';
import { TagService } from './services/tag.service';
import { TagController, AdminTagController } from './controllers/tag.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tag.name, schema: TagSchema }
    ]),
    forwardRef(() => AuthModule)
  ],
  controllers: [TagController, AdminTagController],
  providers: [TagService],
  exports: [TagService]
})
export class TagModule {}
