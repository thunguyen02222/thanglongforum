import { Controller, Get, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { QuestionService } from '../services/question.service';
import { SearchQuestionDto } from '../dtos/question.dto';
import { DataResponse } from 'src/kernel/models/data-response.model';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { RoleGuard } from 'src/modules/auth/guards/role.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';

@Controller('admin/questions')
@UseGuards(AuthGuard, RoleGuard)
@Roles('admin')
export class AdminQuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Get()
  async findAll(@Query() query: SearchQuestionDto) {
    const result = await this.questionService.searchForAdmin(query);
    return DataResponse.ok(result);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const result = await this.questionService.delete(id, 'admin', 'admin');
    return DataResponse.ok(result);
  }
}
