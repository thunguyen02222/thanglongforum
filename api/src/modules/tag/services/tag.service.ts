import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tag } from '../schemas/tag.schema';
import { CreateTagDto, UpdateTagDto, SearchTagDto } from '../dtos/tag.dto';
import { createPageableData } from 'src/kernel/common/pageable-data';

@Injectable()
export class TagService {
  constructor(@InjectModel(Tag.name) private tagModel: Model<Tag>) {}

  private removeVietnameseTones(str: string): string {
    let result = str;
    result = result.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
    result = result.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
    result = result.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
    result = result.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
    result = result.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
    result = result.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
    result = result.replace(/đ/g, 'd');
    result = result.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
    result = result.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
    result = result.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
    result = result.replace(/Ò|Ó|Ọ|B|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
    result = result.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
    result = result.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
    result = result.replace(/Đ/g, 'D');
    return result;
  }

  private generateSlug(name: string): string {
    const unsignedName = this.removeVietnameseTones(name);
    return unsignedName
      .toLowerCase()
      .replace(/[#]/g, '')
      .trim()
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '');
  }

  async search(query: SearchTagDto) {
    const { page = 1, limit = 50, q, sortBy = 'name', sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { slug: { $regex: q, $options: 'i' } }
      ];
    }
    const [data, total] = await Promise.all([
      this.tagModel.find(filter).sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 }).skip(skip).limit(limit).lean(),
      this.tagModel.countDocuments(filter)
    ]);
    return createPageableData(data, total, page, limit);
  }

  async findAll() {
    return this.tagModel.find().sort({ name: 1 }).lean();
  }

  async findPopular(limit = 20) {
    return this.tagModel.find().sort({ questionCount: -1 }).limit(limit).lean();
  }

  async findById(id: string) {
    const doc = await this.tagModel.findById(id).lean();
    if (!doc) throw new NotFoundException('Không tìm thấy tag');
    return doc;
  }

  async findBySlug(slug: string) {
    const doc = await this.tagModel.findOne({ slug }).lean();
    if (!doc) throw new NotFoundException('Không tìm thấy tag');
    return doc;
  }

  async create(dto: CreateTagDto) {
    const cleanName = dto.name.trim();
    const slug = this.generateSlug(cleanName);

    const existing = await this.tagModel.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        { slug }
      ]
    });
    if (existing) {
      throw new BadRequestException('Chủ đề đã tồn tại');
    }

    return this.tagModel.create({ ...dto, name: cleanName, slug });
  }

  async update(id: string, dto: UpdateTagDto) {
    const updateData: any = { ...dto, updatedAt: new Date() };
    if (dto.name) {
      const cleanName = dto.name.trim();
      const slug = this.generateSlug(cleanName);

      const existing = await this.tagModel.findOne({
        $or: [
          { name: { $regex: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
          { slug }
        ],
        _id: { $ne: id }
      });
      if (existing) {
        throw new BadRequestException('Chủ đề đã tồn tại');
      }

      updateData.name = cleanName;
      updateData.slug = slug;
    }
    const doc = await this.tagModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!doc) throw new NotFoundException('Không tìm thấy tag');
    return doc;
  }

  async delete(id: string) {
    const doc = await this.tagModel.findByIdAndDelete(id);
    if (!doc) throw new NotFoundException('Không tìm thấy tag');
    return doc;
  }

  async findOrCreateByNames(names: string[]): Promise<Types.ObjectId[]> {
    const tagIds: Types.ObjectId[] = [];
    for (const name of names) {
      const cleanName = name.replace(/^#/, '').trim();
      if (!cleanName) continue;
      const slug = this.generateSlug(cleanName);
      let tag = await this.tagModel.findOne({ slug });
      if (!tag) {
        tag = await this.tagModel.create({ name: cleanName, slug });
      }
      tagIds.push(tag._id as Types.ObjectId);
    }
    return tagIds;
  }

  async incrementQuestionCount(tagIds: Types.ObjectId[]) {
    if (!tagIds.length) return;
    await this.tagModel.updateMany(
      { _id: { $in: tagIds } },
      { $inc: { questionCount: 1 } }
    );
  }

  async decrementQuestionCount(tagIds: Types.ObjectId[]) {
    if (!tagIds.length) return;
    await this.tagModel.updateMany(
      { _id: { $in: tagIds } },
      { $inc: { questionCount: -1 } }
    );
  }
}
