import React, { useState, useMemo, useEffect } from 'react';
import { Globe, Image, Bookmark } from 'lucide-react';
import { toast } from '@lib/toast';
import { settingService } from '@services/setting.service';
import { usePublicSiteSettingsStore } from 'src/stores';
import { useSettingsByGroup } from '@hooks/useSettingsByGroup';
import type { ISetting, ISettingUpdatePayload } from '@interfaces/setting';

const GENERAL_KEYS = ['site_name', 'site_logo', 'site_favicon'];

export default function GeneralSettingsTab() {
  const [saving, setSaving] = useState(false);
  const {
    settings, error, isLoading, mutate
  } = useSettingsByGroup('general');

  const { values: apiValues, settingsMeta } = useMemo(() => {
    const nextValues: Record<string, string> = {};
    const nextMeta: Record<string, { name: string; type: string }> = {};
    settings.forEach((s) => {
      nextValues[s.key] = s.value != null ? String(s.value) : '';
      nextMeta[s.key] = { name: s.name, type: s.type || 'text' };
    });
    return { values: nextValues, settingsMeta: nextMeta };
  }, [settings]);

  const [values, setValues] = useState<Record<string, string>>(apiValues);
  useEffect(() => {
    setValues(apiValues);
  }, [apiValues]);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const fetchSiteSettings = usePublicSiteSettingsStore((state) => state.fetchSiteSettings);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: ISettingUpdatePayload[] = GENERAL_KEYS.filter(
        (k) => values[k] !== undefined
      ).map((key) => ({
        key,
        value: values[key]
      }));
      await settingService.updateMultiple(payload);
      await fetchSiteSettings();
      await mutate();
      toast.success('Đã lưu cài đặt');
    } catch {
      toast.error('Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const logoUrl = (values.site_logo || '').trim();
  const faviconUrl = (values.site_favicon || '').trim();

  if (isLoading) {
    return <div className="animate-pulse rounded-2xl bg-gray-100 h-80" />;
  }
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 text-sm">
        Không tải được cài đặt chung. Vui lòng thử lại.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-8">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm border border-gray-100">
              <Globe className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Thông tin website</h2>
              <p className="text-sm text-gray-600 mt-0.5">
                Tên site, logo và favicon hiển thị trên toàn hệ thống
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <Globe className="h-4 w-4 text-gray-400" />
              {settingsMeta.site_name?.name ?? 'Tên website'}
            </label>
            <input
              type="text"
              value={values.site_name ?? ''}
              onChange={(e) => handleChange('site_name', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="Base Code"
            />
          </div>

          <div className="border-t border-gray-100 pt-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <Image className="h-4 w-4 text-gray-400" />
              {settingsMeta.site_logo?.name ?? 'Logo'}
            </label>
            <input
              type="text"
              value={values.site_logo ?? ''}
              onChange={(e) => handleChange('site_logo', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="/logo.png hoặc https://..."
            />
            {logoUrl && (
              <div className="mt-3 flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-sm text-gray-500">Xem trước:</span>
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="max-h-10 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 pt-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <Bookmark className="h-4 w-4 text-gray-400" />
              {settingsMeta.site_favicon?.name ?? 'Favicon'}
            </label>
            <input
              type="text"
              value={values.site_favicon ?? ''}
              onChange={(e) => handleChange('site_favicon', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="/favicon.ico hoặc https://..."
            />
            {faviconUrl && (
              <div className="mt-3 flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-sm text-gray-500">Xem trước:</span>
                <img
                  src={faviconUrl}
                  alt="Favicon preview"
                  className="h-8 w-8 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>
        </div>
      </div>
    </form>
  );
}
