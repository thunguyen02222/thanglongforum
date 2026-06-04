import { create } from 'zustand';
import { settingService } from '@services/setting.service';

export interface PublicSiteSettings {
  site_name: string;
  site_logo: string;
  site_favicon: string;
}

interface PublicSiteSettingsState extends PublicSiteSettings {
  loaded: boolean;
  setSiteSettings: (settings: Partial<PublicSiteSettings>) => void;
  fetchSiteSettings: () => Promise<void>;
}

const defaults: PublicSiteSettings = {
  site_name: 'Admin',
  site_logo: '',
  site_favicon: ''
};

export const usePublicSiteSettingsStore = create<PublicSiteSettingsState>()((set) => ({
  ...defaults,
  loaded: false,
  setSiteSettings: (settings) => set((state) => ({ ...state, ...settings })),
  fetchSiteSettings: async () => {
    try {
      const data = await settingService.getPublicSite();
      set({
        site_name: data?.site_name ?? defaults.site_name,
        site_logo: data?.site_logo ?? '',
        site_favicon: data?.site_favicon ?? '',
        loaded: true
      });
    } catch {
      set({ loaded: true });
    }
  }
}));
