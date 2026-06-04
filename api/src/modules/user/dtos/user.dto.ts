import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
  IsMongoId
} from 'class-validator';
import { SearchRequest } from 'src/kernel/common/search-request';

export class CreateUserDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên không được để trống' })
  name: string;

  @IsString()
  @IsOptional()
  @MinLength(3, { message: 'Username phải có ít nhất 3 ký tự' })
  @MaxLength(30, { message: 'Username không được quá 30 ký tự' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username chỉ được chứa chữ cái, số và dấu gạch dưới'
  })
  username?: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password?: string;

  @IsString()
  @IsOptional()
  userCode?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['admin', 'student', 'teacher'])
  role?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;

  @IsMongoId()
  @IsOptional()
  classId?: string;

  @IsString()
  @IsOptional()
  avatarId?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  major?: string;

  @IsString()
  @IsOptional()
  studentClass?: string;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @MinLength(3, { message: 'Username phải có ít nhất 3 ký tự' })
  @MaxLength(30, { message: 'Username không được quá 30 ký tự' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username chỉ được chứa chữ cái, số và dấu gạch dưới'
  })
  username?: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  userCode?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['admin', 'student', 'teacher'])
  role?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['active', 'inactive', 'deleted'])
  status?: string;

  @IsMongoId()
  @IsOptional()
  classId?: string;

  @IsString()
  @IsOptional()
  avatarId?: string;

  @IsString()
  @IsOptional()
  @Matches(/^(0[3-9]\d{8}|\+84[3-9]\d{8})$/, {
    message: 'Số điện thoại không hợp lệ (VD: 0901234567 hoặc +84901234567)'
  })
  phone?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  major?: string;

  @IsString()
  @IsOptional()
  studentClass?: string;
}

export class SearchUserDto extends SearchRequest {
  @IsString()
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsMongoId()
  @IsOptional()
  classId?: string;
}
