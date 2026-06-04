import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { VoteService } from '../services/vote.service';
import { CreateVoteDto } from '../dtos/vote.dto';
import { DataResponse } from 'src/kernel/models/data-response.model';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';

@Controller()
export class VoteController {
  constructor(private readonly voteService: VoteService) {}

  @Post('answers/:answerId/vote')
  @UseGuards(AuthGuard)
  async toggle(
    @Param('answerId') answerId: string,
    @CurrentUser('_id') userId: string,
    @Body() dto: CreateVoteDto
  ) {
    const result = await this.voteService.toggle(answerId, userId, dto);
    return DataResponse.ok(result);
  }

  @Get('answers/:answerId/vote')
  @UseGuards(AuthGuard)
  async getMyVote(
    @Param('answerId') answerId: string,
    @CurrentUser('_id') userId: string
  ) {
    const result = await this.voteService.getMyVote(answerId, userId);
    return DataResponse.ok(result);
  }
}
