import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  MessageCircle, ArrowUp, CheckCircle2, Megaphone, 
  Eye, Monitor, Loader2, HelpCircle
} from 'lucide-react';
import { notificationService } from '@services/notification.service';
import { useNotificationStore } from 'src/stores';
import { INotification } from '@interfaces/question';
import useSocket from 'src/socket/useSocket';

// Convert simple markdown to HTML strings to preserve backward compatibility
function getParsedHtml(text: string) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline font-semibold">$1</a>');
}

const typeIcons: Record<string, { icon: React.ReactNode; bg: string }> = {
  answer: { icon: <MessageCircle className="w-5 h-5 text-slate-500" />, bg: 'bg-slate-100' },
  comment: { icon: <MessageCircle className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-50' },
  vote: { icon: <ArrowUp className="w-5 h-5 text-emerald-500 stroke-[3]" />, bg: 'bg-emerald-50' },
  accept: { icon: <CheckCircle2 className="w-5 h-5 text-green-500" />, bg: 'bg-green-50' },
  follow: { icon: <Eye className="w-5 h-5 text-purple-500" />, bg: 'bg-purple-50' },
  system: { icon: <Megaphone className="w-5 h-5 text-slate-500" />, bg: 'bg-slate-100' }
};

export default function NotificationsPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { decreaseUnread, resetUnread } = useNotificationStore();
  const { on } = useSocket();

  const filters = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Câu trả lời', value: 'answer', icon: <MessageCircle className="w-3.5 h-3.5" /> },
    { label: 'Vote', value: 'vote', icon: <ArrowUp className="w-3.5 h-3.5" /> },
    { label: 'Theo dõi', value: 'follow', icon: <Eye className="w-3.5 h-3.5" /> },
    { label: 'Hệ thống', value: 'system', icon: <Monitor className="w-3.5 h-3.5" /> },
  ];

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response: any = await notificationService.getMyNotifications({ page, limit: 20 });
      const result = response?.data;
      if (result) {
        setNotifications(result.data || []);
        setTotalPages(result.totalPages || 1);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  useEffect(() => {
    const off = on('notification:new', (newNotif: INotification) => {
      // If we are on the first page and viewing 'all' or matching filter
      setNotifications((prev) => {
        // Prevent duplicate appending
        if (prev.some((n) => n._id === newNotif._id)) return prev;
        return [newNotif, ...prev];
      });
    });
    return () => off();
  }, [on]);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      resetUnread();
    } catch {
      // silent
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
      decreaseUnread();
    } catch {
      // silent
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

  const filteredNotifications = activeFilter === 'all'
    ? notifications
    : notifications.filter((n) => n.type === activeFilter);

  return (
    <>
      <Head>
        <title>Thông báo | Thăng Long Forum</title>
      </Head>

      <div className="flex flex-col gap-6 pb-12 pt-4">
        
        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5 tracking-tight">
            <span className="text-2xl">🔔</span> Thông báo
          </h1>
          
          <button
            onClick={handleMarkAllRead}
            className="px-5 py-2.5 rounded-full border border-blue-600 text-blue-600 font-bold hover:bg-blue-50 transition text-[13px] self-start sm:self-auto shrink-0 shadow-sm"
          >
            Đánh dấu tất cả đã đọc
          </button>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2.5">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold transition-all border ${
                activeFilter === f.value
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-600 border-gray-200 hover:bg-slate-50'
              }`}
            >
              {f.icon && (
                <span className={activeFilter === f.value ? 'text-white' : 'text-slate-400'}>
                  {f.icon}
                </span>
              )}
              {f.label}
            </button>
          ))}
        </div>

        {/* Notifications List Container */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Chưa có thông báo nào</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-1">
            {filteredNotifications.map((notif, index) => {
              const typeInfo = typeIcons[notif.type] || typeIcons.system;

              return (
                <div 
                  key={notif._id} 
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('a')) {
                      e.stopPropagation();
                      return;
                    }
                    if (!notif.isRead) handleMarkRead(notif._id);
                  }}
                  className={`flex items-start gap-4 p-5 hover:bg-slate-50 transition-colors relative cursor-pointer ${
                    index !== filteredNotifications.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  {/* Icon Circle */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${typeInfo.bg}`}>
                    {typeInfo.icon}
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0 pr-8">
                    <div className="text-[14px] font-medium text-slate-800 leading-snug [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:my-1.5 [&_ol]:my-1.5">
                      {notif.actorId && (
                        <strong className="text-blue-600 mr-1">{(notif.actorId as any)?.name || 'Ai đó'}</strong>
                      )}
                      <div className="inline-block" dangerouslySetInnerHTML={{ __html: getParsedHtml(notif.message) }} />
                    </div>
                    {notif.questionId && (
                      <Link
                        href={`/questions/${notif.questionId._id}`}
                        className="text-[13px] font-semibold text-blue-500 hover:underline mt-1 inline-block"
                      >
                        Xem câu hỏi →
                      </Link>
                    )}
                    <p className="text-[12px] font-bold text-slate-400 mt-1.5">
                      {getTimeDiff(notif.createdAt)}
                    </p>
                  </div>

                  {/* Unread Dot */}
                  {!notif.isRead && (
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.4)]"></div>
                  )}
                </div>
              );
            })}
          </div>
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
    </>
  );
}
