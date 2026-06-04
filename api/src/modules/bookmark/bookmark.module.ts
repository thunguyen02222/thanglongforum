import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Bookmark, BookmarkSchema } from './schemas';
import { BookmarkService } from './services/bookmark.service';
import { BookmarkController } from './controllers/bookmark.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bookmark.name, schema: BookmarkSchema }
    ]),
    forwardRef(() => AuthModule)
  ],
  controllers: [BookmarkController],
  providers: [BookmarkService],
  exports: [BookmarkService]
})
export class BookmarkModule {}
