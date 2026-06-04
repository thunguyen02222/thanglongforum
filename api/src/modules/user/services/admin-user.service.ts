import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';
import { CreateUserDto, UpdateUserDto, SearchUserDto } from '../dtos/user.dto';
import { createPageableData } from 'src/kernel/common/pageable-data';
import { Auth } from '../../auth/schemas/auth.schema';
import { encryptPassword, generateSalt } from 'src/kernel/helpers/string.helper';
import { FileService } from '../../file/services/file.service';

@Injectable()
export class AdminUserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Auth.name) private authModel: Model<Auth>,
    private readonly fileService: FileService
  ) {}

  private async attachAvatarUrl<T extends { avatarId?: any }>(
    users: T[]
  ): Promise<(T & { avatarId?: string; avatarUrl?: string })[]> {
    const ids = users
      .map((u) => u.avatarId)
      .filter(Boolean)
      .map((id) => id.toString());
    if (ids.length === 0) {
      return users.map((u) => ({
        ...u,
        avatarId: u.avatarId?.toString(),
        avatarUrl: undefined
      }));
    }
    const files = await this.fileService.findByIds(ids);
    const urlMap = new Map<string, string>();
    files.forEach((f) => {
      const id = f._id?.toString?.();
      if (id) urlMap.set(id, f.getUrl());
    });
    return users.map((u) => ({
      ...u,
      avatarId: u.avatarId?.toString(),
      avatarUrl: u.avatarId ? urlMap.get(u.avatarId.toString()) : undefined
    }));
  }

  async search(query: SearchUserDto) {
    const { page = 1, limit = 10, q, role, status, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { userCode: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } }
      ];
    }
    if (role) filter.role = role;
    if (status) filter.status = status;

    const [rawData, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.userModel.countDocuments(filter)
    ]);

    const data = await this.attachAvatarUrl(rawData);
    return createPageableData(data, total, page, limit);
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id).lean();
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    const [withUrl] = await this.attachAvatarUrl([user]);
    return withUrl;
  }

  async create(createDto: CreateUserDto) {
    const { name, firstName, lastName, username, email, password, role, status, avatarId, userCode, classId, department, major, studentClass } = createDto;

    // Kiểm tra email đã tồn tại
    const existingEmail = await this.userModel.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      throw new BadRequestException('Email đã được sử dụng');
    }

    // Nếu FE không gửi username, ta tự sinh username tạm từ userCode hoặc email
    const finalUsername = username || userCode || email.split('@')[0];

    // Kiểm tra username đã tồn tại
    const existingUsername = await this.userModel.findOne({ username: finalUsername.toLowerCase() });
    if (existingUsername) {
      throw new BadRequestException('Username  đã được sử dụng');
    }

    // Kiểm tra userCode đã tồn tại
    if (userCode) {
      const existingCode = await this.userModel.findOne({ userCode });
      if (existingCode) {
        throw new BadRequestException('Mã đã được sử dụng');
      }
    }

    // Tạo user
    const user = await this.userModel.create({
      name,
      firstName,
      lastName,
      username: finalUsername.toLowerCase(),
      email: email.toLowerCase(),
      role: role || 'student',
      status: status || 'active',
      ...(userCode && { userCode }),
      ...(classId && { classId }),
      ...(avatarId && { avatarId }),
      ...(department && { department }),
      ...(major && { major }),
      ...(studentClass && { studentClass })
    });

    // Tạo auth nếu có password
    if (password) {
      const salt = generateSalt();
      const hashedPassword = encryptPassword(password, salt);

      await this.authModel.create({
        userId: user._id,
        email: email.toLowerCase(),
        username: finalUsername.toLowerCase(),
        password: hashedPassword,
        salt
      });
    }

    const [withUrl] = await this.attachAvatarUrl([user.toObject()]);
    return withUrl;
  }

  async update(id: string, updateDto: UpdateUserDto) {
    // Kiểm tra email đã tồn tại
    if (updateDto.email) {
      const existingEmail = await this.userModel.findOne({
        email: updateDto.email.toLowerCase(),
        _id: { $ne: id }
      });
      if (existingEmail) {
        throw new BadRequestException('Email đã được sử dụng');
      }
    }

    // Kiểm tra username đã tồn tại
    if (updateDto.username) {
      const existingUsername = await this.userModel.findOne({
        username: updateDto.username.toLowerCase(),
        _id: { $ne: id }
      });
      if (existingUsername) {
        throw new BadRequestException('Username  đã được sử dụng');
      }
    }

    // Kiểm tra userCode đã tồn tại
    if (updateDto.userCode) {
      const existingCode = await this.userModel.findOne({
        userCode: updateDto.userCode,
        _id: { $ne: id }
      });
      if (existingCode) {
        throw new BadRequestException('Mã đã được sử dụng');
      }
    }

    const updateData: any = { ...updateDto, updatedAt: new Date() };
    if (updateDto.email) {
      updateData.email = updateDto.email.toLowerCase();
    }
    if (updateDto.username) {
      updateData.username = updateDto.username.toLowerCase();
    }
    if (updateDto.avatarId === '') {
      updateData.$unset = { ...(updateData.$unset || {}), avatarId: 1 };
      delete updateData.avatarId;
    }

    const user = await this.userModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Cập nhật auth nếu thay đổi email hoặc username
    if (updateDto.email || updateDto.username) {
      const authUpdateData: any = {};
      if (updateDto.email) {
        authUpdateData.email = updateDto.email.toLowerCase();
      }
      if (updateDto.username) {
        authUpdateData.username = updateDto.username.toLowerCase();
      }
      await this.authModel.updateOne({ userId: id }, authUpdateData);
    }

    const [withUrl] = await this.attachAvatarUrl([user.toObject()]);
    return withUrl;
  }

  async delete(id: string) {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { status: 'deleted', updatedAt: new Date() },
      { new: true }
    );
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    const [withUrl] = await this.attachAvatarUrl([user.toObject()]);
    return withUrl;
  }
}
