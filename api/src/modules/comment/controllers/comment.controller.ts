import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CommentService } from '../services/comment.service';
import { CreateCommentDto, UpdateCommentDto } from '../dtos/comment.dto';
import { DataResponse } from 'src/kernel/models/data-response.model';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';

@Controller()
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get('answers/:answerId/comments')
  async findByAnswer(@Param('answerId') answerId: string) {
    const result = await this.commentService.findByAnswer(answerId);
    return DataResponse.ok(result);
  }

  @Post('answers/:answerId/comments')
  @UseGuards(AuthGuard)
  async create(
    @Param('answerId') answerId: string,
    @CurrentUser('_id') userId: string,
    @Body() dto: CreateCommentDto
  ) {
    const result = await this.commentService.create(answerId, userId, dto);
    return DataResponse.ok(result);
  }

  @Put('comments/:id')
  @UseGuards(AuthGuard)
  async update(
    @Param('id') id: string,
    @CurrentUser('_id') userId: string,
    @Body() dto: UpdateCommentDto
  ) {
    const result = await this.commentService.update(id, userId, dto);
    return DataResponse.ok(result);
  }

  @Delete('comments/:id')
  @UseGuards(AuthGuard)
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    const result = await this.commentService.delete(id, user._id, user.role);
    return DataResponse.ok(result);
  }
}
