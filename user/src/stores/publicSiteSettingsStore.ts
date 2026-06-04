import { create } from 'zustand';

export interface PublicSiteSettings {
  site_name: string;
  site_logo: string;
  site_favicon: string;
}

interface PublicSiteSettingsState extends PublicSiteSettings {
  loaded: boolean;
  setSiteSettings: (settings: Partial<PublicSiteSettings>) => void;
  setSiteSettingsFromData: (data: PublicSiteSettings | null) => void;
}

const defaults: PublicSiteSettings = {
  site_name: 'Base Code',
  site_logo: '',
  site_favicon: ''
};

export const usePublicSiteSettingsStore = create<PublicSiteSettingsState>()((set) => ({
  ...defaults,
  loaded: false,
  setSiteSettings: (settings) => set((state) => ({ ...state, ...settings })),
  setSiteSettingsFromData: (data) =>
    set({
      site_name: data?.site_name ?? defaults.site_name,
      site_logo: data?.site_logo ?? '',
      site_favicon: data?.site_favicon ?? '',
      loaded: true
    })
}));
