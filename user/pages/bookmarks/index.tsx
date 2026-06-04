import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  CheckCircle2,
  AlertCircle, Loader2,
  Bell, BellOff, MessageSquare, Eye
} from 'lucide-react';
import { followService } from '@services/follow.service';
import { getSnippet } from '@utils/html';
import { useCurrentUserStore } from 'src/stores';
import { IQuestion } from '@interfaces/question';

export default function FollowingPage() {
  const { currentUser } = useCurrentUserStore();

  // Following State
  const [followings, setFollowings] = useState<IQuestion[]>([]);
  const [folLoading, setFolLoading] = useState(true);
  const [folPage, setFolPage] = useState(1);
  const [folTotalPages, setFolTotalPages] = useState(1);
  const [unfollowing, setUnfollowing] = useState<string | null>(null);

  const loadFollowing = useCallback(async () => {
    if (!currentUser?._id) return;
    setFolLoading(true);
    try {
      const response: any = await followService.getMyFollowing({ page: folPage, limit: 10 });
      const result = response?.data;
      if (result) {
        setFollowings(result.data || []);
        setFolTotalPages(result.totalPages || 1);
      }
    } catch {
      // silent
    } finally {
      setFolLoading(false);
    }
  }, [folPage, currentUser]);

  useEffect(() => {
    loadFollowing();
  }, [loadFollowing]);

  const handleUnfollow = async (questionId: string) => {
    setUnfollowing(questionId);
    try {
      await followService.toggle(questionId);
      setFollowings((prev) => prev.filter((q) => q._id !== questionId));
    } catch {
      // silent
    } finally {
      setUnfollowing(null);
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
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-500 font-medium text-lg">
        Bạn cần đăng nhập để xem danh sách này
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Đang theo dõi | Thăng Long Forum</title>
      </Head>

      <div className="flex flex-col gap-6 pb-12 pt-4">
        
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5 tracking-tight">
            <Eye className="w-6 h-6 text-blue-600" /> Đang theo dõi
          </h1>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4 min-w-0">
          {folLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : followings.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-semibold text-base mb-1">Chưa theo dõi câu hỏi nào</p>
              <p className="text-slate-400 text-sm mb-5">
                Theo dõi các câu hỏi để nhận thông báo khi có câu trả lời mới.
              </p>
              <Link
                href="/home"
                className="px-6 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 transition font-bold rounded-xl inline-flex"
              >
                Khám phá câu hỏi
              </Link>
            </div>
          ) : (
            followings.map((q) => {
              const user = q.userId as any;
              const authorName = q.isAnonymous ? 'Ẩn danh' : (user?.name || 'Người dùng');
              return (
                <div
                  key={q._id}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition duration-200"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3 border-b pb-3 border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                        {q.isAnonymous ? '?' : getInitials(authorName)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-slate-800">{authorName}</h4>
                        <p className="text-xs font-medium text-slate-400">{getTimeDiff(q.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {q.status === 'resolved' ? (
                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đã giải quyết
                        </span>
                      ) : q.answerCount === 0 ? (
                        <span className="bg-amber-50 text-amber-600 border border-amber-100 px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" /> Chờ trả lời
                        </span>
                      ) : (
                        <span className="bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 rounded-md text-xs font-semibold">
                          Đang thảo luận
                        </span>
                      )}

                      <button
                        onClick={() => handleUnfollow(q._id)}
                        disabled={unfollowing === q._id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 border border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition disabled:opacity-50"
                        title="Bỏ theo dõi"
                      >
                        {unfollowing === q._id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <BellOff className="w-3.5 h-3.5" />
                        )}
                        <span className="hidden sm:inline">Bỏ theo dõi</span>
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <Link href={`/questions/${q._id}`} className="block group mb-3">
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

                  {/* Footer */}
                  <div className="flex flex-wrap items-center justify-between mt-3">
                    <div className="flex flex-wrap items-center gap-2">
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 mt-3 sm:mt-0">
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-slate-400" />
                        {q.answerCount || 0}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-slate-400" />
                        {q.viewCount || 0}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Pagination */}
          {folTotalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: folTotalPages }, (_, i) => i + 1).slice(0, 10).map((p) => (
                <button
                  key={p}
                  onClick={() => setFolPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-bold transition ${
                    folPage === p
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
    </>
  );
}
