import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { KeyRound, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authService } from '@services/auth.service';
import { useCurrentUserStore } from 'src/stores';

export default function ChangePasswordPage() {
  const { currentUser } = useCurrentUserStore();
  const router = useRouter();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (form.currentPassword === form.newPassword) {
      setError('Mật khẩu mới không được trùng với mật khẩu cũ');
      return;
    }
    if (form.newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn đổi mật khẩu không?')) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authService.changePassword(form.currentPassword, form.newPassword);
      setSuccess(true);
      setTimeout(() => router.push('/user/profile'), 2000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-500 font-medium">
        Bạn cần đăng nhập để thực hiện thao tác này
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Đổi mật khẩu | Thăng Long Forum</title>
      </Head>

      <div className="max-w-[480px] mx-auto w-full pt-4 pb-12">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm font-medium mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-[#1e3a8a] px-8 py-6">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-3">
              <KeyRound className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Đổi mật khẩu</h1>
            <p className="text-blue-200 text-sm mt-1">Cập nhật mật khẩu để bảo mật tài khoản</p>
          </div>

          {/* Form */}
          <div className="px-8 py-6">
            {success ? (
              <div className="flex flex-col items-center py-8 gap-3">
                <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <p className="font-bold text-slate-800 text-lg">Đổi mật khẩu thành công!</p>
                <p className="text-slate-500 text-sm">Đang chuyển về trang cá nhân...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm font-medium">
                    {error}
                  </div>
                )}

                {/* Current password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Mật khẩu hiện tại</label>
                  <div className="relative">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={form.currentPassword}
                      onChange={handleChange('currentPassword')}
                      placeholder="Nhập mật khẩu hiện tại"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Mật khẩu mới</label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={form.newPassword}
                      onChange={handleChange('newPassword')}
                      placeholder="Ít nhất 6 ký tự"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Strength hint */}
                  {form.newPassword && (
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            form.newPassword.length >= i * 4
                              ? i <= 1 ? 'bg-red-400' : i <= 2 ? 'bg-amber-400' : 'bg-emerald-400'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Xác nhận mật khẩu mới</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={handleChange('confirmPassword')}
                      placeholder="Nhập lại mật khẩu mới"
                      className={`w-full border rounded-xl px-4 py-3 pr-11 text-sm text-slate-800 focus:outline-none focus:ring-2 transition ${
                        form.confirmPassword && form.confirmPassword !== form.newPassword
                          ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.confirmPassword && form.confirmPassword !== form.newPassword && (
                    <p className="text-red-500 text-[12px] font-medium">Mật khẩu không khớp</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  Đổi mật khẩu
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
