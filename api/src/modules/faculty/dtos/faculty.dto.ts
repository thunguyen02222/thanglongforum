import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsMongoId
} from 'class-validator';
import { SearchRequest } from 'src/kernel/common/search-request';

export class CreateFacultyDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên khoa không được để trống' })
  name: string;

  @IsString()
  @IsOptional()
  shortName?: string;
}

export class UpdateFacultyDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  shortName?: string;
}

export class CreateMajorDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên ngành không được để trống' })
  name: string;

  @IsString()
  @IsOptional()
  shortName?: string;

  @IsMongoId({ message: 'facultyId không hợp lệ' })
  @IsNotEmpty({ message: 'facultyId không được để trống' })
  facultyId: string;
}

export class UpdateMajorDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  shortName?: string;

  @IsMongoId({ message: 'facultyId không hợp lệ' })
  @IsOptional()
  facultyId?: string;
}

export class CreateClassDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên lớp không được để trống' })
  name: string;

  @IsString()
  @IsOptional()
  shortName?: string;

  @IsMongoId({ message: 'majorId không hợp lệ' })
  @IsNotEmpty({ message: 'majorId không được để trống' })
  majorId: string;
}

export class UpdateClassDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  shortName?: string;

  @IsMongoId({ message: 'majorId không hợp lệ' })
  @IsOptional()
  majorId?: string;
}

export class SearchFacultyDto extends SearchRequest {}

export class SearchMajorDto extends SearchRequest {
  @IsMongoId()
  @IsOptional()
  facultyId?: string;
}

export class SearchClassDto extends SearchRequest {
  @IsMongoId()
  @IsOptional()
  majorId?: string;
}
