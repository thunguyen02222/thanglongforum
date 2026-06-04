import {
  IsString,
  IsNotEmpty,
  IsOptional
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCommentDto {
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsNotEmpty({ message: 'Nội dung bình luận không được để trống' })
  content: string;
}

export class UpdateCommentDto {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  content?: string;
}
