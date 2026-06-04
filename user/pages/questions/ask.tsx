import React, { useState, useCallback, useRef, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import {
  Check, Edit3, Lightbulb, TrendingUp, X, Loader2, BarChart3, Plus, Trash2, Paperclip, FileText, Eye, MessageSquare
} from 'lucide-react';
import { questionService } from '@services/question.service';
import { tagService } from '@services/tag.service';
import { fileService } from '@services/file.service';
import { IQuestion, ITag } from '@interfaces/question';

const RichEditor = dynamic(() => import('@components/common/RichEditor'), { ssr: false });

const ACCEPTED_TYPES = [
  'image/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv'
].join(',');

interface AttachedFile {
  file: File;
  preview: string;
  isImage: boolean;
}

export default function AskQuestionPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [topics, setTopics] = useState<ITag[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [questionType, setQuestionType] = useState('text');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [popularQuestions, setPopularQuestions] = useState<IQuestion[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    tagService.getPopular(100).then((res: any) => {
      if (res?.data) setTopics(res.data);
    }).catch(() => {});

    questionService.search({ sortBy: 'popular', limit: 5 }).then((res: any) => {
      if (res?.data?.data) setPopularQuestions(res.data.data);
    }).catch(() => {});
  }, []);

  const handleAttachFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files)
      .slice(0, 5 - attachedFiles.length)
      .map((file) => {
        const isImage = file.type.startsWith('image/');
        return {
          file,
          preview: isImage ? URL.createObjectURL(file) : '',
          isImage
        };
      });
    setAttachedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (idx: number) => {
    setAttachedFiles((prev) => {
      const removed = prev[idx];
      if (removed.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const getFileIcon = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (['pdf'].includes(ext)) return '📄';
    if (['doc', 'docx'].includes(ext)) return '📝';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊';
    if (['ppt', 'pptx'].includes(ext)) return '📑';
    if (['txt'].includes(ext)) return '📃';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    
    if (!title.trim() || !content.trim()) {
      setError('Tiêu đề và nội dung không được để trống');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      let finalContent = content.trim();
      if (attachedFiles.length > 0) {
        const uploadResults = await Promise.all(
          attachedFiles.map(async (item) => {
            if (item.isImage) {
              const uploaded = await fileService.uploadImage(item.file);
              return { type: 'image', url: uploaded.url, name: item.file.name };
            }
            const uploaded = await fileService.uploadFile(item.file);
            return { type: 'document', url: uploaded.url, name: item.file.name };
          })
        );

        const images = uploadResults.filter((r) => r.type === 'image');
        const docs = uploadResults.filter((r) => r.type === 'document');

        if (images.length > 0) {
          const imgTags = images.map(
            (r) => `<img src="${r.url}" style="max-width:100%;border-radius:8px;margin:4px 4px 0 0;" alt="${r.name}" />`
          );
          finalContent += `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;">${imgTags.join('')}</div>`;
        }

        if (docs.length > 0) {
          const docLinks = docs.map(
            (r) => `<a href="${r.url}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;color:#334155;font-weight:600;font-size:14px;text-decoration:none;margin:4px 4px 0 0;">📎 ${r.name}</a>`
          );
          finalContent += `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;">${docLinks.join('')}</div>`;
        }
      }

      const response = await questionService.create({
        title: title.trim(),
        content: finalContent,
        topicId: selectedTopicId || undefined,
        isAnonymous,
        type: questionType,
        pollOptions: questionType === 'poll' ? pollOptions.filter((o) => o.trim()) : undefined
      });
      if (response?.data?._id) {
        router.push(`/questions/${response.data._id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Đặt câu hỏi | Thăng Long Forum</title>
      </Head>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 pb-12">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
          <Edit3 className="w-6 h-6 text-amber-500" strokeWidth={2.5} /> Đặt câu hỏi mới
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-semibold px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 mt-2">
          
          {/* Main Form Left Column */}
          <div className="flex-1 bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-100 p-6 md:p-8 flex flex-col gap-6 w-full min-w-0">
            
            {/* Title Section */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-800">Tiêu đề câu hỏi <span className="text-red-500">*</span></label>
              <input 
                type="text"
                value={title}
                maxLength={200}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Viết tiêu đề ngắn gọn, rõ ràng..."
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium placeholder-slate-400"
              />
              <div className="flex justify-between items-center mt-0.5">
                <p className="text-[13px] font-medium text-slate-400">
                  Ví dụ: &quot;Cách implement thuật toán Quicksort trong Python?&quot;
                </p>
                <span className="text-[12px] font-semibold text-slate-400">{title.length}/200</span>
              </div>
            </div>

            {/* Rich Text Editor + File attach */}
            <div className="flex flex-col gap-2 mt-2">
              <label className="text-sm font-semibold text-slate-800">Nội dung câu hỏi <span className="text-red-500">*</span></label>
              <RichEditor
                value={content}
                onChange={setContent}
                placeholder="Mô tả chi tiết câu hỏi của bạn..."
                minHeight={220}
              />

              {/* File previews */}
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {attachedFiles.map((item, idx) => (
                    <div key={idx} className="relative group">
                      {item.isImage ? (
                        <img
                          src={item.preview}
                          alt=""
                          className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                        />
                      ) : (
                        <div className="h-20 w-20 flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-slate-50 px-1">
                          <span className="text-2xl">{getFileIcon(item.file)}</span>
                          <span className="text-[10px] font-semibold text-slate-500 text-center truncate w-full mt-1">
                            {item.file.name.length > 12 ? item.file.name.substring(0, 10) + '...' : item.file.name}
                          </span>
                          <span className="text-[9px] text-slate-400">{formatFileSize(item.file.size)}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Attach file button */}
              <div className="flex items-center gap-2 mt-0.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES}
                  multiple
                  className="hidden"
                  onChange={(e) => { handleAttachFiles(e.target.files); e.target.value = ''; }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-blue-600 transition px-2 py-1 rounded-lg hover:bg-blue-50"
                >
                  <Paperclip className="w-4 h-4" /> Đính kèm tệp
                </button>
                {attachedFiles.length > 0 && (
                  <span className="text-[12px] text-slate-400">{attachedFiles.length}/5 tệp</span>
                )}
                <span className="text-[11px] text-slate-300 ml-1">Ảnh, PDF, Word, Excel, PowerPoint</span>
              </div>
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

            {/* Question Type */}
            <div className="flex flex-col gap-2 mt-4">
              <label className="text-sm font-semibold text-slate-800">Loại câu hỏi</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setQuestionType('text')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition ${questionType === 'text' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-gray-200 hover:bg-slate-50'}`}
                >
                  <Edit3 className="w-4 h-4 inline mr-1.5" /> Hỏi đáp
                </button>
                <button
                  type="button"
                  onClick={() => setQuestionType('poll')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition ${questionType === 'poll' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-gray-200 hover:bg-slate-50'}`}
                >
                  <BarChart3 className="w-4 h-4 inline mr-1.5" /> Khảo sát
                </button>
              </div>
            </div>

            {/* Poll Options */}
            {questionType === 'poll' && (
              <div className="flex flex-col gap-2 mt-4">
                <label className="text-sm font-semibold text-slate-800">Các lựa chọn khảo sát (tối thiểu 2)</label>
                <div className="space-y-2">
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...pollOptions];
                          newOpts[idx] = e.target.value;
                          setPollOptions(newOpts);
                        }}
                        placeholder={`Lựa chọn ${idx + 1}`}
                        className="flex-1 bg-slate-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-red-500 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 6 && (
                    <button
                      type="button"
                      onClick={() => setPollOptions([...pollOptions, ''])}
                      className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition mt-1"
                    >
                      <Plus className="w-4 h-4" /> Thêm lựa chọn
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Anonymous Toggle */}
            <div className="mt-4 bg-slate-50/80 border border-gray-100 p-4 rounded-xl flex items-start gap-3 w-full">
              <div className="pt-0.5">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>
              <div>
                <h4 className="font-bold text-[14px] text-slate-800 flex items-center gap-2">
                  <span className="text-slate-400">🕵️‍♂️</span> Đặt câu hỏi ẩn danh
                </h4>
                <p className="text-[13px] font-medium text-slate-500 mt-0.5">
                  Tên của bạn sẽ hiển thị bằng một biệt danh ngẫu nhiên (VD: Cáo lém lỉnh) với người khác
                </p>
              </div>
            </div>

            {/* Submit Actions */}
            <div className="flex items-center justify-end gap-3 mt-6 border-t border-gray-100 pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>🚀</span>} Đăng câu hỏi
              </button>
            </div>
          </div>

          {/* Right Column (Instructions & Suggestions) */}
          <div className="w-full lg:w-[340px] flex flex-col gap-6 shrink-0">
            
            {/* Guidelines Card */}
            <div className="bg-[#f0f7ff] border border-blue-100/60 rounded-2xl p-6 shadow-sm">
              <h3 className="flex items-center gap-2 text-[14px] font-bold text-blue-700 mb-4 tracking-tight">
                <Lightbulb className="w-5 h-5 fill-yellow-400 text-yellow-500" /> Mẹo đặt câu hỏi hay
              </h3>
              <ul className="space-y-3.5">
                <li className="flex items-start gap-2.5 text-[14px] font-semibold text-slate-700">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 text-blue-500 stroke-[3]" /> Tiêu đề rõ ràng, cụ thể
                </li>
                <li className="flex items-start gap-2.5 text-[14px] font-semibold text-slate-700">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 text-blue-500 stroke-[3]" /> Mô tả những gì bạn đã thử
                </li>
                <li className="flex items-start gap-2.5 text-[14px] font-semibold text-slate-700">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 text-blue-500 stroke-[3]" /> Đính kèm ảnh/tệp nếu cần
                </li>
                <li className="flex items-start gap-2.5 text-[14px] font-semibold text-slate-700">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 text-blue-500 stroke-[3]" /> Chọn đúng chủ đề &amp; tag
                </li>
                <li className="flex items-start gap-2.5 text-[14px] font-semibold text-slate-700">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 text-blue-500 stroke-[3]" /> Tham khảo các câu hỏi phía dưới
                </li>
              </ul>
            </div>

            {/* Popular Questions Card */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h3 className="flex items-center gap-2 text-[14px] font-bold text-slate-800 mb-4 tracking-tight">
                <TrendingUp className="w-5 h-5 text-blue-500" strokeWidth={2.5} /> Câu hỏi phổ biến
              </h3>
              {popularQuestions.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {popularQuestions.map((q: any) => (
                    <Link key={q._id} href={`/questions/${q._id}`} className="group flex flex-col gap-1.5">
                      <h4 className="text-[13px] font-semibold text-slate-700 group-hover:text-blue-600 transition leading-snug line-clamp-2">
                        {q.title}
                      </h4>
                      <div className="flex items-center gap-3 text-[12px] font-medium text-slate-400">
                        <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> {q.voteScore || 0}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {q.answerCount || 0}</span>
                        <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {q.viewCount || 0}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-[14px] font-medium text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-dashed border-gray-200 text-center">
                  Đang tải dữ liệu...
                </p>
              )}
            </div>

          </div>
        </div>
      </form>
    </>
  );
}
