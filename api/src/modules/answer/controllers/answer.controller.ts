import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AnswerService } from '../services/answer.service';
import { CreateAnswerDto, UpdateAnswerDto } from '../dtos/answer.dto';
import { DataResponse } from 'src/kernel/models/data-response.model';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';

@Controller()
export class AnswerController {
  constructor(private readonly answerService: AnswerService) {}

  @Get('questions/:questionId/answers')
  async findByQuestion(
    @Param('questionId') questionId: string,
    @Query('sort') sort?: string
  ) {
    const result = await this.answerService.findByQuestion(questionId, sort);
    return DataResponse.ok(result);
  }

  @Post('questions/:questionId/answers')
  @UseGuards(AuthGuard)
  async create(
    @Param('questionId') questionId: string,
    @CurrentUser('_id') userId: string,
    @Body() dto: CreateAnswerDto
  ) {
    const result = await this.answerService.create(questionId, userId, dto);
    return DataResponse.ok(result);
  }

  @Put('answers/:id')
  @UseGuards(AuthGuard)
  async update(
    @Param('id') id: string,
    @CurrentUser('_id') userId: string,
    @Body() dto: UpdateAnswerDto
  ) {
    const result = await this.answerService.update(id, userId, dto);
    return DataResponse.ok(result);
  }

  @Delete('answers/:id')
  @UseGuards(AuthGuard)
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    const result = await this.answerService.delete(id, user._id, user.role);
    return DataResponse.ok(result);
  }

  @Put('answers/:id/accept')
  @UseGuards(AuthGuard)
  async accept(@Param('id') id: string, @CurrentUser() user: any) {
    const result = await this.answerService.acceptAnswer(id, user._id, user.role);
    return DataResponse.ok(result);
  }

  @Put('answers/:id/pin')
  @UseGuards(AuthGuard)
  async pin(@Param('id') id: string, @CurrentUser() user: any) {
    const result = await this.answerService.pinAnswer(id, user._id, user.role);
    return DataResponse.ok(result);
  }
}
