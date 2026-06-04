import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { Auth } from '../schemas/auth.schema';
import { LoginDto, RegisterDto } from '../dtos/auth.dto';
import { UserService } from '../../user/services/user.service';
import { EmailService } from '../../email/email.service';
import { encryptPassword, generateSalt, generateRandomString } from 'src/kernel/helpers/string.helper';
import { FileService } from '../../file/services/file.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Auth.name) private authModel: Model<Auth>,
    private jwtService: JwtService,
    private userService: UserService,
    private emailService: EmailService,
    private fileService: FileService
  ) {}

  async getMe(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) return null;

    let avatarUrl = (user as any).avatarUrl || null;
    if (!avatarUrl && (user as any).avatarId) {
      const fileDto = await this.fileService.getById((user as any).avatarId.toString());
      if (fileDto) avatarUrl = fileDto.getUrl();
    }

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      status: user.status,
      userCode: (user as any).userCode,
      avatarId: (user as any).avatarId,
      avatarUrl,
      phone: (user as any).phone,
      createdAt: (user as any).createdAt,
      updatedAt: (user as any).updatedAt
    };
  }

  async login(loginDto: LoginDto) {
    const { email, username, password } = loginDto;

    if (!email && !username) {
      throw new BadRequestException('Email hoặc username là bắt buộc');
    }

    const identifier = (email || username || '').trim().toLowerCase();
    let auth = await this.authModel.findOne({
      $or: [
        { email: identifier },
        { username: identifier }
      ]
    });

    // Fallback: thử tìm theo userCode nếu không có kết quả
    if (!auth) {
      const userByCode = await this.userService.findByUserCode((email || username || '').trim());
      if (userByCode) {
        auth = await this.authModel.findOne({ userId: userByCode._id });
      }
    }

    if (!auth) {
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    }

    if (auth.provider === 'google') {
      throw new UnauthorizedException('Tài khoản này đăng ký bằng Google. Vui lòng đăng nhập bằng Google.');
    }

    const encryptedPassword = encryptPassword(password, auth.salt);
    if (encryptedPassword !== auth.password) {
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    }

    const user = await this.userService.findById(auth.userId.toString());
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('tài khoản của bạn đã bị khóa');
    }

    const token = this.generateToken(user);

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      token
    };
  }

  async adminLogin(loginDto: LoginDto) {
    const { email, username, password } = loginDto;

    if (!email && !username) {
      throw new BadRequestException('Email hoặc username là bắt buộc');
    }

    const query = email
      ? { email: email.toLowerCase() }
      : { username: username.toLowerCase() };

    const auth = await this.authModel.findOne(query);
    if (!auth) {
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    }

    const encryptedPassword = encryptPassword(password, auth.salt);
    if (encryptedPassword !== auth.password) {
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    }

    const user = await this.userService.findById(auth.userId.toString());
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('tài khoản của bạn đã bị khóa');
    }

    if (user.role !== 'admin') {
      throw new UnauthorizedException('Bạn không có quyền truy cập');
    }

    const token = this.generateToken(user);

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      token
    };
  }

  async register(registerDto: RegisterDto) {
    const { name, username, email, password } = registerDto;

    const existingAuthByEmail = await this.authModel.findOne({
      email: email.toLowerCase()
    });
    if (existingAuthByEmail) {
      throw new BadRequestException('Email đã được sử dụng');
    }

    const existingAuthByUsername = await this.authModel.findOne({
      username: username.toLowerCase()
    });
    if (existingAuthByUsername) {
      throw new BadRequestException('Username đã được sử dụng');
    }

    const user = await this.userService.create({
      name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      role: 'student',
      status: 'active'
    });

    const salt = generateSalt();
    const hashedPassword = encryptPassword(password, salt);

    await this.authModel.create({
      userId: user._id,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password: hashedPassword,
      salt
    });

    const token = this.generateToken(user);

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      token
    };
  }

  async requestPassword(userCode: string) {
    // Tìm user theo MSSV
    const user = await this.userService.findByUserCode(userCode);
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản với mã số này');
    }

    if (user.status !== 'active') {
      throw new BadRequestException('Tài khoản đã bị khóa');
    }

    // Kiểm tra nếu tài khoản đã được cấp mật khẩu
    const existingAuth = await this.authModel.findOne({ userId: user._id });
    if (existingAuth && existingAuth.password) {
      throw new BadRequestException('Tài khoản đã được cấp mật khẩu');
    }

    // Generate random password
    const rawPassword = generateRandomString(10);

    // Hash + update auth
    const salt = generateSalt();
    const hashedPassword = encryptPassword(rawPassword, salt);

    if (existingAuth) {
      existingAuth.password = hashedPassword;
      existingAuth.salt = salt;
      await existingAuth.save();
    } else {
      // Tạo auth mới nếu chưa có
      await this.authModel.create({
        userId: user._id,
        email: user.email,
        username: user.username,
        password: hashedPassword,
        salt
      });
    }

    // Gửi email
    try {
      await this.emailService.sendMail({
        to: user.email,
        subject: '🔑 Mật khẩu đăng nhập — Diễn đàn Hỏi đáp Sinh viên',
        html: `
        <div style="background:#f3f4f6;padding:40px 20px;font-family:'Segoe UI',Arial,sans-serif;">
          <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <div style="background:linear-gradient(135deg,#2563EB,#3B82F6);padding:28px 32px;text-align:center;">
              <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 12px;line-height:56px;font-size:28px;">🔑</div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;">Mật khẩu đăng nhập của bạn</h1>
            </div>
            <div style="padding:28px 32px;">
              <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
                Xin chào <strong>${user.name}</strong>,<br>
                Hệ thống đã tạo mật khẩu đăng nhập cho tài khoản của bạn.
              </p>
              <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:16px;margin-bottom:20px;text-align:center;">
                <p style="margin:0 0 8px;color:#1E40AF;font-size:13px;font-weight:600;">Mật khẩu của bạn</p>
                <p style="margin:0;color:#1E40AF;font-size:24px;font-weight:700;letter-spacing:2px;">${rawPassword}</p>
              </div>
              <div style="background:#FEF3C7;border:1px solid #FDE68A;border-radius:10px;padding:16px;margin-bottom:20px;">
                <p style="margin:0;color:#92400E;font-size:14px;line-height:1.5;">
                  ⚠️ <strong>Lưu ý:</strong> Vui lòng đổi mật khẩu ngay sau khi đăng nhập lần đầu để bảo mật tài khoản.
                </p>
              </div>
              <p style="color:#6B7280;font-size:13px;margin:0;">
                <strong>Mã SV:</strong> ${userCode}<br>
                <strong>Email:</strong> ${user.email}
              </p>
            </div>
            <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #f3f4f6;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">Email tự động — vui lòng không trả lời</p>
            </div>
          </div>
        </div>`
      });
    } catch (err) {
      console.error('[RequestPassword] Gửi email thất bại:', err.message);
      throw new BadRequestException('Không thể gửi email. Vui lòng thử lại sau.');
    }

    return { message: 'Mật khẩu đã được gửi đến email của bạn' };
  }

  async forgotPassword(identifier: string) {
    const value = identifier.trim().toLowerCase();

    // Tìm auth theo email hoặc username
    let auth = await this.authModel.findOne({ email: value });
    if (!auth) {
      auth = await this.authModel.findOne({ username: value });
    }

    // Fallback: tìm theo userCode (MSSV)
    if (!auth) {
      const userByCode = await this.userService.findByUserCode(identifier.trim());
      if (userByCode) {
        auth = await this.authModel.findOne({ userId: userByCode._id });
      }
    }

    if (!auth || !auth.password) {
      throw new NotFoundException('Không tìm thấy tài khoản hoặc tài khoản chưa được cấp mật khẩu');
    }

    const user = await this.userService.findById(auth.userId.toString());
    if (!user || user.status !== 'active') {
      throw new BadRequestException('Tài khoản không hoạt động');
    }

    // Generate random password
    const rawPassword = generateRandomString(10);
    const salt = generateSalt();
    const hashedPassword = encryptPassword(rawPassword, salt);

    auth.password = hashedPassword;
    auth.salt = salt;
    await auth.save();

    // Gửi email
    try {
      await this.emailService.sendMail({
        to: user.email,
        subject: '🔐 Đặt lại mật khẩu — Diễn đàn Hỏi đáp Sinh viên',
        html: `
        <div style="background:#f3f4f6;padding:40px 20px;font-family:'Segoe UI',Arial,sans-serif;">
          <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <div style="background:linear-gradient(135deg,#DC2626,#EF4444);padding:28px 32px;text-align:center;">
              <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 12px;line-height:56px;font-size:28px;">🔐</div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;">Mật khẩu mới của bạn</h1>
            </div>
            <div style="padding:28px 32px;">
              <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
                Xin chào <strong>${user.name}</strong>,<br>
                Bạn đã yêu cầu đặt lại mật khẩu. Dưới đây là mật khẩu mới của bạn.
              </p>
              <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:16px;margin-bottom:20px;text-align:center;">
                <p style="margin:0 0 8px;color:#991B1B;font-size:13px;font-weight:600;">Mật khẩu mới</p>
                <p style="margin:0;color:#991B1B;font-size:24px;font-weight:700;letter-spacing:2px;">${rawPassword}</p>
              </div>
              <div style="background:#FEF3C7;border:1px solid #FDE68A;border-radius:10px;padding:16px;margin-bottom:20px;">
                <p style="margin:0;color:#92400E;font-size:14px;line-height:1.5;">
                  ⚠️ <strong>Lưu ý:</strong> Vui lòng đổi mật khẩu ngay sau khi đăng nhập để bảo mật tài khoản.
                </p>
              </div>
              <p style="color:#6B7280;font-size:13px;margin:0;">
                <strong>Email:</strong> ${user.email}
              </p>
            </div>
            <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #f3f4f6;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">Email tự động — vui lòng không trả lời</p>
            </div>
          </div>
        </div>`
      });
    } catch (err) {
      console.error('[ForgotPassword] Gửi email thất bại:', err.message);
      throw new BadRequestException('Không thể gửi email. Vui lòng thử lại sau.');
    }

    return { message: 'Mật khẩu mới đã được gửi đến email của bạn' };
  }

  async loginWithGoogle(idToken: string) {
    let payload: { email?: string; sub?: string; name?: string };
    try {
      const res = await axios.get(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
        { timeout: 10000 }
      );
      payload = res.data;
    } catch {
      throw new UnauthorizedException('Token Google không hợp lệ hoặc đã hết hạn');
    }

    const email = payload.email?.toLowerCase();
    const googleId = payload.sub;
    const name = payload.name || email?.split('@')[0] || 'User';

    if (!email || !googleId) {
      throw new UnauthorizedException('Thông tin từ Google không đủ');
    }

    let auth = await this.authModel.findOne({ googleId });
    if (!auth) {
      auth = await this.authModel.findOne({ email, provider: 'google' });
    }
    if (!auth) {
      const existingByEmail = await this.authModel.findOne({ email });
      if (existingByEmail) {
        throw new BadRequestException('Email này đã được đăng ký bằng tài khoản thường. Vui lòng đăng nhập bằng mật khẩu.');
      }

      const baseUsername = email.replace(/@.*$/, '').replace(/[^a-z0-9_]/g, '_').slice(0, 25) || 'user';
      let username = baseUsername;
      let suffix = 0;
      while (await this.authModel.findOne({ username: username.toLowerCase() })) {
        suffix += 1;
        username = `${baseUsername}_${suffix}`.slice(0, 30);
      }
      username = username.toLowerCase();

      const user = await this.userService.create({
        name,
        username,
        email,
        role: 'student',
        status: 'active'
      });

      const salt = generateSalt();
      const hashedPassword = encryptPassword(generateSalt(), salt);

      await this.authModel.create({
        userId: user._id,
        email,
        username,
        password: hashedPassword,
        salt,
        provider: 'google',
        googleId
      });

      const token = this.generateToken(user);
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        token
      };
    }

    const user = await this.userService.findById(auth.userId.toString());
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Tài khoản không hoạt động');
    }

    const token = this.generateToken(user);
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      token
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (currentPassword === newPassword) {
      throw new BadRequestException('Mật khẩu mới không được trùng với mật khẩu cũ');
    }

    const auth = await this.authModel.findOne({ userId });
    if (!auth) throw new BadRequestException('Không tìm thấy thông tin xác thực');

    if (auth.provider === 'google') {
      throw new BadRequestException('Tài khoản Google không hỗ trợ đổi mật khẩu');
    }

    const encrypted = encryptPassword(currentPassword, auth.salt);
    if (encrypted !== auth.password) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }

    const newSalt = generateSalt();
    const newHashed = encryptPassword(newPassword, newSalt);
    auth.password = newHashed;
    auth.salt = newSalt;
    await auth.save();

    return { message: 'Đổi mật khẩu thành công' };
  }

  private generateToken(user: any): string {
    const payload = {
      sub: user._id,
      email: user.email,
      username: user.username,
      role: user.role
    };
    return this.jwtService.sign(payload);
  }
}
