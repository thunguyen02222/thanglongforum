import { ISetting, ISettingUpdatePayload } from '@interfaces/setting';
import { apiRequest } from './api-request';

class SettingService {
  async findAll(): Promise<ISetting[]> {
    return apiRequest.get('/settings');
  }

  async findByGroup(group: string): Promise<ISetting[]> {
    return apiRequest.get('/settings', { params: { group } });
  }

  async findByGroupAdmin(group: string): Promise<ISetting[]> {
    return apiRequest.get('/admin/settings', { params: { group } });
  }

  async findByKey(key: string): Promise<ISetting> {
    return apiRequest.get(`/settings/${key}`);
  }

  async getPublicSite(): Promise<{ site_name: string; site_logo: string; site_favicon: string }> {
    const res = await apiRequest.get('/settings/public/site');
    return (res?.data ?? res) as { site_name: string; site_logo: string; site_favicon: string };
  }

  async update(payload: ISettingUpdatePayload): Promise<ISetting> {
    return apiRequest.put('/admin/settings', payload);
  }

  async updateMultiple(settings: ISettingUpdatePayload[]): Promise<ISetting[]> {
    return apiRequest.put('/admin/settings/bulk', { settings });
  }
}

export const settingService = new SettingService();
