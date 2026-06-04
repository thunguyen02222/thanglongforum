import { apiRequest } from './api-request';

export interface PublicSiteSettings {
  site_name: string;
  site_logo: string;
  site_favicon: string;
}

export interface PublicAuthSettings {
  enable_google_login: boolean;
  google_oauth_client_id: string;
}

class SettingService {
  async getPublicSite(): Promise<PublicSiteSettings> {
    const res = await apiRequest.get('/settings/public/site');
    return (res?.data ?? res) as PublicSiteSettings;
  }

  async getPublicAuth(): Promise<PublicAuthSettings> {
    const res = await apiRequest.get('/settings/public/auth');
    const data = res?.data ?? res;
    return {
      enable_google_login: data?.enable_google_login === true,
      google_oauth_client_id: String(data?.google_oauth_client_id ?? '')
    };
  }
}

export const settingService = new SettingService();
