import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  HelpCircle, MessageCircle, Users, CheckSquare, Trophy, Eye,
  MessageSquare, CheckCircle2, AlertCircle, Loader2, ShieldCheck, Mail, MapPin, Phone
} from 'lucide-react';
import { questionService } from '@services/question.service';
import { tagService } from '@services/tag.service';
import { statsService } from '@services/stats.service';
import { getSnippet } from '@utils/html';
import { IQuestion, ITag } from '@interfaces/question';
import { useCurrentUserStore } from 'src/stores';

export default function HomePage() {
  const { currentUser } = useCurrentUserStore();
  const [activeFilter, setActiveFilter] = useState('newest');
  const [activeTime, setActiveTime] = useState('Tuần này');
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [tags, setTags] = useState<ITag[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [overview, setOverview] = useState({ totalQuestions: 0, totalAnswers: 0, totalUsers: 0, resolvedQuestions: 0 });
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const filters = [
    { label: 'Mới nhất', value: 'newest' },
    { label: 'Chờ trả lời', value: 'unanswered', type: 'warning' },
    { label: 'Đang thảo luận', value: 'discussing', type: 'info' },
    { label: 'Đã giải quyết', value: 'resolved', type: 'success' },
  ];

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 10 };
      if (activeFilter === 'resolved') params.status = 'resolved';
      if (activeFilter === 'unanswered') params.sortBy = 'unanswered';
      if (activeFilter === 'discussing') params.sortBy = 'discussing';
      if (activeFilter === 'newest') params.sortBy = 'createdAt';

      const response: any = await questionService.search(params);
      const result = response?.data;
      if (result) {
        setQuestions(result.data || []);
        setTotalPages(result.totalPages || 1);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, activeFilter]);

  const loadTags = useCallback(async () => {
    try {
      const response: any = await tagService.getPopular();
      if (response?.data) {
        setTags(response.data);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);
  useEffect(() => { loadTags(); }, [loadTags]);

  useEffect(() => {
    statsService.getOverview().then(setOverview).catch(() => {});
  }, []);

  const loadLeaderboard = useCallback(async () => {
    try {
      const result: any = await statsService.getLeaderboard(activeTime);
      setLeaderboard(result || []);
    } catch {
      // silent
    }
  }, [activeTime]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const getTimeDiff = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) return parts[0][0] + parts[parts.length - 1][0];
    return name.substring(0, 2);
  };

  const avatarColors = [
    'bg-teal-600', 'bg-blue-600', 'bg-pink-600', 'bg-orange-500',
    'bg-purple-600', 'bg-emerald-600', 'bg-indigo-600', 'bg-rose-600'
  ];

  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return avatarColors[Math.abs(hash) % avatarColors.length];
  };

  const currentUserName = currentUser?.name || 'Sinh viên Thăng Long';
  const currentUserRole = currentUser?.role === 'teacher' ? 'Giảng viên' : currentUser?.role === 'admin' ? 'Quản trị viên' : 'Sinh viên';
  const currentUserCode = currentUser?.userCode || 'Chưa cập nhật MSV';

  return (
    <>
      <Head>
        <title>Trang chủ | Thăng Long Forum</title>
      </Head>

      <div className="flex flex-col gap-8 pb-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100/50 flex flex-col justify-between">
            <HelpCircle className="w-6 h-6 text-red-500 mb-3" strokeWidth={2.5} />
            <div>
              <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{overview.totalQuestions || '—'}</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Câu hỏi</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100/50 flex flex-col justify-between">
            <MessageCircle className="w-6 h-6 text-slate-400 mb-3" strokeWidth={2.5} />
            <div>
              <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{overview.totalAnswers || '—'}</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Câu trả lời</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100/50 flex flex-col justify-between">
            <Users className="w-6 h-6 text-indigo-700 mb-3" strokeWidth={2.5} />
            <div>
              <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{overview.totalUsers || '—'}</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Thành viên</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100/50 flex flex-col justify-between">
            <CheckSquare className="w-6 h-6 text-emerald-500 mb-3" strokeWidth={2.5} />
            <div>
              <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{overview.resolvedQuestions || '—'}</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Đã giải quyết</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-slate-700 mr-1">Lọc:</span>
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => { setActiveFilter(f.value); setPage(1); }}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors flex items-center gap-1.5 ${
                activeFilter === f.value
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-600 border-gray-200 hover:bg-slate-50'
              }`}
            >
              {f.type === 'success' && <CheckCircle2 className={`w-4 h-4 ${activeFilter === f.value ? 'text-white' : 'text-emerald-500'}`} />}
              {f.type === 'warning' && <AlertCircle className={`w-4 h-4 ${activeFilter === f.value ? 'text-white' : 'text-amber-500'}`} />}
              {f.type === 'info' && <MessageSquare className={`w-4 h-4 ${activeFilter === f.value ? 'text-white' : 'text-blue-500'}`} />}
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : questions.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100/50 text-center">
                <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">Chưa có câu hỏi nào</p>
                <Link href="/questions/ask" className="text-blue-600 font-semibold text-sm hover:underline mt-2 inline-block">
                  Đặt câu hỏi đầu tiên →
                </Link>
              </div>
            ) : (
              questions.map((q) => {
                const user = q.userId;
                const authorName = user?.name || 'Ẩn danh';
                return (
                  <div key={q._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/50 hover:shadow-md transition duration-200">
                    <div className="flex justify-between items-start mb-3 border-b pb-3 border-gray-50 max-w-full">
                      <div className="flex items-center gap-3">
                        {(user as any)?.avatarUrl ? (
                          <img
                            src={(user as any).avatarUrl}
                            alt={authorName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(authorName)}`}>
                            {getInitials(authorName)}
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                            {authorName}
                            {user?.role === 'teacher' && <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />}
                          </h4>
                          <p className="text-xs font-medium text-slate-400">{getTimeDiff(q.createdAt)}</p>
                        </div>
                      </div>
                      {q.status === 'resolved' ? (
                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đã giải quyết
                        </span>
                      ) : q.answerCount === 0 ? (
                        <span className="bg-amber-50 text-amber-600 border border-amber-100 px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap">
                          <AlertCircle className="w-3.5 h-3.5" /> Chờ trả lời
                        </span>
                      ) : (
                        <span className="bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap">
                          Đang thảo luận
                        </span>
                      )}
                    </div>

                    <Link href={`/questions/${q._id}`} className="block group mb-2">
                      <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition mb-1 leading-snug flex items-center gap-2 flex-wrap">
                        {q.title}
                        {(q as any).topicId && (
                          <span className="text-[11px] leading-tight font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100">
                            {(q as any).topicId?.name || ''}
                          </span>
                        )}
                      </h3>
                      <p className="text-[14px] font-medium text-slate-500 line-clamp-2 leading-relaxed">
                        {getSnippet(q.content, 150)}
                      </p>
                    </Link>

                    <div className="flex flex-wrap items-center justify-end mt-4">
                      <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 mt-3 sm:mt-0">
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-slate-400" /> {q.answerCount}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Eye className="w-4 h-4 text-slate-400" /> {q.viewCount}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 10).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-bold transition ${
                      page === p
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-gray-200 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-full lg:w-[360px] flex flex-col gap-6 lg:sticky lg:top-8">
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl shadow-[0_24px_60px_-30px_rgba(37,99,235,0.9)] p-5 text-white overflow-hidden relative">
              <div className="absolute inset-y-0 right-0 w-32 bg-white/10 blur-3xl" />
              <div className="relative flex items-center gap-4">
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUserName}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30 shadow-lg"
                  />
                ) : (
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl border-2 border-white/20 ${getAvatarColor(currentUserName)}`}>
                    {getInitials(currentUserName)}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-lg font-bold truncate">{currentUserName}</h2>
                  <p className="text-sm text-blue-100 font-medium">{currentUserRole}</p>
                  <p className="text-xs text-blue-100/90 mt-1">MSV: {currentUserCode}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 p-6">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5 mb-5 tracking-tight">
                <Trophy className="w-7 h-7 text-yellow-500" fill="currentColor" /> Bảng xếp hạng
              </h2>

              <div className="flex flex-wrap items-center gap-2 mb-6 bg-slate-50 p-1.5 rounded-xl border border-gray-100">
                {['Hôm nay', 'Tuần này', 'Tháng này', 'Năm nay'].map((time) => (
                  <button
                    key={time}
                    onClick={() => setActiveTime(time)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                      activeTime === time
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-200/50'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {leaderboard.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-4">Chưa có dữ liệu</p>
                ) : (
                  leaderboard.map((user, idx) => (
                    <div key={user._id} className="flex items-center gap-3">
                      <div className="text-base font-bold w-5 text-slate-500 text-center shrink-0">
                        {idx + 1}.
                      </div>
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="w-10 h-10 rounded-full border border-gray-100 object-cover shadow-sm"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 ${getAvatarColor(user.name)}`}>
                          {getInitials(user.name)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-[14px] text-slate-900 truncate">{user.name}</h4>
                        <p className="text-xs font-medium text-slate-400 truncate">{user.userCode || 'Chưa có MSV'}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-lg font-bold text-blue-600 leading-none">{user.score || 0}</p>
                        <p className="text-[11px] font-medium text-slate-400 mt-1">điểm</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-2 rounded-[28px] overflow-hidden bg-[#111c4e] text-white shadow-[0_24px_60px_-30px_rgba(17,28,78,0.85)]">
          <div className="grid gap-8 px-6 py-8 md:px-10 lg:grid-cols-[1.3fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                <img src="/image/logo.png" alt="Thăng Long Forum" className="h-12 w-12 rounded-full object-cover bg-white" />
                <div>
                  <h3 className="text-xl font-bold tracking-tight">THĂNG LONG FORUM</h3>
                  <p className="text-sm text-blue-100">Hỏi để hiểu - Học để trưởng thành</p>
                </div>
              </div>
              <p className="mt-5 max-w-md text-sm leading-7 text-blue-100/90">
                Thăng Long Forum là diễn đàn hỏi đáp học thuật dành cho sinh viên Đại học Thăng Long. Nơi chia sẻ kiến thức,
                giải đáp thắc mắc và cùng nhau phát triển.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-bold">LIÊN KẾT NHANH</h4>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-blue-100">
                <Link href="/home" className="hover:text-white transition">Trang chủ</Link>
                <Link href="/search" className="hover:text-white transition">Bảng xếp hạng</Link>
                <Link href="/questions/ask" className="hover:text-white transition">Đặt câu hỏi</Link>
                <Link href="/notifications" className="hover:text-white transition">Thông báo</Link>
                <Link href="/my-questions" className="hover:text-white transition">Câu hỏi của tôi</Link>
                <Link href="/search" className="hover:text-white transition">Chủ đề</Link>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold">THÔNG TIN LIÊN HỆ</h4>
              <div className="mt-4 space-y-3 text-sm text-blue-100">
                <p className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Đại học Thăng Long, Nghiêm Xuân Yêm, Hoàng Mai, Hà Nội</span>
                </p>
                <p className="flex items-center gap-3">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>support@tlu.edu.vn</span>
                </p>
                <p className="flex items-center gap-3">
                  <Phone className="w-4 h-4 shrink-0" />
                  <span>024 3869 1982</span>
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 px-6 py-4 md:px-10 flex flex-col gap-2 text-xs text-blue-100/80 md:flex-row md:items-center md:justify-between">
            <p>© 2024 Thăng Long Forum. All rights reserved.</p>
            <p>Made with ❤️ by TLU Students</p>
          </div>
        </footer>
      </div>
    </>
  );
}
