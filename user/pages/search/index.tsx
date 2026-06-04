import React, { useState, useCallback, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  Search, Settings, Tag, MessageSquare, CheckCircle2,
  AlertCircle, Loader2, Clock, X
} from 'lucide-react';
import { questionService } from '@services/question.service';
import { tagService } from '@services/tag.service';
import { getSnippet } from '@utils/html';
import { IQuestion, ITag } from '@interfaces/question';

const HISTORY_KEY = 'search_history';
const MAX_HISTORY = 10;

function getSearchHistory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveSearchHistory(query: string) {
  const history = getSearchHistory().filter((h) => h !== query);
  history.unshift(query);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

function removeSearchHistory(query: string) {
  const history = getSearchHistory().filter((h) => h !== query);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

// Bỏ dấu tiếng Việt
function removeDiacritics(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();
}

// Highlight từ khóa trong text
function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const words = query.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return text;

  // Build regex pattern cho mỗi từ (match cả có dấu lẫn không dấu)
  const diacriticsMap: Record<string, string> = {
    'a': '[aàáảãạăắằẳẵặâấầẩẫậ]',
    'e': '[eèéẻẽẹêếềểễệ]',
    'i': '[iìíỉĩị]',
    'o': '[oòóỏõọôốồổỗộơớờởỡợ]',
    'u': '[uùúủũụưứừửữự]',
    'y': '[yỳýỷỹỵ]',
    'd': '[dđ]',
  };

  const patterns = words.map((w) => {
    const normalized = removeDiacritics(w);
    let p = '';
    for (const ch of normalized) {
      p += diacriticsMap[ch] || ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    return p;
  });

  const combinedPattern = patterns.join('\\s+');
  
  try {
    const regex = new RegExp(`(${combinedPattern})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) => {
      if (regex.test(part)) {
        return <mark key={i} className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5 font-bold">{part}</mark>;
      }
      regex.lastIndex = 0;
      return part;
    });
  } catch {
    return text;
  }
}

export default function SearchPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('questions');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<IQuestion[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeFilter, setActiveFilter] = useState('newest');
  const [showHistory, setShowHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { label: 'Câu hỏi', value: 'questions' },
    { label: 'Tags', value: 'tags' }
  ];

  // Load history
  useEffect(() => {
    setSearchHistory(getSearchHistory());
  }, []);

  // Click outside to close history dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadDefault = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { limit: 20 };
      if (activeFilter === 'newest') params.sortBy = 'createdAt';
      if (activeFilter === 'resolved') params.status = 'resolved';
      if (activeFilter === 'unanswered') params.sortBy = 'unanswered';
      if (activeFilter === 'discussing') params.sortBy = 'discussing';
      if (router.query.tag) params.tagSlug = router.query.tag;

      const response: any = await questionService.search(params);
      const result = response?.data;
      if (result) {
        setResults(result.data || []);
        setTotal(result.total || 0);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  const handleSearch = useCallback(async (overrideQuery?: string) => {
    const q = typeof overrideQuery === 'string' ? overrideQuery : searchQuery;
    if (!q.trim()) {
      setSearched(false);
      loadDefault();
      return;
    }
    setShowHistory(false);
    setLoading(true);
    setSearched(true);

    // Lưu lịch sử
    saveSearchHistory(q.trim());
    setSearchHistory(getSearchHistory());

    try {
      const params: Record<string, any> = { q: q.trim(), limit: 20 };
      if (activeFilter === 'newest') params.sortBy = 'createdAt';
      if (activeFilter === 'resolved') params.status = 'resolved';
      if (activeFilter === 'unanswered') params.sortBy = 'unanswered';
      if (activeFilter === 'discussing') params.sortBy = 'discussing';
      if (router.query.tag) params.tagSlug = router.query.tag;

      const response: any = await questionService.search(params);
      const result = response?.data;
      if (result) {
        setResults(result.data || []);
        setTotal(result.total || 0);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeFilter, loadDefault]);

  // Re-search khi đổi filter
  useEffect(() => {
    if (searched && searchQuery.trim()) {
      handleSearch();
    } else {
      loadDefault();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  // Đọc query params từ URL khi load trang hoặc thay đổi URL
  useEffect(() => {
    if (!router.isReady) return;
    const { q, tag } = router.query;
    
    let isQuerySearched = false;
    if (q && typeof q === 'string') {
      setSearchQuery(q);
      setSearched(true);
      isQuerySearched = true;
      saveSearchHistory(q.trim());
      setSearchHistory(getSearchHistory());
    } else {
      setSearchQuery('');
      setSearched(false);
    }

    setLoading(true);
    const params: Record<string, any> = { limit: 20 };
    if (q && typeof q === 'string') params.q = q;
    if (tag && typeof tag === 'string') params.tagSlug = tag;
    
    if (activeFilter === 'newest') params.sortBy = 'createdAt';
    if (activeFilter === 'resolved') params.status = 'resolved';
    if (activeFilter === 'unanswered') params.sortBy = 'unanswered';
    if (activeFilter === 'discussing') params.sortBy = 'discussing';

    questionService.search(params).then((response: any) => {
      const result = response?.data;
      if (result) {
        setResults(result.data || []);
        setTotal(result.total || 0);
      }
    }).catch(() => {}).finally(() => setLoading(false));

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query.tag, router.query.q]);

  // Clear kết quả nếu xóa trắng input -> load lại mặc định
  useEffect(() => {
    if (!searchQuery.trim() && searched) {
      setSearched(false);
      loadDefault();
    }
  }, [searchQuery, searched, loadDefault]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleHistoryClick = (q: string) => {
    setSearchQuery(q);
    setShowHistory(false);
    handleSearch(q);
  };

  const handleRemoveHistory = (e: React.MouseEvent, q: string) => {
    e.stopPropagation();
    removeSearchHistory(q);
    setSearchHistory(getSearchHistory());
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
    const parts = name.split(' ');
    if (parts.length >= 2) return parts[0][0] + parts[parts.length - 1][0];
    return name.substring(0, 2);
  };

  const avatarColors = ['bg-teal-600', 'bg-blue-600', 'bg-pink-600', 'bg-orange-500', 'bg-purple-600', 'bg-emerald-600'];
  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return avatarColors[Math.abs(hash) % avatarColors.length];
  };



  return (
    <>
      <Head>
        <title>Tìm kiếm | Thăng Long Forum</title>
      </Head>

      <div className="flex flex-col gap-6 pb-12">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5 tracking-tight">
          <Search className="w-6 h-6 text-slate-700" strokeWidth={2.5} /> Tìm kiếm
        </h1>

        {/* Global Search Header Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 pt-5 mt-1 relative z-20">
          
          {/* Input Area */}
          <div className="px-5 sm:px-8 flex items-center gap-4">
            <div className="relative flex-1" ref={historyRef}>
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchHistory.length > 0 && setShowHistory(true)}
                onKeyDown={handleKeyDown}
                placeholder="Tìm kiếm câu hỏi, tags..."
                className="w-full bg-slate-50 border border-gray-200 rounded-2xl pl-11 pr-4 py-3 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-semibold text-[14px] text-slate-800"
              />

              {/* Search History Dropdown */}
              {showHistory && searchHistory.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Tìm kiếm gần đây
                    </span>
                  </div>
                  {searchHistory.map((h) => (
                    <div
                      key={h}
                      onClick={() => handleHistoryClick(h)}
                      className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition group"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-slate-300" />
                        <span className="text-[14px] font-medium text-slate-700">{h}</span>
                      </div>
                      <button
                        onClick={(e) => handleRemoveHistory(e, h)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => handleSearch()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-md transition-all shrink-0"
            >
              Tìm
            </button>
          </div>

          <div className="pb-5"></div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 mt-1">
          {[
            { label: 'Mới nhất', value: 'newest' },
            { label: 'Chờ trả lời', value: 'unanswered' },
            { label: 'Đang thảo luận', value: 'discussing' },
            { label: 'Đã giải quyết', value: 'resolved' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`px-4 py-2 rounded-full text-[13px] font-bold border transition-colors ${
                activeFilter === f.value
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-600 border-gray-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search Results */}
        <div className="flex flex-col gap-4 min-w-0">
            
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : results.length === 0 ? (
              <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
                <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">
                  {searched ? `Không tìm thấy kết quả cho "${searchQuery}"` : 'Chưa có câu hỏi nào'}
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[14px] font-medium text-slate-500">
                    {searched 
                      ? <>{total} kết quả cho <span className="font-bold text-slate-900">"{searchQuery}"</span></>
                      : <>{total} câu hỏi</>
                    }
                  </p>
                </div>

                {results.map((q) => {
                  const author = q.userId as any;
                  const authorName = author?.name || 'Ẩn danh';
                  const snippet = getSnippet(q.content);

                  return (
                    <div key={q._id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition duration-200">
                      
                      {/* Header */}
                      <div className="flex justify-between items-start mb-3 max-w-full">
                        <div className="flex items-center gap-3">
                          {(author as any)?.avatarUrl ? (
                            <img
                              src={(author as any).avatarUrl}
                              alt={authorName}
                              className="w-9 h-9 rounded-full object-cover"
                            />
                          ) : (
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-xs ${getAvatarColor(authorName)}`}>
                              {getInitials(authorName)}
                            </div>
                          )}
                          <div>
                            <h4 className="font-semibold text-sm text-slate-800">{authorName}</h4>
                            <p className="text-xs font-medium text-slate-400">{getTimeDiff(q.createdAt)}</p>
                          </div>
                        </div>
                        {q.status === 'resolved' ? (
                          <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap border border-emerald-100/50">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đã giải quyết
                          </span>
                        ) : q.answerCount === 0 ? (
                          <span className="bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap border border-amber-100/50">
                            <AlertCircle className="w-3.5 h-3.5" /> Chờ trả lời
                          </span>
                        ) : (
                          <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap border border-blue-100/50">
                            <MessageSquare className="w-3.5 h-3.5" /> Đang thảo luận
                          </span>
                        )}
                      </div>

                      {/* Title with Highlight */}
                      <Link href={`/questions/${q._id}`} className="block group mb-2 mt-2">
                        <h3 className="text-[14px] font-medium text-slate-900 group-hover:text-blue-600 transition leading-snug flex items-center gap-2 flex-wrap">
                          {highlightText(q.title, searchQuery)}
                          {(q as any).topicId && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition cursor-default">
                              {(q as any).topicId?.name || ''}
                            </span>
                          )}
                        </h3>
                      </Link>

                      {/* Content Snippet with Highlight */}
                      <p className="text-[13px] text-slate-500 font-medium leading-relaxed mb-4 line-clamp-2">
                        {highlightText(snippet, searchQuery)}
                      </p>

                      {/* Footer */}
                      <div className="flex flex-wrap items-center justify-between border-t border-gray-50 pt-4 mt-1">
                        <div className="flex flex-wrap items-center gap-2">
                        </div>
                        
                        <div className="flex items-center gap-4 text-[12px] font-bold text-slate-500 mt-4 sm:mt-0">
                          <div className="flex items-center gap-1.5">
                            <MessageSquare className="w-4 h-4 text-slate-400" /> {q.answerCount}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
      </div>
    </>
  );
}
