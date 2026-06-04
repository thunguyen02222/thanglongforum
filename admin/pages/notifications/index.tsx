import React, {
  useState, useEffect, useCallback, useRef
} from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import {
  Megaphone, Mail, Send, CheckCircle2, Loader2, AlertCircle,
  Clock, Users, X, Trash2
} from 'lucide-react';
import { notificationServiceAdmin } from '@services/notification.service';
import { confirm } from '@lib/swal';

const RichEditor = dynamic(() => import('@components/common/RichEditor'), { ssr: false });

const ROLE_LABELS: Record<string, string> = {
  student: 'Sinh viên',
  teacher: 'Giảng viên'
};

export default function AdminSendNotificationPage() {
  const [message, setMessage] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; message: string } | null>(null);
  const [error, setError] = useState('');
  const [selectedBroadcast, setSelectedBroadcast] = useState<any>(null);

  // Broadcasts history
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadBroadcasts = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res: any = await notificationServiceAdmin.getBroadcasts(historyPage, 10);
      if (res?.data) {
        setBroadcasts(res.data.data || []);
        setHistoryTotalPages(res.data.totalPages || 1);
      }
    } catch { /* silent */ } finally { setLoadingHistory(false); }
  }, [historyPage]);

  const handleRecall = async (id: string) => {
    const ok = await confirm(
      'Thu hồi thông báo?',
      'Hành động này sẽ xóa thông báo khỏi lịch sử và thu hồi từ tất cả người nhận.',
      { confirmText: 'Thu hồi', cancelText: 'Hủy', icon: 'warning' }
    );
    if (!ok) return;

    try {
      await notificationServiceAdmin.deleteBroadcast(id);
      setBroadcasts((prev) => prev.filter((b) => b._id !== id));
      loadBroadcasts();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi thu hồi thông báo');
    }
  };

  useEffect(() => { loadBroadcasts(); }, [loadBroadcasts]);

  const isEmptyHtml = (html: string) => {
    if (!html) return true;
    const cleanText = html.replace(/<[^>]*>/g, '');
    const withoutEntities = cleanText.replace(/&nbsp;/g, ' ').replace(/\s+/g, '').trim();
    return withoutEntities.length === 0;
  };

  const handleSend = async () => {
    if (isEmptyHtml(message)) {
      setError('Nội dung thông báo không được để trống.');
      return;
    }
    setSending(true);
    setError('');
    setResult(null);
    try {
      const res: any = await notificationServiceAdmin.sendSystem(message.trim(), targetRole || undefined);
      if (res?.data) {
        setResult(res.data);
        setMessage('');
        loadBroadcasts();
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setSending(false);
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

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <>
      <Head>
        <title>Gửi thông báo | Admin Thăng Long Forum</title>
      </Head>

      <div className="flex flex-col gap-6 p-6 pb-12 w-full max-w-[1400px]">

        <div className="flex items-center gap-2.5 mb-2">
          <Megaphone className="w-7 h-7 text-slate-500 fill-slate-100" strokeWidth={2} />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gửi thông báo hệ thống</h1>
        </div>

        {/* COMPOSE FORM */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-6">

          <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
            <Mail className="w-5 h-5 text-slate-400" />
            <h2 className="text-[16px] font-bold text-slate-800">Soạn thông báo mới</h2>
          </div>

          {/* Content Input with RichEditor */}
          <div className="flex flex-col gap-2 relative z-0">
            <label className="text-[13px] font-bold text-slate-700">Nội dung thông báo *</label>
            <RichEditor
              value={message}
              onChange={setMessage}
              placeholder="Nhập nội dung thông báo gửi đến người dùng..."
            />
          </div>

          {/* Target Role */}
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-slate-700">Gửi đến</label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-[14px] font-medium text-slate-800 cursor-pointer"
            >
              <option value="">Tất cả người dùng</option>
              <option value="student">Sinh viên</option>
              <option value="teacher">Giảng viên</option>
            </select>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-[13px] font-semibold">
              <AlertCircle className="w-4 h-4" />
              {' '}
              {error}
            </div>
          )}
          {result && (
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3 text-[13px] font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              {' '}
              {result.message}
              {' '}
              — Đã gửi đến
              {' '}
              {result.sent}
              {' '}
              người dùng
            </div>
          )}

          {/* Actions Row */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 mt-2">
            <button
              onClick={handleSend}
              disabled={sending || isEmptyHtml(message)}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[13px] font-bold transition shadow-sm disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {' '}
              Gửi ngay
            </button>
          </div>

        </div>

        {/* BROADCAST HISTORY TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-2">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            <h2 className="text-[16px] font-bold text-slate-800">Lịch sử thông báo đã gửi</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">Nội dung</th>
                  <th className="px-6 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">Gửi đến</th>
                  <th className="px-6 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">Số người nhận</th>
                  <th className="px-6 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">Thời gian</th>
                  <th className="px-6 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/80">
                {loadingHistory ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin mx-auto mb-2" />
                      <span className="text-sm text-slate-400">Đang tải...</span>
                    </td>
                  </tr>
                ) : broadcasts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-400">
                      Chưa có thông báo nào được gửi
                    </td>
                  </tr>
                ) : broadcasts.map((b: any) => (
                  <tr key={b._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 max-w-[400px]">
                      <div 
                        className="text-[13px] font-medium text-slate-700 max-h-16 overflow-hidden line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors" 
                        dangerouslySetInnerHTML={{ __html: b.message }}
                        onClick={() => setSelectedBroadcast(b)}
                        title="Click để xem chi tiết"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-[12px] font-bold px-2.5 py-1 rounded-full ${
                        b.targetRole === 'student' ? 'bg-blue-100 text-blue-700'
                          : b.targetRole === 'teacher' ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                      }`}
                      >
                        {b.targetRole ? ROLE_LABELS[b.targetRole] || b.targetRole : 'Tất cả'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-600">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {' '}
                        {b.sentCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-[13px] font-semibold text-slate-600">{formatDate(b.createdAt)}</p>
                        <p className="text-[11px] font-medium text-slate-400">{getTimeDiff(b.createdAt)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        type="button"
                        onClick={() => handleRecall(b._id)}
                        className="flex items-center gap-1 text-[12px] font-bold text-red-600 hover:text-red-800 transition ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Thu hồi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {historyTotalPages > 1 && (
            <div className="border-t border-gray-100 px-6 py-4 flex justify-center gap-1.5">
              {Array.from({ length: Math.min(5, historyTotalPages) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setHistoryPage(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-[13px] font-bold transition ${
                    historyPage === p
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'border border-gray-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Detail Broadcast Modal */}
      {selectedBroadcast && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedBroadcast(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <h3 className="text-[16px] font-bold text-slate-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-blue-500" /> Chi tiết thông báo đã gửi
              </h3>
              <button onClick={() => setSelectedBroadcast(null)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 text-sm text-slate-700 space-y-4">
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-500 pb-3 border-b border-slate-50">
                <p>Gửi đến: <span className="text-slate-800">{selectedBroadcast.targetRole ? ROLE_LABELS[selectedBroadcast.targetRole] || selectedBroadcast.targetRole : 'Tất cả'}</span></p>
                <p>Người nhận: <span className="text-slate-800">{selectedBroadcast.sentCount} người</span></p>
                <p>Thời gian: <span className="text-slate-800">{formatDate(selectedBroadcast.createdAt)}</span></p>
              </div>
              <div className="prose prose-slate max-w-none pt-2" dangerouslySetInnerHTML={{ __html: selectedBroadcast.message }} />
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100 mt-4">
              <button
                type="button"
                onClick={() => setSelectedBroadcast(null)}
                className="px-4 py-2 border border-gray-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50 transition"
              >Đóng</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
