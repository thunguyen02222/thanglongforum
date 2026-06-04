import useSWR from 'swr';
import { settingService } from '@services/setting.service';
import type { PublicSiteSettings } from 'src/stores/publicSiteSettingsStore';

const SWR_KEY = 'public-site-settings';

export function usePublicSiteSettings() {
  const { data, error, isLoading, mutate } = useSWR<PublicSiteSettings>(SWR_KEY, () =>
    settingService.getPublicSite()
  );

  return {
    settings: data ?? null,
    error,
    isLoading,
    mutate
  };
}
