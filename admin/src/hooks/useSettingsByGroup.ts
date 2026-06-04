import useSWR from 'swr';
import { settingService } from '@services/setting.service';
import type { ISetting } from '@interfaces/setting';

export function useSettingsByGroup(group: string) {
  const key = ['admin-settings', group];
  const {
    data, error, isLoading, mutate
  } = useSWR<ISetting[]>(key, () => settingService.findByGroupAdmin(group));

  const list = (data as { data?: ISetting[] })?.data ?? data;
  const settings: ISetting[] = Array.isArray(list) ? list : [];

  return {
    settings,
    error,
    isLoading,
    mutate
  };
}
