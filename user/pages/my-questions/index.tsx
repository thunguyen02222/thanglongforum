import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  HelpCircle, CheckCircle2, AlertCircle, Loader2,
  MessageSquare, Eye, FileQuestion, Trash2,
  Trophy, Bell, BookmarkCheck, Tag, ShieldCheck,
  MessageCircle, BarChart2
} from 'lucide-react';
import { questionService } from '@services/question.service';
import { notificationService } from '@services/notification.service';
import { followService } from '@services/follow.service';
import { statsService } from '@services/stats.service';
import { tagService } from '@services/tag.service';
import { getSnippet } from '@utils/html';
import { useCurrentUserStore } from 'src/stores';
import useSocket from 'src/socket/useSocket';
import { IQuestion, ITag } from '@interfaces/question';
import { toast } from '@lib/toast';

export default function MyQuestionsPage() {
  const { currentUser } = useCurrentUserStore();
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeFilter, setActiveFilter] = useState('newest');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { on } = useSocket();

  // Sidebar data
  const [notifications, setNotifications] = useState<any[]>([]);
  const [followingQuestions, setFollowingQuestions] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [activeTime, setActiveTime] = useState('Tuần này');
  const [tags, setTags] = useState<ITag[]>([]);
  const [myStats, setMyStats] = useState({ totalQuestions: 0, totalAnswers: 0, totalScore: 0 });

  const filters = [
    { label: 'Mới nhất', value: 'newest' },
    { label: 'Chờ trả lời', value: 'unanswered', type: 'warning' },
    { label: 'Đang thảo luận', value: 'discussing', type: 'info' },
    { label: 'Đã giải quyết', value: 'resolved', type: 'success' },
  ];

  const loadQuestions = useCallback(async () => {
    if (!currentUser?._id) return;
    setLoading(true);
    try {
      const params: Record<string, any> = { 
        page, 
        limit: 10,
        userId: currentUser._id
      };
      
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
  }, [page, activeFilter, currentUser]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  // Load sidebar data
  useEffect(() => {
    if (!currentUser?._id) return;
    
    notificationService.getMyNotifications({ limit: 5 }).then((res: any) => {
      const arr = res?.data?.data || res?.data || res || [];
      setNotifications(Array.isArray(arr) ? arr : []);
    }).catch(() => {});

    followService.getMyFollowing({ limit: 5 }).then((res: any) => {
      const arr = res?.data?.data || res?.data || res || [];
      setFollowingQuestions(Array.isArray(arr) ? arr : []);
    }).catch(() => {});

    tagService.getPopular(8).then((res: any) => {
      const arr = res?.data || res || [];
      setTags(Array.isArray(arr) ? arr : []);
    }).catch(() => {});

    const off = on('notification:new', (newNotif: any) => {
      setNotifications((prev) => {
        if (prev.some((n) => n._id === newNotif._id)) return prev;
        return [newNotif, ...prev].slice(0, 5); // Just keep latest 5
      });
    });

    return () => off();
  }, [currentUser?._id, on]);

  // My stats
  useEffect(() => {
    if (!currentUser?._id) return;
    questionService.search({ userId: currentUser._id, limit: 1 }).then((res: any) => {
      setMyStats(prev => ({ ...prev, totalQuestions: res?.data?.total || 0 }));
    }).catch(() => {});
  }, [currentUser]);

  const loadLeaderboard = useCallback(async () => {
    try {
      const result: any = await statsService.getLeaderboard(activeTime);
      setLeaderboard(result || []);
    } catch {
      // silent
    }
  }, [activeTime]);

  useEffect(() => { loadLeaderboard(); }, [loadLeaderboard]);

  const confirmDeleteQuestion = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await questionService.delete(deleteTargetId);
      setQuestions((prev) => prev.filter((q) => q._id !== deleteTargetId));
      setDeleteTargetId(null);
      toast.success('Xóa câu hỏi thành công');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xóa câu hỏi');
    } finally {
      setDeleting(false);
    }
  };

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
    if (!name) return '?';
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

  const getAvatarEl = (user: any) => {
    const name = user?.name || 'Ẩn danh';
    if (user?.avatarUrl) {
      return <img src={user.avatarUrl} alt={name} className="w-10 h-10 rounded-full border border-gray-100 object-cover shadow-sm" />;
    }
    return (
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 ${getAvatarColor(name)}`}>
        {getInitials(name)}
      </div>
    );
  };

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-500 font-medium text-lg">
        Bạn cần đăng nhập để xem câu hỏi của mình
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Câu hỏi của tôi | Thăng Long Forum</title>
      </Head>

      <div className="flex gap-6 pb-10 items-start">
        
        {/* ═══ LEFT SIDEBAR ═══ */}
        <div className="hidden lg:flex flex-col gap-5 w-[280px] shrink-0 sticky top-8">
          
          {/* User Profile Card */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-14 h-14 rounded-full border-2 border-white/20 object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                  {getInitials(currentUser.name)}
                </div>
              )}
              <div>
                <h3 className="font-bold text-[16px]">{currentUser.name}</h3>
                <p className="text-white/60 text-[12px] font-medium flex items-center gap-1">
                  {currentUser.role === 'teacher' && <><ShieldCheck className="w-3 h-3" /> Giảng viên</>}
                  {currentUser.role === 'student' && 'Sinh viên'}
                  {currentUser.role === 'admin' && 'Quản trị viên'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="text-xl font-bold">{myStats.totalQuestions}</div>
                <div className="text-[11px] text-white/60 font-medium">Câu hỏi</div>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="text-xl font-bold">{questions.filter(q => q.status === 'resolved').length}</div>
                <div className="text-[11px] text-white/60 font-medium">Đã giải quyết</div>
              </div>
            </div>
          </div>

          {/* Hoạt động gần đây */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-[14px] font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4 text-blue-500" /> Hoạt động gần đây
            </h3>
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-[13px] text-slate-400 text-center py-2">Chưa có hoạt động</p>
              ) : (
                notifications.slice(0, 5).map((n: any) => {
                  const qId = n.questionId?._id || n.questionId;
                  return (
                    <Link key={n._id} href={qId ? `/questions/${qId}` : '#'} className="flex items-start gap-2.5 group">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <p className="text-[13px] font-medium text-slate-600 leading-snug group-hover:text-blue-600 transition line-clamp-2">
                        {n.message}
                      </p>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* Câu hỏi đang theo dõi */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-[14px] font-bold text-slate-800 flex items-center gap-2 mb-4">
              <BookmarkCheck className="w-4 h-4 text-emerald-500" /> Câu hỏi đang theo dõi
            </h3>
            <div className="space-y-3">
              {followingQuestions.length === 0 ? (
                <p className="text-[13px] text-slate-400 text-center py-2">Chưa theo dõi câu hỏi nào</p>
              ) : (
                followingQuestions.slice(0, 5).map((q: any) => (
                  <Link key={q._id} href={`/questions/${q._id}`} className="flex items-start gap-2.5 group">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[13px] font-semibold text-slate-700 leading-snug group-hover:text-blue-600 transition line-clamp-2">
                        {q.title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{q.answerCount || 0} câu trả lời</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ═══ CENTER: QUESTION LIST ═══ */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">
          
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                <FileQuestion className="w-7 h-7 text-blue-500" /> Câu hỏi của tôi
              </h1>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Quản lý tất cả các câu hỏi bạn đã đăng trên diễn đàn
              </p>
            </div>
            <Link 
              href="/questions/ask" 
              className="hidden sm:flex px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-bold rounded-full shadow-md transition-all items-center gap-2"
            >
              <HelpCircle className="w-4 h-4" /> Đặt câu hỏi mới
            </Link>
          </div>

          {/* Filters */}
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

          {/* Questions List */}
          <div className="flex flex-col gap-4 min-w-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : questions.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100/50 text-center mt-2">
                <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium text-base mb-1">
                  {activeFilter === 'newest' ? 'Bạn chưa đăng câu hỏi nào' : 'Không có câu hỏi phù hợp'}
                </p>
                <p className="text-slate-400 text-sm mb-5">
                  {activeFilter === 'newest'
                    ? 'Đừng ngại chia sẻ thắc mắc của bạn với cộng đồng.'
                    : 'Hãy thử đổi tiêu chí lọc hoặc quay lại danh sách mới nhất.'}
                </p>
                <Link href="/questions/ask" className="px-6 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 transition font-bold rounded-xl inline-flex">
                  {activeFilter === 'newest' ? 'Đặt câu hỏi đầu tiên' : 'Đặt câu hỏi mới'}
                </Link>
              </div>
            ) : (
              questions.map((q) => {
                const user = q.userId || currentUser;
                const authorName = user?.name || 'Ẩn danh';
                return (
                  <div key={q._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition duration-200">
                    <div className="flex justify-between items-start mb-3 border-b pb-3 border-gray-50 max-w-full">
                      <div className="flex items-center gap-3">
                        {getAvatarEl(user)}
                        <div>
                          <h4 className="font-semibold text-sm text-slate-800">{authorName}</h4>
                          <p className="text-xs font-medium text-slate-400">{getTimeDiff(q.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
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
                        <button
                          onClick={(e) => { e.preventDefault(); setDeleteTargetId(q._id); }}
                          className="flex items-center justify-center p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition shrink-0"
                          title="Xóa câu hỏi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <Link href={`/questions/${q._id}`} className="block group mb-2">
                      <h3 className="text-[15px] font-bold text-slate-900 group-hover:text-blue-600 transition mb-1.5 leading-snug flex items-center gap-2 flex-wrap">
                        {q.title}
                        {(q as any).topicId && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition cursor-default">
                            {(q as any).topicId?.name || ''}
                          </span>
                        )}
                      </h3>
                      <p className="text-[14px] font-medium text-slate-500 line-clamp-2 leading-relaxed">
                        {getSnippet(q.content, 150)}
                      </p>
                    </Link>

                    <div className="flex flex-wrap items-center justify-end mt-4">
                      <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-slate-400" /> {q.answerCount || 0}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Eye className="w-4 h-4 text-slate-400" /> {q.viewCount || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Pagination */}
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
        </div>

        {/* ═══ RIGHT SIDEBAR ═══ */}
        <div className="hidden xl:flex flex-col gap-5 w-[300px] shrink-0 sticky top-8">
          
          {/* Bảng xếp hạng */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-[16px] font-bold text-slate-900 flex items-center gap-2 mb-4 tracking-tight">
              <Trophy className="w-5 h-5 text-yellow-500" fill="currentColor" /> Bảng xếp hạng
            </h3>
            
            <div className="flex flex-wrap items-center gap-1.5 mb-5 bg-slate-50 p-1.5 rounded-xl border border-gray-100">
              {['Hôm nay', 'Tuần này', 'Tháng này', 'Năm nay'].map((time) => (
                <button
                  key={time}
                  onClick={() => setActiveTime(time)}
                  className={`flex-1 py-1.5 px-1 rounded-lg text-[11px] font-semibold transition-all ${
                    activeTime === time
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-200/50'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {leaderboard.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">Chưa có dữ liệu</p>
              ) : (
                leaderboard.slice(0, 5).map((user, idx) => (
                  <div key={user._id} className="flex items-center gap-3">
                    <div className="text-[13px] font-bold w-5 text-slate-500 text-center shrink-0">
                      {idx + 1}.
                    </div>
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-9 h-9 rounded-full border border-gray-100 object-cover shadow-sm" />
                    ) : (
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0 ${getAvatarColor(user.name)}`}>
                        {getInitials(user.name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-[13px] text-slate-900 truncate">{user.name}</h4>
                      <p className="text-[11px] font-medium text-slate-500">
                        <span className="text-blue-600 font-bold">{user.score}</span> điểm
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chủ đề phổ biến */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-[14px] font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Tag className="w-4 h-4 text-indigo-500" /> Chủ đề phổ biến
            </h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag._id}
                  href={`/home?tag=${tag.slug}`}
                  className="text-[12px] font-bold px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 border border-gray-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Thống kê cá nhân */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-[14px] font-bold text-slate-800 flex items-center gap-2 mb-4">
              <BarChart2 className="w-4 h-4 text-orange-500" /> Thống kê cá nhân
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center bg-slate-50 rounded-xl p-3 border border-gray-100">
                <div className="text-xl font-bold text-slate-800">{myStats.totalQuestions}</div>
                <div className="text-[10px] font-semibold text-slate-500 mt-1">Câu hỏi</div>
              </div>
              <div className="text-center bg-slate-50 rounded-xl p-3 border border-gray-100">
                <div className="text-xl font-bold text-slate-800">{questions.filter(q => q.status === 'resolved').length}</div>
                <div className="text-[10px] font-semibold text-slate-500 mt-1">Đã giải quyết</div>
              </div>
              <div className="text-center bg-slate-50 rounded-xl p-3 border border-gray-100">
                <div className="text-xl font-bold text-slate-800">{questions.reduce((s, q) => s + (q.viewCount || 0), 0)}</div>
                <div className="text-[10px] font-semibold text-slate-500 mt-1">Lượt xem</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Xóa câu hỏi?</h3>
              <p className="text-[15px] font-medium text-slate-500 leading-relaxed">
                Hành động này không thể hoàn tác. Toàn bộ câu trả lời, bình luận và đánh giá của câu hỏi này sẽ bị xóa vĩnh viễn.
              </p>
            </div>
            <div className="p-4 bg-slate-50 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => setDeleteTargetId(null)}
                disabled={deleting}
                className="px-4 py-2 font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmDeleteQuestion}
                disabled={deleting}
                className="px-4 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-sm flex items-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
