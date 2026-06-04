import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { GetStaticProps } from 'next';
import { toast } from '@lib/toast';
import { authService } from '@services/auth.service';
import { useCurrentUserStore, usePublicSiteSettingsStore } from 'src/stores';
import { LocaleSwitcher } from '@components/LocaleSwitcher';

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'vi', ['common']))
  }
});

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const setCurrentUser = useCurrentUserStore((state) => state.setCurrentUser);
  const site_name = usePublicSiteSettingsStore((state) => state.site_name);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const isEmail = formData.emailOrUsername.includes('@');
    const payload = isEmail
      ? { email: formData.emailOrUsername.trim(), password: formData.password }
      : { username: formData.emailOrUsername.trim(), password: formData.password };

    try {
      const response = await authService.login(payload);
      const payloadData = (response as { data?: { token?: string } })?.data ?? response;
      if (payloadData?.token) {
        setCurrentUser(payloadData as any);
        toast.success('Đăng nhập thành công');
        router.push('/dashboard');
      } else {
        toast.error('Email/username hoặc mật khẩu không đúng');
      }
    } catch {
      toast.error('Email/username hoặc mật khẩu không đúng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 relative">
      <div className="absolute top-4 right-4">
        <LocaleSwitcher />
      </div>
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{site_name || 'Base Code'}</h1>
            <p className="text-gray-500 mt-2">{t('auth.loginTitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.emailOrUsername')}
              </label>
              <input
                type="text"
                autoComplete="username"
                value={formData.emailOrUsername}
                onChange={(e) => setFormData({ ...formData, emailOrUsername: e.target.value.trimStart() })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder={t('auth.emailPlaceholder')}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.password')}</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder={t('auth.passwordPlaceholder')}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('auth.loggingIn') : t('auth.loginButton')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
