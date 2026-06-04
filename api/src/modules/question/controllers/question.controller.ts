import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { QuestionService } from '../services/question.service';
import { CreateQuestionDto, UpdateQuestionDto, SearchQuestionDto } from '../dtos/question.dto';
import { DataResponse } from 'src/kernel/models/data-response.model';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { OptionalAuthGuard } from 'src/modules/auth/guards/optional-auth.guard';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';

@Controller('questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Get()
  async search(@Query() query: SearchQuestionDto) {
    const result = await this.questionService.search(query);
    return DataResponse.ok(result);
  }

  @Get(':id')
  @UseGuards(OptionalAuthGuard)
  async findById(@Param('id') id: string, @CurrentUser('_id') userId?: string) {
    const result = await this.questionService.findById(id, userId);
    return DataResponse.ok(result);
  }

  @Post()
  @UseGuards(AuthGuard)
  async create(@CurrentUser('_id') userId: string, @Body() dto: CreateQuestionDto) {
    const result = await this.questionService.create(userId, dto);
    return DataResponse.ok(result);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async update(
    @Param('id') id: string,
    @CurrentUser('_id') userId: string,
    @Body() dto: UpdateQuestionDto
  ) {
    const result = await this.questionService.update(id, userId, dto);
    return DataResponse.ok(result);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    const result = await this.questionService.delete(id, user._id, user.role);
    return DataResponse.ok(result);
  }

  @Put(':id/close')
  @UseGuards(AuthGuard)
  async close(@Param('id') id: string, @CurrentUser() user: any) {
    const result = await this.questionService.close(id, user._id, user.role);
    return DataResponse.ok(result);
  }

  @Put(':id/resolve')
  @UseGuards(AuthGuard)
  async resolve(@Param('id') id: string, @CurrentUser('_id') userId: string) {
    const result = await this.questionService.resolve(id, userId);
    return DataResponse.ok(result);
  }
}
