import {
  IsNumber,
  IsIn
} from 'class-validator';

export class CreateVoteDto {
  @IsNumber()
  @IsIn([1, -1], { message: 'Vote type phải là 1 (upvote) hoặc -1 (downvote)' })
  type: number;
}
