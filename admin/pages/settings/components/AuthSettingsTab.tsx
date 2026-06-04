import React, { useState, useMemo, useEffect } from 'react';
import { LogIn } from 'lucide-react';
import { toast } from '@lib/toast';
import { settingService } from '@services/setting.service';
import { useSettingsByGroup } from '@hooks/useSettingsByGroup';
import type { ISetting, ISettingUpdatePayload } from '@interfaces/setting';

const AUTH_KEYS = ['enable_google_login', 'google_oauth_client_id', 'google_oauth_client_secret'];

export default function AuthSettingsTab() {
  const [saving, setSaving] = useState(false);
  const {
    settings, error, isLoading, mutate
  } = useSettingsByGroup('auth');

  const { values: apiValues, settingsMeta } = useMemo(() => {
    const nextValues: Record<string, string | boolean> = {};
    const nextMeta: Record<string, { name: string; type: string }> = {};
    settings.forEach((s) => {
      if (s.type === 'boolean') {
        nextValues[s.key] = s.value === true || s.value === 'true';
      } else {
        nextValues[s.key] = s.value != null ? String(s.value) : '';
      }
      nextMeta[s.key] = { name: s.name, type: s.type || 'text' };
    });
    return { values: nextValues, settingsMeta: nextMeta };
  }, [settings]);

  const [values, setValues] = useState<Record<string, string | boolean>>(apiValues);
  useEffect(() => {
    setValues(apiValues);
  }, [apiValues]);

  const handleChange = (key: string, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: ISettingUpdatePayload[] = AUTH_KEYS.filter(
        (k) => values[k] !== undefined
      ).map((key) => ({
        key,
        value: values[key]
      }));
      await settingService.updateMultiple(payload);
      await mutate();
      toast.success('Đã lưu cài đặt');
    } catch {
      toast.error('Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse rounded-2xl bg-gray-100 h-80" />;
  }
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 text-sm">
        Không tải được cài đặt. Vui lòng chạy migration Google OAuth trước (yarn migrate:google-oauth).
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-8">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm border border-gray-100">
              <LogIn className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Đăng nhập / Đăng ký (Google)</h2>
              <p className="text-sm text-gray-600 mt-0.5">
                Bật đăng nhập bằng Google và cấu hình Client ID / Client Secret từ Google Cloud Console
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="enable_google_login"
              checked={values.enable_google_login === true}
              onChange={(e) => handleChange('enable_google_login', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="enable_google_login" className="text-sm font-medium text-gray-700">
              {settingsMeta.enable_google_login?.name ?? 'Bật đăng nhập bằng Google'}
            </label>
          </div>
          <p className="text-sm text-gray-500 -mt-2">
            Chỉ khi bật, nút &quot;Đăng nhập với Google&quot; / &quot;Đăng ký với Google&quot; mới hiển thị trên trang đăng nhập và đăng ký.
          </p>

          <div className="border-t border-gray-100 pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {settingsMeta.google_oauth_client_id?.name ?? 'Google OAuth Client ID'}
            </label>
            <input
              type="text"
              value={String(values.google_oauth_client_id ?? '')}
              onChange={(e) => handleChange('google_oauth_client_id', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="xxx.apps.googleusercontent.com"
            />
          </div>

          <div className="border-t border-gray-100 pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {settingsMeta.google_oauth_client_secret?.name ?? 'Google OAuth Client Secret'}
            </label>
            <input
              type="password"
              value={String(values.google_oauth_client_secret ?? '')}
              onChange={(e) => handleChange('google_oauth_client_secret', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="GOCSPX-..."
              autoComplete="off"
            />
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
