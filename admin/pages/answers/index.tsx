import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  MessageCircle, Search, Trash2, CheckCircle2, Pin,
  ChevronLeft, ChevronRight, Loader2, X, GraduationCap, Medal
} from 'lucide-react';
import { answerService } from '@services/answer.service';

const AVATAR_COLORS = [
  'bg-orange-500', 'bg-teal-500', 'bg-indigo-500', 'bg-pink-500',
  'bg-cyan-500', 'bg-violet-500', 'bg-amber-500', 'bg-emerald-500'
];

function getAvatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getAvatarInitials(name: string) {
  const parts = (name || 'U').trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (name || 'U').slice(0, 2).toUpperCase();
}

function getRoleStyle(role: string) {
  if (role === 'teacher') return { bg: 'bg-emerald-50 text-emerald-700', icon: <Medal className="w-3 h-3 text-amber-500" /> };
  return { bg: 'bg-blue-50 text-blue-700', icon: <GraduationCap className="w-3 h-3 fill-blue-600 text-blue-600" /> };
}

function getTimeDiff(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

export default function AdminAnswersPage() {
  const [answers, setAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const limit = 20;

  const fetchAnswers = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await answerService.findAll({ page, limit });
      if (res?.data) {
        setAnswers(res.data.data || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchAnswers(); }, [fetchAnswers]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await answerService.delete(id);
      setAnswers((prev) => prev.filter((a) => a._id !== id));
      setTotal((t) => t - 1);
      setConfirmId(null);
    } catch { /* silent */ } finally { setDeletingId(null); }
  };

  const userBaseUrl = process.env.NEXT_PUBLIC_USER_URL || 'http://localhost:5002';

  return (
    <>
      <Head>
        <title>Quản lý câu trả lời | Admin Thăng Long Forum</title>
      </Head>

      <div className="flex flex-col gap-6 p-6 pb-12">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5 tracking-tight">
            <MessageCircle className="w-6 h-6 text-blue-600" strokeWidth={2.5} />
            {' '}
            Quản lý câu trả lời
          </h1>
          <span className="text-[13px] font-semibold text-slate-400">
            {total.toLocaleString()}
            {' '}
            câu trả lời
          </span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Người trả lời</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nội dung</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Câu hỏi</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Trạng thái</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Thời gian</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right whitespace-nowrap">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/80">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
                      <span className="text-sm text-slate-400">Đang tải...</span>
                    </td>
                  </tr>
                ) : answers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-sm text-slate-400">
                      Không có câu trả lời nào
                    </td>
                  </tr>
                ) : answers.map((answer) => {
                  const user = answer.userId as any;
                  const question = answer.questionId as any;
                  const roleStyle = getRoleStyle(user?.role || 'student');
                  return (
                    <tr key={answer._id} className="hover:bg-slate-50/50 transition-colors">
                      {/* User */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 ${getAvatarColor(user?._id || '')}`}>
                            {user?.avatarUrl
                              ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
                              : getAvatarInitials(user?.name || 'U')}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold text-slate-800 truncate">{user?.name || '—'}</p>
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${roleStyle.bg}`}>
                              {roleStyle.icon}
                              {user?.role === 'teacher' ? 'Giảng viên' : 'Sinh viên'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Content */}
                      <td className="px-6 py-4 max-w-[280px]">
                        <p className="text-[13px] text-slate-700 line-clamp-2 leading-snug">{answer.content}</p>
                      </td>

                      {/* Question */}
                      <td className="px-6 py-4 max-w-[220px]">
                        {question?.title ? (
                          <Link
                            href={`${userBaseUrl}/questions/${question._id}`}
                            target="_blank"
                            className="text-[12px] font-semibold text-blue-600 hover:underline line-clamp-2 leading-snug"
                          >
                            {question.title}
                          </Link>
                        ) : (
                          <span className="text-[12px] text-slate-400">—</span>
                        )}
                      </td>

                      {/* Status badges */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {answer.isAccepted && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[11px] font-bold border border-emerald-100 whitespace-nowrap">
                              <CheckCircle2 className="w-3 h-3" />
                              {' '}
                              Được chấp nhận
                            </span>
                          )}
                          {answer.isPinned && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[11px] font-bold border border-amber-100 whitespace-nowrap">
                              <Pin className="w-3 h-3" />
                              {' '}
                              Được ghim
                            </span>
                          )}
                          {!answer.isAccepted && !answer.isPinned && (
                            <span className="text-[11px] text-slate-400 font-medium">—</span>
                          )}
                        </div>
                      </td>

                      {/* Time */}
                      <td className="px-6 py-4 text-[12px] font-medium text-slate-400 whitespace-nowrap">
                        {getTimeDiff(answer.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setConfirmId(answer._id)}
                          className="px-3 py-1.5 rounded-full text-[12px] font-bold bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 transition shadow-sm flex items-center gap-1.5 ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {' '}
                          Xóa
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="border-t border-gray-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-[13px] font-medium text-slate-400">
              Hiển thị
              {' '}
              {total === 0 ? 0 : (page - 1) * limit + 1}
              –
              {Math.min(page * limit, total)}
              {' '}
              trong
              {' '}
              {total.toLocaleString()}
              {' '}
              câu trả lời
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-slate-600 text-[13px] font-bold hover:bg-slate-50 transition disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                {' '}
                Trước
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p: number;
                if (totalPages <= 5) p = i + 1;
                else if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-[13px] font-bold transition ${
                      page === p ? 'bg-blue-600 text-white shadow-sm' : 'border border-gray-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-slate-600 text-[13px] font-bold hover:bg-slate-50 transition disabled:opacity-40"
              >
                Tiếp
                {' '}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      {confirmId && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => !deletingId && setConfirmId(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-bold text-slate-900">Xóa câu trả lời</h3>
              <button onClick={() => !deletingId && setConfirmId(null)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[13px] font-medium text-slate-600 mb-4">
              Hành động này sẽ
              {' '}
              <strong>xóa vĩnh viễn</strong>
              {' '}
              câu trả lời. Bạn có chắc chắn?
            </p>
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-[13px] font-semibold text-red-600">⚠️ Không thể hoàn tác!</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmId(null)}
                disabled={!!deletingId}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(confirmId)}
                disabled={!!deletingId}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingId && <Loader2 className="w-4 h-4 animate-spin" />}
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
