import { Controller, Get, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { AnswerService } from '../services/answer.service';
import { SearchAnswerDto } from '../dtos/answer.dto';
import { DataResponse } from 'src/kernel/models/data-response.model';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { RoleGuard } from 'src/modules/auth/guards/role.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';

@Controller('admin/answers')
@UseGuards(AuthGuard, RoleGuard)
@Roles('admin')
export class AdminAnswerController {
  constructor(private readonly answerService: AnswerService) {}

  @Get()
  async findAll(@Query() query: SearchAnswerDto) {
    const result = await this.answerService.adminSearch(query);
    return DataResponse.ok(result);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const result = await this.answerService.delete(id, 'admin', 'admin');
    return DataResponse.ok(result);
  }
}
