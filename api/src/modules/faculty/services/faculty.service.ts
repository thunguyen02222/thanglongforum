import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Faculty } from '../schemas/faculty.schema';
import { Major } from '../schemas/major.schema';
import { Class } from '../schemas/class.schema';
import {
  CreateFacultyDto, UpdateFacultyDto, SearchFacultyDto,
  CreateMajorDto, UpdateMajorDto, SearchMajorDto,
  CreateClassDto, UpdateClassDto, SearchClassDto
} from '../dtos/faculty.dto';
import { createPageableData } from 'src/kernel/common/pageable-data';

@Injectable()
export class FacultyService {
  constructor(
    @InjectModel(Faculty.name) private facultyModel: Model<Faculty>,
    @InjectModel(Major.name) private majorModel: Model<Major>,
    @InjectModel(Class.name) private classModel: Model<Class>
  ) {}

  // ─── Faculty ───

  async searchFaculties(query: SearchFacultyDto) {
    const { page = 1, limit = 50, q, sortBy = 'name', sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { shortName: { $regex: q, $options: 'i' } }
      ];
    }
    const [data, total] = await Promise.all([
      this.facultyModel.find(filter).sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 }).skip(skip).limit(limit).lean(),
      this.facultyModel.countDocuments(filter)
    ]);
    return createPageableData(data, total, page, limit);
  }

  async findAllFaculties() {
    return this.facultyModel.find().sort({ name: 1 }).lean();
  }

  async findFacultyById(id: string) {
    const doc = await this.facultyModel.findById(id).lean();
    if (!doc) throw new NotFoundException('Không tìm thấy khoa');
    return doc;
  }

  async createFaculty(dto: CreateFacultyDto) {
    const existing = await this.facultyModel.findOne({ name: { $regex: new RegExp(`^${dto.name}$`, 'i') } });
    if (existing) throw new BadRequestException('Tên khoa đã tồn tại.');
    return this.facultyModel.create(dto);
  }

  async updateFaculty(id: string, dto: UpdateFacultyDto) {
    if (dto.name) {
      const existing = await this.facultyModel.findOne({ name: { $regex: new RegExp(`^${dto.name}$`, 'i') }, _id: { $ne: id } });
      if (existing) throw new BadRequestException('Tên khoa đã tồn tại.');
    }
    const doc = await this.facultyModel.findByIdAndUpdate(id, { ...dto, updatedAt: new Date() }, { new: true });
    if (!doc) throw new NotFoundException('Không tìm thấy khoa');
    return doc;
  }

  async deleteFaculty(id: string) {
    const doc = await this.facultyModel.findByIdAndDelete(id);
    if (!doc) throw new NotFoundException('Không tìm thấy khoa');
    // Xóa luôn majors + classes thuộc khoa
    const majorIds = (await this.majorModel.find({ facultyId: id }).select('_id').lean()).map((m) => m._id);
    await this.classModel.deleteMany({ majorId: { $in: majorIds } });
    await this.majorModel.deleteMany({ facultyId: id });
    return doc;
  }

  // ─── Major ───

  async searchMajors(query: SearchMajorDto) {
    const { page = 1, limit = 50, q, facultyId, sortBy = 'name', sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { shortName: { $regex: q, $options: 'i' } }
      ];
    }
    if (facultyId) filter.facultyId = facultyId;
    const [data, total] = await Promise.all([
      this.majorModel.find(filter).sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 }).skip(skip).limit(limit).lean(),
      this.majorModel.countDocuments(filter)
    ]);
    return createPageableData(data, total, page, limit);
  }

  async findMajorsByFaculty(facultyId: string) {
    return this.majorModel.find({ facultyId }).sort({ name: 1 }).lean();
  }

  async findMajorById(id: string) {
    const doc = await this.majorModel.findById(id).lean();
    if (!doc) throw new NotFoundException('Không tìm thấy ngành');
    return doc;
  }

  async createMajor(dto: CreateMajorDto) {
    const existingName = await this.majorModel.findOne({ name: { $regex: new RegExp(`^${dto.name}$`, 'i') } });
    if (existingName) throw new BadRequestException('Tên ngành đã tồn tại.');
    if (dto.shortName) {
      const existingCode = await this.majorModel.findOne({ shortName: { $regex: new RegExp(`^${dto.shortName}$`, 'i') } });
      if (existingCode) throw new BadRequestException('Mã ngành đã tồn tại.');
    }
    return this.majorModel.create(dto);
  }

  async updateMajor(id: string, dto: UpdateMajorDto) {
    if (dto.name) {
      const existingName = await this.majorModel.findOne({ name: { $regex: new RegExp(`^${dto.name}$`, 'i') }, _id: { $ne: id } });
      if (existingName) throw new BadRequestException('Tên ngành đã tồn tại.');
    }
    if (dto.shortName) {
      const existingCode = await this.majorModel.findOne({ shortName: { $regex: new RegExp(`^${dto.shortName}$`, 'i') }, _id: { $ne: id } });
      if (existingCode) throw new BadRequestException('Mã ngành đã tồn tại.');
    }
    const doc = await this.majorModel.findByIdAndUpdate(id, { ...dto, updatedAt: new Date() }, { new: true });
    if (!doc) throw new NotFoundException('Không tìm thấy ngành');
    return doc;
  }

  async deleteMajor(id: string) {
    const doc = await this.majorModel.findByIdAndDelete(id);
    if (!doc) throw new NotFoundException('Không tìm thấy ngành');
    await this.classModel.deleteMany({ majorId: id });
    return doc;
  }

  // ─── Class ───

  async searchClasses(query: SearchClassDto) {
    const { page = 1, limit = 50, q, majorId, sortBy = 'name', sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { shortName: { $regex: q, $options: 'i' } }
      ];
    }
    if (majorId) filter.majorId = majorId;
    const [data, total] = await Promise.all([
      this.classModel.find(filter).sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 }).skip(skip).limit(limit).lean(),
      this.classModel.countDocuments(filter)
    ]);
    return createPageableData(data, total, page, limit);
  }

  async findClassesByMajor(majorId: string) {
    return this.classModel.find({ majorId }).sort({ name: 1 }).lean();
  }

  async findClassById(id: string) {
    const doc = await this.classModel.findById(id).lean();
    if (!doc) throw new NotFoundException('Không tìm thấy lớp');
    return doc;
  }

  async createClass(dto: CreateClassDto) {
    return this.classModel.create(dto);
  }

  async updateClass(id: string, dto: UpdateClassDto) {
    const doc = await this.classModel.findByIdAndUpdate(id, { ...dto, updatedAt: new Date() }, { new: true });
    if (!doc) throw new NotFoundException('Không tìm thấy lớp');
    return doc;
  }

  async deleteClass(id: string) {
    const doc = await this.classModel.findByIdAndDelete(id);
    if (!doc) throw new NotFoundException('Không tìm thấy lớp');
    return doc;
  }
}
