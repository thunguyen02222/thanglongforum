import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Mail, Lock, Eye, EyeOff, KeyRound, ShieldQuestion, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { GetStaticProps } from 'next';
import { toast } from '@lib/toast';
import { authService } from '@services/auth.service';
import { settingService } from '@services/setting.service';
import { useCurrentUserStore } from 'src/stores';
import { AuthSplitLayout, AuthInput, GoogleSignInButton } from '@components/auth';
import type { PublicAuthSettings } from '@services/setting.service';

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'vi', ['common']))
  }
});

export default function LoginPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const setCurrentUser = useCurrentUserStore((state) => state.setCurrentUser);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authSettings, setAuthSettings] = useState<PublicAuthSettings | null>(null);

  // Tab: 'login' | 'request-password' | 'forgot-password'
  const [activeTab, setActiveTab] = useState<'login' | 'request-password' | 'forgot-password'>('login');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [userCode, setUserCode] = useState('');
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [errors, setErrors] = useState<{ emailOrUsername?: string; password?: string; userCode?: string; forgotIdentifier?: string }>({});

  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: ''
  });

  useEffect(() => {
    settingService.getPublicAuth().then(setAuthSettings).catch(() => setAuthSettings(null));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!formData.emailOrUsername.trim()) {
      newErrors.emailOrUsername = 'Vui lòng điền vào mục này.';
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Vui lòng điền vào mục này.';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    const value = formData.emailOrUsername.trim().toLowerCase();
    const isEmail = value.includes('@');
    const payload = isEmail
      ? { email: value, password: formData.password.trim() }
      : { username: value, password: formData.password.trim() };

    try {
      const data = await authService.login(payload);
      if (data?.token) {
        setCurrentUser({
          _id: data._id,
          name: data.name,
          email: data.email,
          username: data.username,
          role: data.role,
          status: 'active',
          createdAt: '',
          updatedAt: ''
        });
        toast.success('Đăng nhập thành công');
        router.push('/home');
      } else {
        toast.error('Email/username/Mã sinh viên/Mã giảng viên hoặc mật khẩu không đúng');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Email/Mã sinh viên/Mã giảng viên hoặc mật khẩu không đúng';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userCode.trim()) {
      setErrors({ userCode: 'Vui lòng điền vào mục này.' });
      return;
    }
    setErrors({});
    setRequestLoading(true);
    try {
      await authService.requestPassword(userCode.trim().toLowerCase());
      setRequestSuccess(true);
      toast.success('Mật khẩu đã được gửi đến email của bạn!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không tìm thấy tài khoản với mã số này');
    } finally {
      setRequestLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setErrors({ forgotIdentifier: 'Vui lòng điền vào mục này.' });
      return;
    }
    setErrors({});
    setForgotLoading(true);
    try {
      await authService.forgotPassword(forgotIdentifier.trim().toLowerCase());
      setForgotSuccess(true);
      toast.success('Mật khẩu mới đã được gửi đến email của bạn!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không tìm thấy tài khoản');
    } finally {
      setForgotLoading(false);
    }
  };

  // ─── Forgot Password View ───
  if (activeTab === 'forgot-password') {
    return (
      <AuthSplitLayout>
        <div>
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setForgotSuccess(false); setForgotIdentifier(''); setErrors({}); }}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600 transition mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại đăng nhập
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center">
              <ShieldQuestion className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                Quên mật khẩu
              </h1>
            </div>
          </div>
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            Nhập email, username hoặc Mã sinh viên/ Mã giảng viên để nhận mật khẩu mới qua email
          </p>

          {forgotSuccess ? (
            <div className="mt-8 p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                <Mail className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-emerald-800 mb-2">Gửi thành công!</h3>
              <p className="text-sm text-emerald-700 mb-4">
                Mật khẩu mới đã được gửi đến email liên kết với tài khoản <strong>{forgotIdentifier}</strong>.
                Vui lòng kiểm tra hộp thư (bao gồm thư rác).
              </p>
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setForgotSuccess(false); setForgotIdentifier(''); }}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition"
              >
                Đăng nhập ngay
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="mt-8 space-y-5">
              <AuthInput
                id="forgot-identifier"
                label="Email/ Mã sinh viên/ Mã giảng viên"
                type="text"
                placeholder="annh@gmail.com hoặc nguyenvana hoặc 2024001234"
                value={forgotIdentifier}
                onChange={(e) => {
                  setForgotIdentifier(e.target.value);
                  if (errors.forgotIdentifier) setErrors((prev) => ({ ...prev, forgotIdentifier: undefined }));
                }}
                error={errors.forgotIdentifier}
              />

              <p className="text-xs text-slate-400 font-medium -mt-2">
                Hệ thống sẽ gửi mật khẩu mới đến email đã đăng ký của tài khoản.
              </p>

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full py-3 rounded-xl font-bold text-white bg-[#2563eb] hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {forgotLoading ? 'Đang xử lý...' : 'Gửi mật khẩu mới qua email'} <span>&rarr;</span>
              </button>
            </form>
          )}
        </div>
      </AuthSplitLayout>
    );
  }

  // ─── Request Password View ───
  if (activeTab === 'request-password') {
    return (
      <AuthSplitLayout>
        <div>
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setRequestSuccess(false); setUserCode(''); }}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600 transition mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại đăng nhập
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                Lấy mật khẩu
              </h1>
            </div>
          </div>
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            Nhập mã sinh viên / mã giảng viên để nhận mật khẩu qua email
          </p>

          {requestSuccess ? (
            <div className="mt-8 p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                <Mail className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-emerald-800 mb-2">Gửi thành công!</h3>
              <p className="text-sm text-emerald-700 mb-4">
                Mật khẩu đã được gửi đến email liên kết với mã số <strong>{userCode}</strong>.
                Vui lòng kiểm tra hộp thư (bao gồm thư rác).
              </p>
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setRequestSuccess(false); setUserCode(''); }}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition"
              >
                Đăng nhập ngay
              </button>
            </div>
          ) : (
            <form onSubmit={handleRequestPassword} className="mt-8 space-y-5">
              <AuthInput
                id="request-user-code"
                label="Mã sinh viên / Mã giảng viên"
                type="text"
                placeholder="VD: 2024001234"
                value={userCode}
                onChange={(e) => {
                  setUserCode(e.target.value);
                  if (errors.userCode) setErrors((prev) => ({ ...prev, userCode: undefined }));
                }}
                error={errors.userCode}
              />

              <p className="text-xs text-slate-400 font-medium -mt-2">
                Hệ thống sẽ gửi mật khẩu đến email đã được admin đăng ký cho mã số này.
              </p>

              <button
                type="submit"
                disabled={requestLoading}
                className="w-full py-3 rounded-xl font-bold text-white bg-[#2563eb] hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {requestLoading ? 'Đang xử lý...' : 'Gửi mật khẩu qua email'} <span>&rarr;</span>
              </button>
            </form>
          )}
        </div>
      </AuthSplitLayout>
    );
  }

  // ─── Login View ───
  return (
    <AuthSplitLayout>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
          Đăng nhập
        </h1>
        <p className="mt-1.5 text-sm font-medium text-slate-500">
          Nhập thông tin tài khoản của bạn
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <AuthInput
            id="login-email"
            label="Email / Mã sinh viên/ Mã giảng viên"
            type="text"
            autoComplete="username"
            placeholder="annh@gmail.com hoặc nguyenvana hoặc 2024001234"
            value={formData.emailOrUsername}
            onChange={(e) => {
              setFormData({ ...formData, emailOrUsername: e.target.value });
              if (errors.emailOrUsername) setErrors((prev) => ({ ...prev, emailOrUsername: undefined }));
            }}
            error={errors.emailOrUsername}
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="login-password"
                className="block text-sm font-bold text-gray-800"
              >
                Mật khẩu
              </label>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="........"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                className={`w-full pl-4 pr-11 py-3 rounded-xl border bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 outline-none transition duration-200 ${
                  errors.password ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-blue-600 focus:ring-blue-600/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
            
            <div className="flex items-center justify-between mt-3 text-sm">
              <label className="flex items-center text-gray-600 cursor-pointer">
                <input type="checkbox" className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
                <span className="font-medium text-[13px]">Ghi nhớ đăng nhập</span>
              </label>
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={() => { setActiveTab('forgot-password'); setErrors({}); }}
                  className="text-amber-600 hover:text-amber-700 font-bold text-[13px]"
                >
                  Quên mật khẩu?
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('request-password'); setErrors({}); }}
                  className="text-blue-600 hover:text-blue-700 font-bold text-[13px]"
                >
                  Lấy mật khẩu lần đầu
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white bg-[#2563eb] hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'} <span>&rarr;</span>
          </button>
        </form>

        {authSettings?.enable_google_login && authSettings?.google_oauth_client_id && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs font-medium text-gray-400">
                  hoặc
                </span>
              </div>
            </div>

            <GoogleSignInButton
              clientId={authSettings.google_oauth_client_id}
              label={t('auth.loginWithGoogle') || 'Đăng nhập bằng tài khoản Google'}
              disabled={googleLoading}
              onSuccess={async (idToken) => {
                setGoogleLoading(true);
                try {
                  const data = await authService.loginWithGoogle(idToken);
                  if (data?.token) {
                    setCurrentUser({
                      _id: data._id,
                      name: data.name,
                      email: data.email,
                      username: data.username,
                      role: data.role,
                      status: 'active',
                      createdAt: '',
                      updatedAt: ''
                    });
                    toast.success('Đăng nhập thành công');
                    router.push('/home');
                  }
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Đăng nhập Google thất bại');
                } finally {
                  setGoogleLoading(false);
                }
              }}
              onError={() => toast.error('Không thể tải Google Sign-In')}
            />
          </>
        )}

      </div>
    </AuthSplitLayout>
  );
}
