import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  ValidateIf
} from 'class-validator';

export class LoginDto {
  @ValidateIf((o) => !o.username)
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @ValidateIf((o) => !o.email)
  @IsString()
  @MinLength(3, { message: 'Username phải có ít nhất 3 ký tự' })
  username?: string;

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password: string;
}

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên không được để trống' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Username không được để trống' })
  @MinLength(3, { message: 'Username phải có ít nhất 3 ký tự' })
  @MaxLength(30, { message: 'Username không được quá 30 ký tự' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username chỉ được chứa chữ cái, số và dấu gạch dưới'
  })
  username: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;
}

export class GoogleLoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Id token không được để trống' })
  idToken: string;
}

export class RequestPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã sinh viên/ Mã giảng viên không được để trống' })
  userCode: string;
}

export class ForgotPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập email, username hoặc MSSV' })
  identifier: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu hiện tại không được để trống' })
  currentPassword: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  newPassword: string;
}
