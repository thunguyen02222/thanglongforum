import {
  IsString,
  IsNotEmpty,
  IsOptional
} from 'class-validator';
import { SearchRequest } from 'src/kernel/common/search-request';

export class CreateTagDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên tag không được để trống' })
  name: string;
}

export class UpdateTagDto {
  @IsString()
  @IsOptional()
  name?: string;
}

export class SearchTagDto extends SearchRequest {}
