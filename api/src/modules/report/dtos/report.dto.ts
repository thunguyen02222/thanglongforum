import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum
} from 'class-validator';

export class CreateReportDto {
  @IsString()
  @IsEnum(['question', 'answer', 'comment'], { message: 'Target type phải là question, answer hoặc comment' })
  targetType: string;

  @IsString()
  @IsNotEmpty()
  targetId: string;

  @IsString()
  @IsNotEmpty({ message: 'Lý do không được để trống' })
  reason: string;

  @IsString()
  @IsOptional()
  description?: string;
}
