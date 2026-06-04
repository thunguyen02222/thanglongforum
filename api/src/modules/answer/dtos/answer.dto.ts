import {
  IsString,
  IsNotEmpty,
  IsOptional
} from 'class-validator';
import { Transform } from 'class-transformer';
import { SearchRequest } from 'src/kernel/common/search-request';

export class CreateAnswerDto {
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsNotEmpty({ message: 'Nội dung không được để trống' })
  content: string;
}

export class UpdateAnswerDto {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  content?: string;
}

export class SearchAnswerDto extends SearchRequest {
  @IsString()
  @IsOptional()
  questionId?: string;
}
