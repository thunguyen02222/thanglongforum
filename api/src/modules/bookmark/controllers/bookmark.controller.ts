import { Controller, Get, Post, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { BookmarkService } from '../services/bookmark.service';
import { DataResponse } from 'src/kernel/models/data-response.model';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';

@Controller('bookmarks')
@UseGuards(AuthGuard)
export class BookmarkController {
  constructor(private readonly bookmarkService: BookmarkService) {}

  @Get()
  async findMyBookmarks(
    @CurrentUser('_id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const result = await this.bookmarkService.findByUser(userId, Number(page) || 1, Number(limit) || 10);
    return DataResponse.ok(result);
  }

  @Post('questions/:questionId')
  async toggle(
    @CurrentUser('_id') userId: string,
    @Param('questionId') questionId: string
  ) {
    const result = await this.bookmarkService.toggle(userId, questionId);
    return DataResponse.ok(result);
  }

  @Get('questions/:questionId')
  async isBookmarked(
    @CurrentUser('_id') userId: string,
    @Param('questionId') questionId: string
  ) {
    const result = await this.bookmarkService.isBookmarked(userId, questionId);
    return DataResponse.ok(result);
  }

  @Delete('questions/:questionId')
  async remove(
    @CurrentUser('_id') userId: string,
    @Param('questionId') questionId: string
  ) {
    const result = await this.bookmarkService.removeBookmark(userId, questionId);
    return DataResponse.ok(result);
  }
}
