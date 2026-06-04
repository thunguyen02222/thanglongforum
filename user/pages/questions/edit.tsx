import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { 
  Check, Edit2, X, Save, Trash2, ShieldAlert, Loader2, History, BarChart3, Plus
} from 'lucide-react';
import { questionService } from '@services/question.service';
import { pollService } from '@services/poll.service';
import { tagService } from '@services/tag.service';
import { IQuestion, ITag } from '@interfaces/question';

const RichEditor = dynamic(() => import('@components/common/RichEditor'), { ssr: false });

export default function EditQuestionPage() {
  const router = useRouter();
  const { id } = router.query;
  const [question, setQuestion] = useState<IQuestion | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [topics, setTopics] = useState<ITag[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [editHistory, setEditHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>([]);
  const [lockedPollOptionCount, setLockedPollOptionCount] = useState(0);

  const loadQuestion = useCallback(async () => {
    if (!id || typeof id !== 'string') return;
    setLoading(true);
    try {
      const response = await questionService.findById(id);
      if (response?.data) {
        const q = response.data;
        setQuestion(q);
        setTitle(q.title);
        setContent(q.content);
        setOriginalTitle(q.title);
        setOriginalContent(q.content);
        setIsAnonymous(q.isAnonymous);
        setSelectedTopicId((q.topicId as any)?._id || '');
        setEditHistory((q as any).editHistory || []);
        if (q.type === 'poll') {
          const pollRes: any = await pollService.getResults(id);
          const existingOptions = (pollRes?.data?.options || []).map((option: any) => option.content || '');
          setPollOptions(existingOptions);
          setLockedPollOptionCount(existingOptions.length);
        } else {
          setPollOptions([]);
          setLockedPollOptionCount(0);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadQuestion(); }, [loadQuestion]);

  useEffect(() => {
    tagService.getPopular(100).then((res: any) => {
      if (res?.data) setTopics(res.data);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !id || typeof id !== 'string') {
      setError('Tiêu đề và nội dung không được để trống');
      return;
    }
    const normalizedPollOptions = pollOptions.map((option) => option.trim()).filter(Boolean);
    if (question?.type === 'poll' && normalizedPollOptions.length < 2) {
      setError('Khảo sát cần ít nhất 2 lựa chọn');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await questionService.update(id, {
        title: title.trim(),
        content: content.trim(),
        topicId: selectedTopicId || undefined,
        isAnonymous,
        pollOptions: question?.type === 'poll' ? normalizedPollOptions : undefined
      });
      router.push(`/questions/${id}`);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id || typeof id !== 'string') return;
    if (!confirm('Bạn có chắc muốn xóa câu hỏi này?')) return;
    setDeleting(true);
    try {
      await questionService.delete(id);
      router.push('/home');
    } catch (err: any) {
      setError(err.message || 'Không thể xóa');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Sửa câu hỏi | Thăng Long Forum</title>
      </Head>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 pb-12">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5 tracking-tight">
              <Edit2 className="w-6 h-6 text-slate-700" strokeWidth={2.5} /> Sửa câu hỏi
            </h1>
            {question && (
              <p className="text-[13px] font-medium text-slate-400 mt-1.5 flex items-center gap-1.5 flex-wrap">
                <Link href={`/questions/${question._id}`} className="font-semibold text-blue-500 hover:text-blue-600 transition">Xem câu hỏi →</Link>
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-semibold px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 mt-1">
          
          {/* Main Form */}
          <div className="flex-1 bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-100 p-6 md:p-8 flex flex-col gap-6 w-full min-w-0">
            
            {/* Title */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-800">Tiêu đề câu hỏi <span className="text-red-500">*</span></label>
              <input 
                type="text"
                value={title}
                maxLength={200}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-800"
              />
              <span className="text-xs text-slate-400 text-right">{title.length}/200</span>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-2 mt-2">
              <label className="text-sm font-semibold text-slate-800">Nội dung câu hỏi <span className="text-red-500">*</span></label>
              <div className="opacity-40 pointer-events-none rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 relative">
                <span className="absolute top-2 right-2 text-[10px] font-bold text-slate-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded">Nội dung trước chỉnh sửa</span>
                <div className="font-bold text-slate-700 text-[15px] mb-2 pb-2 border-b border-gray-200">{originalTitle}</div>
                <div
                  className="prose prose-slate prose-sm max-w-none text-slate-600 [&_img]:max-w-[200px] [&_img]:rounded-md"
                  dangerouslySetInnerHTML={{ __html: originalContent }}
                />
              </div>
              <RichEditor
                value={content}
                onChange={setContent}
                placeholder="Mô tả chi tiết câu hỏi của bạn..."
                minHeight={220}
              />
            </div>

            {/* Chủ đề */}
            <div className="flex flex-col gap-2 mt-2">
              <label className="text-sm font-semibold text-slate-800">Chủ đề</label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-800 cursor-pointer"
              >
                <option value="">-- Chọn chủ đề --</option>
                {topics.map((t) => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>

            {question?.type === 'poll' && (
              <div className="flex flex-col gap-3 mt-2">
                <label className="text-sm font-semibold text-slate-800">Lựa chọn khảo sát</label>
                <div className="rounded-xl border border-gray-200 bg-slate-50 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-500">
                    <BarChart3 className="w-4 h-4 text-blue-500" /> Bạn có thể thêm lựa chọn mới cho khảo sát hiện có
                  </div>
                  {pollOptions.map((option, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={option}
                      readOnly={idx < lockedPollOptionCount}
                      onChange={(e) => {
                        const nextOptions = [...pollOptions];
                        nextOptions[idx] = e.target.value;
                        setPollOptions(nextOptions);
                      }}
                      placeholder={`Lựa chọn ${idx + 1}`}
                      className={`w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-800 outline-none ${
                        idx < lockedPollOptionCount
                          ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                          : 'bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100'
                      }`}
                    />
                  ))}
                  {pollOptions.length < 10 && (
                    <button
                      type="button"
                      onClick={() => setPollOptions((prev) => [...prev, ''])}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
                    >
                      <Plus className="w-4 h-4" /> Thêm lựa chọn
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Anonymous */}
            <div className="mt-2 bg-slate-50/80 border border-gray-100 p-4 rounded-xl flex items-start gap-3 w-full">
              <div className="pt-0.5">
                <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
              </div>
              <div>
                <h4 className="font-bold text-[14px] text-slate-800 flex items-center gap-2">
                  <span className="text-slate-400">🕵️‍♂️</span> Đặt câu hỏi ẩn danh
                </h4>
                <p className="text-[13px] font-medium text-slate-500 mt-0.5">
                  Tên của bạn sẽ hiển thị là &quot;Ẩn danh&quot; với người khác
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-6 border-t border-gray-100 pt-6">
              <button type="button" onClick={handleDelete} disabled={deleting}
                className="px-5 py-2.5 rounded-xl font-semibold text-red-500 bg-white border border-red-200 hover:bg-red-50 hover:border-red-300 transition shadow-sm flex items-center gap-2 disabled:opacity-50">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Xóa câu hỏi
              </button>

              <div className="flex items-center gap-3">
                <Link href={question ? `/questions/${question._id}` : '/home'}
                  className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 bg-white border border-gray-200 hover:bg-slate-50 transition shadow-sm">
                  Hủy
                </Link>
                <button type="submit" disabled={submitting}
                  className="px-5 py-2.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu thay đổi
                </button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="w-full lg:w-[340px] flex flex-col gap-6 shrink-0">
            <div className="bg-[#fffbeb] border border-amber-200 rounded-2xl p-6 shadow-sm">
              <h3 className="flex items-center gap-2 text-[14px] font-bold text-amber-800 mb-4 tracking-tight">
                <ShieldAlert className="w-5 h-5 text-amber-600" /> Lưu ý khi chỉnh sửa
              </h3>
              <ul className="space-y-3.5">
                <li className="flex items-start gap-2.5 text-[13px] font-semibold text-amber-900 leading-snug">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 stroke-[3]" /> Câu hỏi đã có câu trả lời - chỉnh sửa lớn có thể làm lệch ngữ cảnh
                </li>
                <li className="flex items-start gap-2.5 text-[13px] font-semibold text-amber-900 leading-snug">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 stroke-[3]" /> Lịch sử chỉnh sửa sẽ được lưu lại
                </li>
                <li className="flex items-start gap-2.5 text-[13px] font-semibold text-amber-900 leading-snug">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 stroke-[3]" /> Người theo dõi sẽ nhận thông báo khi câu hỏi được cập nhật
                </li>
              </ul>
            </div>
            {editHistory.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <button
                  type="button"
                  onClick={() => setShowHistory(true)}
                  className="flex items-center gap-2 text-[14px] font-bold text-blue-600 hover:text-blue-700 transition w-full"
                >
                  <History className="w-4 h-4" /> Xem lịch sử chỉnh sửa ({editHistory.length})
                </button>
              </div>
            )}
          </div>
        </div>
      </form>

      {/* History Modal */}
      {showHistory && editHistory.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h3 className="text-[17px] font-bold text-slate-800">Lịch sử chỉnh sửa</h3>
              <button type="button" onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {[...editHistory].reverse().map((hist: any, idx: number) => (
                <div key={idx} className="border border-gray-100 rounded-xl p-5 bg-slate-50 relative">
                  <div className="absolute top-4 right-4 text-[12px] font-bold text-slate-400 bg-white border border-gray-100 px-2.5 py-1 rounded-md shadow-sm">
                    Bản ghi {editHistory.length - idx}
                  </div>
                  <div className="text-[13px] font-bold text-blue-600 mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                    {new Date(hist.editedAt).toLocaleString('vi-VN')}
                  </div>
                  {hist.title && <div className="font-bold text-slate-800 text-[16px] mb-3 pb-3 border-b border-gray-200">{hist.title}</div>}
                  <div
                    className="prose prose-slate prose-sm max-w-none text-slate-700 leading-relaxed [&_img]:max-w-[200px] [&_img]:rounded-md"
                    dangerouslySetInnerHTML={{ __html: hist.content }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
