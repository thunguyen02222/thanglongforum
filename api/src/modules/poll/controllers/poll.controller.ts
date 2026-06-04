import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { PollService } from '../services/poll.service';
import { DataResponse } from 'src/kernel/models/data-response.model';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';

@Controller()
export class PollController {
  constructor(private readonly pollService: PollService) {}

  @Get('questions/:questionId/poll')
  async getResults(@Param('questionId') questionId: string) {
    const result = await this.pollService.getResults(questionId);
    return DataResponse.ok(result);
  }

  @Get('questions/:questionId/poll/my-vote')
  @UseGuards(AuthGuard)
  async getMyVote(
    @Param('questionId') questionId: string,
    @CurrentUser('_id') userId: string
  ) {
    const result = await this.pollService.getMyVote(questionId, userId);
    return DataResponse.ok(result);
  }

  @Post('questions/:questionId/poll/vote')
  @UseGuards(AuthGuard)
  async vote(
    @Param('questionId') questionId: string,
    @CurrentUser('_id') userId: string,
    @Body('optionId') optionId: string
  ) {
    const result = await this.pollService.vote(questionId, optionId, userId);
    return DataResponse.ok(result);
  }
}
