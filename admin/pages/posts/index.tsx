import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import {
  FileText, Search, Loader2, Eye, EyeOff, MessageCircle, Trash2, ExternalLink, Clock
} from 'lucide-react';
import { questionService } from '@services/question.service';

export default function PostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Debounce search input
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchInput]);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 12 };
      if (search) params.q = search;
      const res: any = await questionService.findAll(params);
      if (res?.data) {
        setPosts(res.data.data || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa bài đăng này?')) return;
    try {
      await questionService.delete(id);
      setPosts((prev) => prev.filter((p) => p._id !== id));
    } catch { /* silent */ }
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

  const userBaseUrl = process.env.USER_URL || 'http://localhost:5002';

  return (
    <>
      <Head>
        <title>Quản lý bài đăng | Admin Thăng Long Forum</title>
      </Head>

      <div className="flex flex-col gap-6 p-6 pb-12 w-full max-w-[1400px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5 tracking-tight">
            <FileText className="w-7 h-7 text-blue-500" strokeWidth={2} />
            {' '}
            Quản lý bài đăng
          </h1>

          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm kiếm bài đăng theo tiêu đề"
                className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] font-medium text-slate-800 outline-none focus:border-blue-500 w-[260px]"
              />
            </div>
          </div>
        </div>

        {/* Posts Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Tiêu đề</th>
                  <th className="px-6 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">Người đăng</th>
                  <th className="px-6 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">Chủ đề</th>
                  <th className="px-6 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap text-center">Trả lời</th>
                  <th className="px-6 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">Trạng thái</th>
                  <th className="px-6 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">Thời gian</th>
                  <th className="px-6 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/80">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : posts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">
                      Không tìm thấy bài đăng nào
                    </td>
                  </tr>
                ) : posts.map((post) => {
                  const user = post.userId;
                  const topic = post.topicId;
                  return (
                    <tr key={post._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 max-w-[300px]">
                        <p className="text-[13px] font-bold text-slate-800 line-clamp-1">{post.title}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-slate-700">
                            {user?.name || 'Không rõ'}
                          </span>
                          {post.isAnonymous && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full">
                              <EyeOff className="w-3 h-3" />
                              {' '}
                              Ẩn danh
                            </span>
                          )}
                        </div>
                        {user?.userCode && (
                          <p className="text-[11px] font-medium text-slate-400">{user.userCode}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {topic ? (
                          <span className="text-[12px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                            {topic.name}
                          </span>
                        ) : (
                          <span className="text-[12px] text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-[13px] font-bold text-slate-600">{post.answerCount || 0}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                          post.status === 'open' ? 'bg-emerald-50 text-emerald-600'
                            : post.status === 'closed' ? 'bg-slate-100 text-slate-500'
                              : 'bg-blue-50 text-blue-600'
                        }`}
                        >
                          {post.status === 'open' ? 'Mở' : post.status === 'closed' ? 'Đã đóng' : 'Đã giải quyết'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-[12px] font-medium text-slate-500">{getTimeDiff(post.createdAt)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <a
                            href={`${userBaseUrl}/questions/${post._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition"
                            title="Xem bài đăng"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDelete(post._id)}
                            className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
                            title="Xóa bài đăng"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-2">
            {Array.from({ length: Math.min(10, totalPages) }, (_, i) => i + 1).map((p) => (
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
    </>
  );
}
