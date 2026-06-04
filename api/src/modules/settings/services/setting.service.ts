import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Setting } from '../schemas/setting.schema';
import { UpdateSettingDto } from '../dtos/setting.dto';

@Injectable()
export class SettingService {
  constructor(@InjectModel(Setting.name) private settingModel: Model<Setting>) {}

  async findAll() {
    return this.settingModel.find({ visible: true }).sort({ ordering: 1 });
  }

  async findByGroup(group: string) {
    return this.settingModel.find({ group, visible: true }).sort({ ordering: 1 });
  }

  async findByGroupAll(group: string) {
    return this.settingModel.find({ group }).sort({ ordering: 1 });
  }

  async findByKey(key: string) {
    const setting = await this.settingModel.findOne({ key });
    if (!setting) {
      throw new NotFoundException(`Setting with key "${key}" not found`);
    }
    return setting;
  }

  async update(updateDto: UpdateSettingDto) {
    const setting = await this.settingModel.findOneAndUpdate(
      { key: updateDto.key },
      { value: updateDto.value, updatedAt: new Date() },
      { new: true, upsert: true }
    );
    return setting;
  }

  async bulkUpdate(settings: UpdateSettingDto[]) {
    const results = await Promise.all(
      settings.map(setting => this.update(setting))
    );
    return results;
  }

  async getPublicSettings() {
    return this.settingModel.find({ visible: true, public: true });
  }

  async getPublicSiteSettings(): Promise<{ site_name: string; site_logo: string; site_favicon: string }> {
    const settings = await this.settingModel
      .find({ group: 'general', key: { $in: ['site_name', 'site_logo', 'site_favicon'] }, visible: true })
      .lean();
    const map = new Map(settings.map((s: any) => [s.key, s.value != null ? String(s.value) : '']));
    return {
      site_name: map.get('site_name') ?? 'Base Code',
      site_logo: map.get('site_logo') ?? '',
      site_favicon: map.get('site_favicon') ?? ''
    };
  }

  async getPublicAuthSettings(): Promise<{
    enable_google_login: boolean;
    google_oauth_client_id: string;
  }> {
    const settings = await this.settingModel
      .find({
        key: { $in: ['enable_google_login', 'google_oauth_client_id'] },
        visible: true
      })
      .lean();
    const map = new Map(
      settings.map((s: any) => [s.key, s.value !== undefined && s.value !== null ? s.value : ''])
    );
    return {
      enable_google_login: map.get('enable_google_login') === true || map.get('enable_google_login') === 'true',
      google_oauth_client_id: String(map.get('google_oauth_client_id') ?? '')
    };
  }

  async getGoogleOAuthConfig(): Promise<{ enabled: boolean; clientId: string; clientSecret: string }> {
    const settings = await this.settingModel
      .find({
        key: { $in: ['enable_google_login', 'google_oauth_client_id', 'google_oauth_client_secret'] }
      })
      .lean();
    const map = new Map(
      settings.map((s: any) => [s.key, s.value !== undefined && s.value !== null ? s.value : ''])
    );
    return {
      enabled: map.get('enable_google_login') === true || map.get('enable_google_login') === 'true',
      clientId: String(map.get('google_oauth_client_id') ?? ''),
      clientSecret: String(map.get('google_oauth_client_secret') ?? '')
    };
  }
}

