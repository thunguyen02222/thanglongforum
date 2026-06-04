import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  ShieldAlert, Flag, HelpCircle, MessageCircle,
  CheckCircle2, Trash2, Eye, Clock, Loader2, X, ExternalLink, StickyNote
} from 'lucide-react';
import { reportService } from '@services/report.service';
import { useReportStore } from 'src/stores';

type ActionType = 'reject' | 'delete';

interface ActionModal {
  reportId: string;
  type: ActionType;
  adminNote: string;
}

const getReasonLabel = (reason: string) => {
  const map: Record<string, string> = {
    spam: 'Spam / Quảng cáo',
    'Spam / Quảng cáo': 'Spam / Quảng cáo',
    offensive: 'Nội dung xúc phạm',
    'Nội dung xúc phạm': 'Nội dung xúc phạm',
    inappropriate: 'Không phù hợp',
    'Không phù hợp': 'Không phù hợp',
    duplicate: 'Trùng lặp',
    'Trùng lặp': 'Trùng lặp',
    other: 'Khác',
    Khác: 'Khác'
  };
  return map[reason] || reason;
};

export default function ModeratePage() {
  const [activeFilter, setActiveFilter] = useState('pending');
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionModal, setActionModal] = useState<ActionModal | null>(null);
  const [actioning, setActioning] = useState(false);
  const { decrement } = useReportStore();

  const filters = [
    { label: 'Chờ xử lý', value: 'pending' },
    { label: 'Đã xử lý', value: 'resolved' },
    { label: 'Đã từ chối', value: 'rejected' }
  ];

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await reportService.findAll({ page, limit: 20, status: activeFilter });
      if (res?.data) {
        setReports(res.data.data || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  }, [page, activeFilter]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const openModal = (reportId: string, type: ActionType) => {
    setActionModal({ reportId, type, adminNote: '' });
  };

  const handleConfirmAction = async () => {
    if (!actionModal) return;
    setActioning(true);
    try {
      const { reportId, type, adminNote } = actionModal;
      if (type === 'reject') {
        await reportService.reject(reportId, adminNote || undefined);
      } else if (type === 'delete') {
        await reportService.deleteTarget(reportId);
      }
      setReports((prev) => prev.filter((r) => r._id !== reportId));
      if (activeFilter === 'pending') decrement();
      setActionModal(null);
    } catch { /* silent */ } finally { setActioning(false); }
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

  const getQuestionLink = (item: any) => {
    if (!item.targetQuestionId) return null;
    const userBaseUrl = process.env.USER_URL || 'http://localhost:5002';
    return `${userBaseUrl}/questions/${item.targetQuestionId}`;
  };

  const modalConfig: Record<ActionType, { title: string; desc: string; btnLabel: string; btnClass: string }> = {
    reject: {
      title: 'Từ chối báo cáo',
      desc: 'Báo cáo này sẽ bị đánh dấu là từ chối (nội dung không vi phạm). Câu hỏi sẽ được giữ nguyên.',
      btnLabel: 'Từ chối báo cáo',
      btnClass: 'bg-slate-600 hover:bg-slate-700 text-white'
    },
    delete: {
      title: 'Xóa nội dung vi phạm',
      desc: 'Thao tác này sẽ XÓA VĨNH VIỄN nội dung bị báo cáo, gửi thông báo cho người đăng và chuyển báo cáo sang mục "Đã xử lý".',
      btnLabel: 'Xóa nội dung',
      btnClass: 'bg-red-600 hover:bg-red-700 text-white'
    }
  };

  return (
    <>
      <Head>
        <title>Kiểm duyệt nội dung | Admin Thăng Long Forum</title>
      </Head>

      <div className="flex flex-col gap-6 p-6 pb-12 w-full max-w-[1240px]">

        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-7 h-7 text-red-500 fill-red-50" strokeWidth={2} />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kiểm duyệt nội dung</h1>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2.5">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => { setActiveFilter(f.value); setPage(1); }}
              className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all border ${
                activeFilter === f.value
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-600 border-gray-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Không có báo cáo nào</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 mt-2">
            {reports.map((item) => {
              const questionLink = getQuestionLink(item);
              return (
                <div
                  key={item._id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden flex flex-col p-6 relative transition-shadow hover:shadow-md border-l-4 border-l-red-500"
                >
                  {/* Top Meta Row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[12px] font-bold border border-red-100">
                        <Flag className="w-3.5 h-3.5 fill-red-100" />
                        {' '}
                        Báo cáo
                      </span>
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[12px] font-bold border border-slate-200">
                        {item.targetType === 'question' ? (
                          <>
                            <HelpCircle className="w-3.5 h-3.5" />
                            {' '}
                            Câu hỏi
                          </>
                        ) : item.targetType === 'answer' ? (
                          <>
                            <MessageCircle className="w-3.5 h-3.5" />
                            {' '}
                            Câu trả lời
                          </>
                        ) : (
                          <>
                            <MessageCircle className="w-3.5 h-3.5" />
                            {' '}
                            Bình luận
                          </>
                        )}
                      </span>
                      {item.status === 'pending' && (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full text-[11px] font-bold border border-amber-100">
                          <Clock className="w-3 h-3" />
                          {' '}
                          Chờ xử lý
                        </span>
                      )}
                    </div>
                    <span className="text-[12px] font-medium text-slate-400">{getTimeDiff(item.createdAt)}</span>
                  </div>

                  {/* Reporter & Reason */}
                  <div className="mb-4">
                    <p className="text-[13px] font-medium text-slate-500 mb-1">
                      Người báo cáo:
                      {' '}
                      <span className="font-semibold">{(item.userId as any)?.name || 'Ẩn danh'}</span>
                    </p>
                    <div className="w-full bg-red-50/50 rounded-xl px-4 py-3 border border-red-50">
                      <p className="text-[13px] font-semibold text-red-500 flex items-center gap-2">
                        <Flag className="w-4 h-4" />
                        {' '}
                        Lý do: &quot;
                        {getReasonLabel(item.reason)}
                        &quot;
                      </p>
                      {item.description && (
                        <p className="text-[12px] text-red-400 mt-1">{item.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Target content preview - pending dùng live data, đã xử lý dùng saved data */}
                  {item.status === 'pending' && (item.targetTitle || item.targetPreview) && (
                    <div className="mb-4 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                      <p className="text-[12px] font-semibold text-slate-500 mb-1">Nội dung bị báo cáo:</p>
                      <p className="text-[13px] font-medium text-slate-700 line-clamp-2">
                        {item.targetTitle || item.targetPreview}
                      </p>
                    </div>
                  )}

                  {/* adminNote nếu đã xử lý */}
                  {item.adminNote && (
                    <div className="mb-4 flex items-start gap-2 bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
                      <StickyNote className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-[13px] font-medium text-blue-700">{item.adminNote}</p>
                    </div>
                  )}

                  {/* Nội dung bị báo cáo (hiển thị ở mục đã xử lý / đã từ chối) */}
                  {item.status !== 'pending' && item.targetContent && (
                    <div className="mb-4 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                      <p className="text-[12px] font-semibold text-slate-500 mb-1">Nội dung bị báo cáo:</p>
                      <p className="text-[13px] font-medium text-slate-700 line-clamp-3">{item.targetContent}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-auto pt-2 flex-wrap">
                    {questionLink && item.status !== 'resolved' && item.adminNote !== 'Đã xóa nội dung vi phạm' && (
                      <Link
                        href={questionLink}
                        target="_blank"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-600 rounded-full text-[12px] font-bold border border-slate-200 hover:bg-slate-50 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        {' '}
                        Xem nội dung
                      </Link>
                    )}

                    {item.status === 'pending' && (
                      <>
                        <button
                          onClick={() => openModal(item._id, 'reject')}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-[13px] font-bold transition border border-slate-200"
                        >
                          <X className="w-4 h-4" />
                          {' '}
                          Từ chối
                        </button>
                        <button
                          onClick={() => openModal(item._id, 'delete')}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-full text-[13px] font-bold transition border border-red-200"
                        >
                          <Trash2 className="w-4 h-4" />
                          {' '}
                          Xóa nội dung
                        </button>
                      </>
                    )}

                    {item.status !== 'pending' && (
                      <span className={`text-[12px] font-bold px-3 py-1 rounded-full ${
                        item.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                      }`}
                      >
                        {item.status === 'resolved' ? '✓ Đã xử lý' : '✕ Đã từ chối'}
                      </span>
                    )}
                  </div>
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

      {/* Action Confirm Modal */}
      {actionModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => !actioning && setActionModal(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-bold text-slate-900">
                {modalConfig[actionModal.type].title}
              </h3>
              <button
                onClick={() => !actioning && setActionModal(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[13px] font-medium text-slate-600 mb-4">
              {modalConfig[actionModal.type].desc}
            </p>

            {actionModal.type === 'reject' && (
              <div className="mb-4">
                <label className="text-[13px] font-semibold text-slate-700 mb-2 block">
                  Ghi chú admin (tùy chọn)
                </label>
                <textarea
                  value={actionModal.adminNote}
                  onChange={(e) => setActionModal((prev) => (prev ? { ...prev, adminNote: e.target.value } : null))}
                  placeholder="Nhập ghi chú..."
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] font-medium text-slate-800 outline-none focus:border-blue-500 min-h-[80px] resize-none"
                />
              </div>
            )}

            {actionModal.type === 'delete' && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-[13px] font-semibold text-red-600">
                  ⚠️ Hành động này không thể hoàn tác!
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => !actioning && setActionModal(null)}
                disabled={actioning}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={actioning}
                className={`flex-1 px-4 py-2.5 rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2 ${modalConfig[actionModal.type].btnClass}`}
              >
                {actioning && <Loader2 className="w-4 h-4 animate-spin" />}
                {modalConfig[actionModal.type].btnLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
