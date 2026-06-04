import React, { useState, useMemo, useEffect } from 'react';
import {
  Mail, Server, Lock, Send
} from 'lucide-react';
import { toast } from '@lib/toast';
import { settingService } from '@services/setting.service';
import { useSettingsByGroup } from '@hooks/useSettingsByGroup';
import type { ISetting, ISettingUpdatePayload } from '@interfaces/setting';

const SMTP_KEYS = ['smtp_enabled', 'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'mail_from'];

function normalizeValue(value: unknown, type: string): string | number | boolean {
  if (value === null || value === undefined) return type === 'boolean' ? true : '';
  if (type === 'boolean') return value === true || value === 'true';
  if (type === 'number') return Number(value);
  return String(value);
}

export default function EmailSettingsTab() {
  const [saving, setSaving] = useState(false);
  const {
    settings, error, isLoading, mutate
  } = useSettingsByGroup('smtp');

  const { values: apiValues, settingsMeta } = useMemo(() => {
    const nextValues: Record<string, string | number | boolean> = {};
    const nextMeta: Record<string, { name: string; type: string }> = {};
    settings.forEach((s) => {
      nextValues[s.key] = normalizeValue(s.value, s.type || 'text');
      nextMeta[s.key] = { name: s.name, type: s.type || 'text' };
    });
    return { values: nextValues, settingsMeta: nextMeta };
  }, [settings]);

  const [values, setValues] = useState<Record<string, string | number | boolean>>(apiValues);
  useEffect(() => {
    setValues(apiValues);
  }, [apiValues]);

  const handleChange = (key: string, value: string | number | boolean) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: ISettingUpdatePayload[] = SMTP_KEYS.filter((k) => values[k] !== undefined).map(
        (key) => {
          const meta = settingsMeta[key];
          let val: any = values[key];
          if (meta?.type === 'number') val = Number(val);
          if (meta?.type === 'boolean') val = val === true || val === 'true';
          return { key, value: val };
        }
      );
      await settingService.updateMultiple(payload);
      await mutate();
      toast.success('Đã lưu cài đặt email');
    } catch {
      toast.error('Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const enabled = values.smtp_enabled === true || values.smtp_enabled === 'true';

  if (isLoading) {
    return <div className="animate-pulse rounded-2xl bg-gray-100 h-80" />;
  }
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 text-sm">
        Không tải được cài đặt email. Vui lòng thử lại.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-8">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm border border-gray-100">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Gửi email qua SMTP</h2>
              <p className="text-sm text-gray-600 mt-0.5">
                Cấu hình máy chủ và tài khoản để gửi email (Gmail, …)
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 border border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Bật gửi email (SMTP)</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Tắt nếu không sử dụng chức năng gửi email
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => handleChange('smtp_enabled', !enabled)}
              className={`
                relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
                transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${enabled ? 'bg-blue-600' : 'bg-gray-200'}
              `}
            >
              <span
                className={`
                  pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0
                  transition duration-200
                  ${enabled ? 'translate-x-5' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <div className="flex items-center gap-2 text-gray-700 mb-4">
              <Server className="h-5 w-5 text-gray-400" />
              <span className="font-medium">Máy chủ SMTP</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {settingsMeta.smtp_host?.name ?? 'SMTP Host'}
                </label>
                <input
                  type="text"
                  value={String(values.smtp_host ?? '')}
                  onChange={(e) => handleChange('smtp_host', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {settingsMeta.smtp_port?.name ?? 'SMTP Port'}
                </label>
                <input
                  type="number"
                  value={values.smtp_port != null ? String(values.smtp_port) : ''}
                  onChange={(e) => handleChange('smtp_port', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="587"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <div className="flex items-center gap-2 text-gray-700 mb-4">
              <Lock className="h-5 w-5 text-gray-400" />
              <span className="font-medium">Tài khoản gửi mail</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {settingsMeta.smtp_user?.name ?? 'SMTP User'}
                </label>
                <input
                  type="text"
                  value={String(values.smtp_user ?? '')}
                  onChange={(e) => handleChange('smtp_user', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="your@gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {settingsMeta.smtp_pass?.name ?? 'SMTP Password (App Password)'}
                </label>
                <input
                  type="password"
                  value={String(values.smtp_pass ?? '')}
                  onChange={(e) => handleChange('smtp_pass', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="16 ký tự, không khoảng trắng"
                  autoComplete="off"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Gmail: Bật xác minh 2 bước, tạo Mật khẩu ứng dụng tại
                  myaccount.google.com/apppasswords
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {settingsMeta.mail_from?.name ?? 'Mail From'}
                </label>
                <input
                  type="text"
                  value={String(values.mail_from ?? '')}
                  onChange={(e) => handleChange('mail_from', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="noreply@example.com"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {enabled ? 'Email sẽ được gửi qua SMTP khi có yêu cầu.' : 'Gửi email đang tắt.'}
          </p>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Send className="h-4 w-4" />
            {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>
        </div>
      </div>
    </form>
  );
}
