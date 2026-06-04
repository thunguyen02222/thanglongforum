import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  MaxLength
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { SearchRequest } from 'src/kernel/common/search-request';

export class CreateQuestionDto {
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @MaxLength(200, { message: 'Tiêu đề không được vượt quá 200 ký tự' })
  title: string;

  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsNotEmpty({ message: 'Nội dung không được để trống' })
  content: string;

  @IsString()
  @IsOptional()
  @IsEnum(['text', 'poll'], { message: 'Type phải là text hoặc poll' })
  type?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isAnonymous?: boolean;

  @IsString()
  @IsOptional()
  topicId?: string;

  @IsArray()
  @IsOptional()
  @Transform(({ value }) => Array.isArray(value) ? value.map((item) => typeof item === 'string' ? item.trim() : item) : value)
  @IsString({ each: true })
  pollOptions?: string[];
}

export class UpdateQuestionDto {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @MaxLength(200, { message: 'Tiêu đề không được vượt quá 200 ký tự' })
  title?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  content?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isAnonymous?: boolean;

  @IsString()
  @IsOptional()
  topicId?: string;

  @IsArray()
  @IsOptional()
  @Transform(({ value }) => Array.isArray(value) ? value.map((item) => typeof item === 'string' ? item.trim() : item) : value)
  @IsString({ each: true })
  pollOptions?: string[];
}

export class SearchQuestionDto extends SearchRequest {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  tagSlug?: string;

  @IsString()
  @IsOptional()
  userId?: string;
}
