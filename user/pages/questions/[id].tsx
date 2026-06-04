import React, { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { 
  ChevronRight, Eye, Flag, ShieldCheck, 
  MessageSquare, ChevronUp, ChevronDown, Check,
  BookOpen, Edit2, CheckCircle2, Tag, HelpCircle, Loader2,
  MessageCircle, Send, Pin, X, BarChart3, Trash2, AlertCircle, List, History
} from 'lucide-react';
import { questionService } from '@services/question.service';

import { followService } from '@services/follow.service';
import { pollService } from '@services/poll.service';
import { reportService } from '@services/report.service';
import { IQuestion, IAnswer, IComment, IPollOption } from '@interfaces/question';
import { useCurrentUserStore } from 'src/stores';
import { toast } from '@lib/toast';
import { getSnippet } from '@utils/html';

const RichEditor = dynamic(() => import('src/components/common/RichEditor'), { ssr: false });

export default function QuestionDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { currentUser } = useCurrentUserStore();
  const [question, setQuestion] = useState<IQuestion | null>(null);
  const [answers, setAnswers] = useState<IAnswer[]>([]);
  const [answerContent, setAnswerContent] = useState('');
  const [answerSort, setAnswerSort] = useState('votes');
  const [loading, setLoading] = useState(true);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string, IComment[]>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [showCommentEditor, setShowCommentEditor] = useState<Record<string, boolean>>({});
  const [myVotes, setMyVotes] = useState<Record<string, number>>({});

  const [isFollowing, setIsFollowing] = useState(false);
  const [pollOptions, setPollOptions] = useState<IPollOption[]>([]);
  const [pollTotalVotes, setPollTotalVotes] = useState(0);
  const [myPollVote, setMyPollVote] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportTargetType, setReportTargetType] = useState<string>('question');
  const [reportTargetId, setReportTargetId] = useState<string>('');
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [historyItem, setHistoryItem] = useState<{ title?: string; content: string; editedAt: Date }[] | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const answersRef = useRef<HTMLDivElement>(null);

  const loadQuestion = useCallback(async () => {
    if (!id || typeof id !== 'string') return;
    setLoading(true);
    try {
      const response = await questionService.findById(id);
      if (response?.data) setQuestion(response.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadAnswers = useCallback(async () => {
    if (!id || typeof id !== 'string') return;
    try {
      const response = await questionService.getAnswers(id, answerSort);
      if (response?.data) setAnswers(response.data);
    } catch {
      // silent
    }
  }, [id, answerSort]);

  useEffect(() => { loadQuestion(); }, [loadQuestion]);
  useEffect(() => { loadAnswers(); }, [loadAnswers]);

  // Load follow status
  useEffect(() => {
    if (!id || typeof id !== 'string' || !currentUser) return;
    const loadStatus = async () => {
      try {
        const flRes: any = await followService.isFollowing(id);
        if (flRes?.data !== undefined) setIsFollowing(flRes.data.following);
        else if (flRes?.following !== undefined) setIsFollowing(flRes.following);
      } catch { /* silent */ }
    };
    loadStatus();
  }, [id, currentUser]);

  // Gắn click handler cho ảnh trong nội dung để mở lightbox
  useEffect(() => {
    const handleImgClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        setLightboxSrc((target as HTMLImageElement).src);
      }
    };
    contentRef.current?.addEventListener('click', handleImgClick);
    answersRef.current?.addEventListener('click', handleImgClick);
    return () => {
      contentRef.current?.removeEventListener('click', handleImgClick);
      answersRef.current?.removeEventListener('click', handleImgClick);
    };
  }, [question, answers]);

  // Load poll data
  useEffect(() => {
    if (!id || typeof id !== 'string' || !question || question.type !== 'poll') return;
    const loadPoll = async () => {
      try {
        const res: any = await pollService.getResults(id);
        if (res?.data) {
          setPollOptions(res.data.options || []);
          setPollTotalVotes(res.data.totalVotes || 0);
        }
        if (currentUser) {
          const voteRes: any = await pollService.getMyVote(id);
          if (voteRes?.data) setMyPollVote(voteRes.data?.optionId || null);
        }
      } catch { /* silent */ }
    };
    loadPoll();
  }, [id, question, currentUser]);

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

  const getAvatarEl = (user: any, size = 'w-8 h-8') => {
    if (user?.avatarUrl) {
      return <img src={user.avatarUrl} alt={user.name} className={`${size} rounded-full object-cover`} />;
    }
    return (
      <div className={`${size} rounded-full text-white flex items-center justify-center text-xs font-bold ${getAvatarColor(user?.name || 'U')}`}>
        {getInitials(user?.name || 'U')}
      </div>
    );
  };

  const handleVote = async (answerId: string, type: number) => {
    try {
      const response = await questionService.vote(answerId, type);
      if (response?.data) {
        setAnswers((prev) => prev.map((a) => a._id === answerId ? { ...a, voteScore: response.data.voteScore } : a));
        setMyVotes((prev) => ({
          ...prev,
          [answerId]: response.data.vote ? response.data.vote.type : 0
        }));
      }
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra khi xác nhận câu trả lời');
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!getSnippet(answerContent)) {
      toast.error('Nội dung không được để trống');
      return;
    }
    if (!id || typeof id !== 'string') return;
    setSubmittingAnswer(true);
    try {
      await questionService.createAnswer(id, answerContent);
      setAnswerContent('');
      loadAnswers();
      setQuestion((prev) => prev ? { ...prev, answerCount: prev.answerCount + 1 } : prev);
    } catch {
      // silent
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleAcceptAnswer = async (answerId: string) => {
    try {
      await questionService.acceptAnswer(answerId);
      loadAnswers();
      setQuestion((prev) => prev ? { ...prev, status: 'resolved' } : prev);
    } catch {
      // silent
    }
  };

  const loadComments = async (answerId: string) => {
    try {
      const response = await questionService.getComments(answerId);
      if (response?.data) {
        setCommentsMap((prev) => ({ ...prev, [answerId]: response.data }));
      }
    } catch {
      // silent
    }
  };

  const toggleComments = (answerId: string) => {
    const isShowing = !showComments[answerId];
    setShowComments((prev) => ({ ...prev, [answerId]: isShowing }));
    if (isShowing && !commentsMap[answerId]) {
      loadComments(answerId);
    }
  };

  const handleSubmitComment = async (answerId: string) => {
    const content = commentInputs[answerId] || '';
    if (!getSnippet(content)) {
      toast.error('Nội dung bình luận không được để trống');
      return;
    }
    try {
      await questionService.createComment(answerId, content);
      setCommentInputs((prev) => ({ ...prev, [answerId]: '' }));
      setShowCommentEditor((prev) => ({ ...prev, [answerId]: false }));
      loadComments(answerId);
      setAnswers((prev) => prev.map((a) => a._id === answerId ? { ...a, commentCount: a.commentCount + 1 } : a));
    } catch {
      // silent
    }
  };

  const isOwner = currentUser && question && currentUser._id === (question.userId as any)?._id;
  const isTeacherOrAdmin = currentUser && ['admin', 'teacher'].includes(currentUser.role);

  const confirmDeleteQuestion = async () => {
    setDeleting(true);
    try {
      await questionService.delete(id as string);
      toast.success('Xóa câu hỏi thành công');
      router.push('/my-questions');
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra');
    } finally {
      setDeleting(false);
    }
  };

  const isEdited = (item: any) => {
    return Array.isArray(item?.editHistory) && item.editHistory.length > 0;
  };

  // ─── Edit/Delete Answer ───
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [editAnswerContent, setEditAnswerContent] = useState('');
  const [editAnswerOriginal, setEditAnswerOriginal] = useState('');
  const [deletingAnswerId, setDeletingAnswerId] = useState<string | null>(null);

  const handleEditAnswer = (answer: IAnswer) => {
    setEditingAnswerId(answer._id);
    setEditAnswerContent(answer.content);
    setEditAnswerOriginal(answer.content);
  };

  const handleSaveAnswer = async () => {
    if (!editingAnswerId || !editAnswerContent.trim()) return;
    try {
      const res: any = await questionService.updateAnswer(editingAnswerId, editAnswerContent.trim());
      if (res?.data) {
        setAnswers((prev) => prev.map((a) => a._id === editingAnswerId ? { ...a, ...res.data } : a));
      }
      setEditingAnswerId(null);
      setEditAnswerContent('');
      toast.success('Cập nhật câu trả lời thành công');
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra');
    }
  };

  const handleDeleteAnswer = async (answerId: string) => {
    try {
      await questionService.deleteAnswer(answerId);
      setAnswers((prev) => prev.filter((a) => a._id !== answerId));
      setQuestion((prev) => prev ? { ...prev, answerCount: prev.answerCount - 1 } : prev);
      setDeletingAnswerId(null);
      toast.success('Xóa câu trả lời thành công');
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra');
    }
  };

  // ─── Edit/Delete Comment ───
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [editCommentOriginal, setEditCommentOriginal] = useState('');

  const handleEditComment = (comment: IComment) => {
    setEditingCommentId(comment._id);
    setEditCommentContent(comment.content);
    setEditCommentOriginal(comment.content);
  };

  const handleSaveComment = async (answerId: string) => {
    if (!editingCommentId || !editCommentContent.trim()) return;
    try {
      await questionService.updateComment(editingCommentId, editCommentContent.trim());
      setEditingCommentId(null);
      setEditCommentContent('');
      loadComments(answerId);
      toast.success('Cập nhật bình luận thành công');
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra');
    }
  };

  const handleDeleteComment = async (commentId: string, answerId: string) => {
    try {
      await questionService.deleteComment(commentId);
      setCommentsMap((prev) => ({
        ...prev,
        [answerId]: (prev[answerId] || []).filter((c) => c._id !== commentId)
      }));
      setAnswers((prev) => prev.map((a) => a._id === answerId ? { ...a, commentCount: a.commentCount - 1 } : a));
      toast.success('Xóa bình luận thành công');
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="text-center py-20">
        <HelpCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-lg font-semibold text-slate-500">Không tìm thấy câu hỏi</p>
      </div>
    );
  }

  const author = question.userId as any;

  return (
    <>
      <Head>
        <title>{question.title} | Thăng Long Forum</title>
      </Head>

      <div className="flex flex-col gap-6 pb-12">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[14px] font-bold text-slate-500">
          <Link href="/home" className="hover:text-blue-600 transition">Trang chủ</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-400 font-medium">Chi tiết</span>
        </div>

        {/* Main Split Layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Left Column (Main Content) */}
          <div className="flex-1 flex flex-col gap-6 w-full min-w-0">
            
            {/* Question Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 relative">
              
              <h1 className="text-2xl font-bold text-slate-900 mb-4 leading-tight tracking-tight flex items-center gap-3 flex-wrap">
                {question.title}
                {(question as any).topicId && (
                  <span className="text-[13px] leading-tight font-bold px-3 py-1 rounded-md bg-blue-50 text-blue-600 border border-blue-100">
                    {(question as any).topicId?.name || ''}
                  </span>
                )}
              </h1>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-[13px] font-bold text-slate-500 mb-6">
                <div className="flex items-center gap-2">
                  {getAvatarEl(author)}
                  <span className="text-slate-800">{author?.name}</span>
                  {author?.role === 'teacher' && (
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Giảng viên
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-1.5">
                  <span>{getTimeDiff(question.createdAt)}</span>
                  {isEdited(question) && (
                    <button onClick={() => setHistoryItem([...(question as any).editHistory, { title: question.title, content: question.content, editedAt: new Date() }])} className="text-[12px] font-normal italic text-slate-400 hover:text-blue-500 hover:underline transition flex items-center gap-1" title="Lịch sử chỉnh sửa">
                      <History className="w-3.5 h-3.5" /> (đã chỉnh sửa)
                    </button>
                  )}
                </div>
                
                {question.status === 'resolved' && (
                  <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-emerald-100/50">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã giải quyết
                  </span>
                )}
                {question.status === 'closed' && (
                  <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-md text-xs font-bold border border-red-100">
                    Đã đóng
                  </span>
                )}
              </div>




              <div
                ref={contentRef}
                className="prose prose-slate max-w-none text-[15px] font-medium text-slate-800 leading-relaxed space-y-4 [&_img]:rounded-lg [&_img]:max-w-[240px] [&_img]:max-h-[180px] [&_img]:object-cover [&_img]:cursor-pointer [&_img]:hover:opacity-80 [&_img]:transition-opacity [&_img]:border [&_img]:border-gray-200"
                dangerouslySetInnerHTML={{ __html: question.content }}
              />

              {/* Poll Section */}
              {question.type === 'poll' && pollOptions.length > 0 && (
                <div className="mt-6 p-5 bg-slate-50 rounded-xl border border-gray-200">
                  <h3 className="text-[15px] font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <BarChart3 className="w-4 h-4 text-blue-500" /> Khảo sát ({pollTotalVotes} lượt bỏ phiếu)
                  </h3>
                  <div className="space-y-3">
                    {pollOptions.map((opt) => {
                      const pct = pollTotalVotes > 0 ? Math.round((opt.voteCount / pollTotalVotes) * 100) : 0;
                      const isMyVote = myPollVote === opt._id;
                      return (
                        <button
                          key={opt._id}
                          onClick={async () => {
                            try {
                              const res: any = await pollService.vote(question._id, opt._id);
                              if (res?.data) {
                                setPollOptions(res.data.options || []);
                                setPollTotalVotes((res.data.options || []).reduce((s: number, o: any) => s + (o.voteCount || 0), 0));
                                setMyPollVote(res.data.myVote?.optionId || null);
                              }
                            } catch { /* silent */ }
                          }}
                          className={`w-full text-left relative overflow-hidden rounded-lg border transition p-3 ${
                            isMyVote ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'
                          }`}
                        >
                          <div className="absolute left-0 top-0 bottom-0 bg-blue-100/60 transition-all" style={{ width: `${pct}%` }} />
                          <div className="relative flex items-center justify-between">
                            <span className={`text-[14px] font-semibold ${isMyVote ? 'text-blue-700' : 'text-slate-700'}`}>
                              {isMyVote && <Check className="w-3.5 h-3.5 inline mr-1.5" />}{opt.content}
                            </span>
                            <span className="text-[13px] font-bold text-slate-500">{pct}%</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Footer */}
              <div className="flex flex-wrap items-center justify-between border-t border-gray-100 pt-5 mt-8">
                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      if (!currentUser) {
                        toast.error('Bạn cần đăng nhập để theo dõi câu hỏi');
                        return;
                      }
                      try {
                        const res: any = await followService.toggle(question._id);
                        const isF = res?.data?.following !== undefined ? res.data.following : res?.following;
                        if (isF !== undefined) {
                          setIsFollowing(isF);
                          toast.success(isF ? 'Đã theo dõi câu hỏi' : 'Đã bỏ theo dõi câu hỏi');
                        }
                      } catch (err: any) { 
                        toast.error(err.message || 'Có lỗi xảy ra khi theo dõi');
                      }
                    }}
                    className={`flex items-center gap-1.5 text-[13px] font-bold px-3 py-1.5 rounded-lg border transition ${
                      isFollowing
                        ? 'text-white bg-emerald-600 border-emerald-600 hover:bg-emerald-700'
                        : 'text-slate-600 bg-white border-gray-200 hover:bg-slate-50 hover:text-blue-600'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" /> {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                  </button>
                  {isOwner && (
                    <div className="flex items-center gap-2">
                       <Link href={`/questions/edit?id=${question._id}`} className="flex items-center gap-1.5 text-[13px] font-bold text-slate-600 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition">
                         <Edit2 className="w-3.5 h-3.5" /> Sửa
                       </Link>
                       <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-1.5 text-[13px] font-bold text-red-600 bg-white border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition">
                         <Trash2 className="w-3.5 h-3.5" /> Xóa
                       </button>
                    </div>
                  )}
                  {!isOwner && (
                    <button
                      onClick={() => {
                        setReportTargetType('question');
                        setReportTargetId(question._id);
                        setShowReportModal(true);
                      }}
                      className="flex items-center gap-1.5 text-[13px] font-bold text-slate-500 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition"
                    >
                      <Flag className="w-3.5 h-3.5" /> Báo cáo
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[13px] font-bold text-slate-400 mt-4 sm:mt-0">
                  <Eye className="w-4 h-4" /> {question.viewCount} lượt xem
                </div>
              </div>
            </div>

            {/* Answers Section Header */}
            <div className="flex items-center justify-between mt-2">
              <h2 className="text-[17px] font-bold text-slate-800 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-slate-400" /> {question.answerCount} câu trả lời
              </h2>
              <select
                value={answerSort}
                onChange={(e) => setAnswerSort(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-[13px] font-bold text-slate-700 outline-none cursor-pointer shadow-sm"
              >
                <option value="votes">Câu trả lời: vote cao nhất</option>
                <option value="newest">Câu trả lời: mới nhất</option>
              </select>
            </div>

            {/* Answer Cards */}
            <div ref={answersRef}>
            {answers.map((answer) => {
              const aUser = answer.userId as any;
              const myVote = myVotes[answer._id] || 0;

              return (
                <div key={answer._id} className={`bg-white rounded-2xl shadow-sm p-6 flex gap-4 md:gap-6 relative overflow-hidden ${answer.voteScore > 0 ? 'border border-emerald-200' : 'border border-gray-100'}`}>
                  {answer.voteScore > 0 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400"></div>}
                  
                  {/* Voting Sidebar */}
                  <div className="flex flex-col items-center gap-2 shrink-0 pt-2 min-w-[60px]">
                    {(isOwner || isTeacherOrAdmin) ? (
                      <button
                        onClick={() => handleVote(answer._id, 1)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition shadow-sm border ${myVote === 1 ? 'bg-blue-600 text-white border-blue-600 ring-4 ring-blue-50' : 'bg-slate-50 text-slate-400 border-gray-200 hover:bg-blue-50 hover:text-blue-600'}`}
                        title={myVote === 1 ? 'Hủy Vote' : 'Vote cho câu trả lời này'}
                      >
                        <ChevronUp className="w-6 h-6" strokeWidth={myVote === 1 ? 3 : 2.5} />
                      </button>
                    ) : (
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 border border-gray-100 text-slate-300">
                        <ChevronUp className="w-6 h-6" strokeWidth={2} />
                      </div>
                    )}
                    
                    <div className="flex flex-col items-center mt-1">
                       <span className={`text-[20px] font-extrabold leading-none ${answer.voteScore > 0 ? 'text-blue-600' : 'text-slate-600'}`}>{answer.voteScore}</span>
                       <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">Vote</span>
                    </div>
                  </div>

                  {/* Answer Content */}
                  <div className="flex-1 min-w-0">
                    {answer.voteScore > 0 && (
                      <div className="bg-blue-50 text-blue-700 text-[11px] font-bold px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 mb-3 border border-blue-200/50">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã nhận được {answer.voteScore} lượt Vote
                      </div>
                    )}
                    
                    {/* Author Info (Moved above) */}
                    <div className="flex items-center gap-3 mb-4">
                      {getAvatarEl(aUser)}
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-bold text-slate-800">{aUser?.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] font-medium text-slate-500">{getTimeDiff(answer.createdAt)}</span>
                          {isEdited(answer) && (
                            <button onClick={() => setHistoryItem([...(answer as any).editHistory, { content: answer.content, editedAt: new Date() }])} className="text-[11px] font-normal italic text-slate-400 hover:text-blue-500 hover:underline transition flex items-center gap-1" title="Lịch sử chỉnh sửa">
                              <History className="w-3 h-3" /> (đã chỉnh sửa)
                            </button>
                          )}
                        </div>
                      </div>
                      {aUser?.role === 'teacher' && (
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 ml-1">
                          <ShieldCheck className="w-3 h-3" /> Giảng viên
                        </span>
                      )}
                    </div>

                    {editingAnswerId === answer._id ? (
                      <div className="space-y-3">
                        <RichEditor
                          value={editAnswerContent}
                          onChange={setEditAnswerContent}
                          placeholder="Chỉnh sửa câu trả lời..."
                          minHeight={120}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleSaveAnswer}
                            className="px-4 py-1.5 bg-blue-600 text-white text-[13px] font-bold rounded-lg hover:bg-blue-700 transition flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" /> Lưu
                          </button>
                          <button
                            onClick={() => { setEditingAnswerId(null); setEditAnswerContent(''); setEditAnswerOriginal(''); }}
                            className="px-4 py-1.5 bg-white text-slate-600 text-[13px] font-bold rounded-lg border border-gray-200 hover:bg-slate-50 transition"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        
                        <div
                          className="prose prose-slate max-w-none text-[15px] font-medium text-slate-800 leading-relaxed space-y-3 [&_img]:rounded-lg [&_img]:max-w-[240px] [&_img]:max-h-[180px] [&_img]:object-cover [&_img]:cursor-pointer [&_img]:hover:opacity-80 [&_img]:transition-opacity [&_img]:border [&_img]:border-gray-200"
                          dangerouslySetInnerHTML={{ __html: answer.content }}
                        />
                      </>
                    )}

                    {/* Pin + Edit + Delete + Report buttons */}
                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                      {isTeacherOrAdmin && (
                        <button
                          onClick={async () => {
                            try {
                              const res: any = await questionService.pinAnswer(answer._id);
                              if (res?.data) {
                                setAnswers((prev) => prev.map((a) => a._id === answer._id ? { ...a, isPinned: res.data.isPinned } : a));
                              }
                            } catch { /* silent */ }
                          }}
                          className={`flex items-center gap-1 text-[12px] font-bold px-2.5 py-1 rounded-md border transition ${
                            answer.isPinned
                              ? 'bg-amber-100 text-amber-700 border-amber-200'
                              : 'bg-white text-slate-500 border-gray-200 hover:bg-amber-50 hover:text-amber-600'
                          }`}
                        >
                          <Pin className="w-3 h-3" /> {answer.isPinned ? 'Đã ghim' : 'Ghim'}
                        </button>
                      )}
                      {(currentUser?._id === aUser?._id || isTeacherOrAdmin) && editingAnswerId !== answer._id && (
                        <>
                          <button
                            onClick={() => handleEditAnswer(answer)}
                            className="flex items-center gap-1 text-[12px] font-bold text-slate-500 hover:text-blue-600 transition"
                          >
                            <Edit2 className="w-3 h-3" /> Sửa
                          </button>
                          <button
                            onClick={() => setDeletingAnswerId(answer._id)}
                            className="flex items-center gap-1 text-[12px] font-bold text-slate-400 hover:text-red-500 transition"
                          >
                            <Trash2 className="w-3 h-3" /> Xóa
                          </button>
                        </>
                      )}
                      {currentUser?._id !== aUser?._id && (
                        <button
                          onClick={() => {
                            setReportTargetType('answer');
                            setReportTargetId(answer._id);
                            setShowReportModal(true);
                          }}
                          className="flex items-center gap-1 text-[12px] font-bold text-slate-400 hover:text-red-500 transition"
                        >
                          <Flag className="w-3 h-3" /> Báo cáo
                        </button>
                      )}
                    </div>

                    {/* Comment toggle */}
                    <div className="mt-4 pt-3 border-t border-gray-50">
                      <button
                        onClick={() => toggleComments(answer._id)}
                        className="text-[13px] font-semibold text-slate-500 hover:text-blue-600 transition flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> {answer.commentCount} bình luận
                      </button>

                      {showComments[answer._id] && (
                        <div className="mt-3 space-y-3">
                          {(commentsMap[answer._id] || []).map((comment) => (
                            <div key={comment._id} className="flex gap-2 pl-2 border-l-2 border-slate-100">
                              <div className="pt-0.5">
                                {getAvatarEl(comment.userId as any, 'w-7 h-7')}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="text-[13px] font-bold text-slate-700">{(comment.userId as any)?.name}</span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[11px] text-slate-400">{getTimeDiff(comment.createdAt)}</span>
                                    {isEdited(comment) && (
                                      <button onClick={() => setHistoryItem([...(comment as any).editHistory, { content: comment.content, editedAt: new Date() }])} className="text-[10px] font-normal italic text-slate-400 hover:text-blue-500 hover:underline transition flex items-center gap-1" title="Lịch sử chỉnh sửa">
                                        <History className="w-2.5 h-2.5" /> (đã chỉnh sửa)
                                      </button>
                                    )}
                                  </div>
                                </div>
                                {editingCommentId === comment._id ? (
                                  <div className="space-y-2">
                                    <RichEditor
                                      value={editCommentContent}
                                      onChange={setEditCommentContent}
                                      placeholder="Chỉnh sửa bình luận..."
                                      minHeight={60}
                                    />
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleSaveComment(answer._id)}
                                        className="px-3 py-1 bg-blue-600 text-white text-[12px] font-bold rounded-md hover:bg-blue-700 transition flex items-center gap-1"
                                      >
                                        <Check className="w-3 h-3" /> Lưu
                                      </button>
                                      <button
                                        onClick={() => { setEditingCommentId(null); setEditCommentContent(''); setEditCommentOriginal(''); }}
                                        className="px-3 py-1 bg-white text-slate-500 text-[12px] font-bold rounded-md border border-gray-200 hover:bg-slate-50 transition"
                                      >
                                        Hủy
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    
                                    <div 
                                      className="text-[13px] text-slate-600 prose prose-sm max-w-none [&_img]:max-w-[120px] [&_img]:max-h-[120px] [&_img]:rounded-md [&_img]:object-cover [&_p]:m-0"
                                      dangerouslySetInnerHTML={{ __html: comment.content }}
                                    />
                                    <div className="flex items-center gap-2 mt-1.5">
                                      {(currentUser?._id === (comment.userId as any)?._id || isTeacherOrAdmin) && (
                                        <>
                                          <button
                                            onClick={() => handleEditComment(comment)}
                                            className="text-[11px] font-bold text-slate-400 hover:text-blue-600 transition flex items-center gap-1"
                                          >
                                            <Edit2 className="w-2.5 h-2.5" /> Sửa
                                          </button>
                                          <button
                                            onClick={() => handleDeleteComment(comment._id, answer._id)}
                                            className="text-[11px] font-bold text-slate-400 hover:text-red-500 transition flex items-center gap-1"
                                          >
                                            <Trash2 className="w-2.5 h-2.5" /> Xóa
                                          </button>
                                        </>
                                      )}
                                      {currentUser && currentUser._id !== (comment.userId as any)?._id && (
                                        <button
                                          onClick={() => {
                                            setReportTargetType('comment');
                                            setReportTargetId(comment._id);
                                            setShowReportModal(true);
                                          }}
                                          className="text-[11px] font-bold text-slate-400 hover:text-red-500 transition flex items-center gap-1"
                                        >
                                          <Flag className="w-2.5 h-2.5" /> Báo cáo
                                        </button>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}

                          {/* Comment input */}
                          {showCommentEditor[answer._id] ? (
                            <div className="flex flex-col gap-2 mt-2 border border-gray-200 rounded-lg p-2 bg-slate-50">
                              <RichEditor
                                value={commentInputs[answer._id] || ''}
                                onChange={(val) => setCommentInputs((prev) => ({ ...prev, [answer._id]: val }))}
                                placeholder="Viết bình luận..."
                                minHeight={60}
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowCommentEditor((prev) => ({ ...prev, [answer._id]: false }));
                                    setCommentInputs((prev) => ({ ...prev, [answer._id]: '' }));
                                  }}
                                  className="px-3 py-1.5 bg-white text-slate-600 text-sm font-semibold rounded-lg border border-gray-200 hover:bg-slate-50 transition"
                                >
                                  Hủy
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSubmitComment(answer._id)}
                                  className="px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition flex items-center gap-1"
                                >
                                  Gửi <Send className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowCommentEditor((prev) => ({ ...prev, [answer._id]: true }))}
                              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-600 hover:text-blue-700 transition"
                            >
                              <MessageCircle className="w-3.5 h-3.5" /> Viết bình luận
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            </div>

            {/* Answer Form */}
            {question.status !== 'closed' && (
              <form onSubmit={handleSubmitAnswer} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-2">
                <h3 className="text-[16px] font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <Edit2 className="w-4 h-4 text-amber-500" strokeWidth={3} /> Thêm câu trả lời của bạn
                </h3>
                
                <RichEditor
                  value={answerContent}
                  onChange={(val) => setAnswerContent(val)}
                  placeholder="Chia sẻ kiến thức của bạn... Hãy viết rõ ràng và chi tiết để giúp ích cho mọi người nhé!"
                  minHeight={160}
                />

                <div className="flex items-center justify-end gap-3 mt-4">
                  <button
                    type="submit"
                    disabled={submittingAnswer || !getSnippet(answerContent)}
                    className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {submittingAnswer && <Loader2 className="w-4 h-4 animate-spin" />}
                    Đăng câu trả lời →
                  </button>
                </div>
              </form>
            )}

          </div>

          {/* Right Column */}
          <div className="w-full lg:w-[320px] flex flex-col gap-6 shrink-0 mt-6 lg:mt-0">
            
            {/* Answer Tips Card */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h3 className="text-[17px] font-bold text-slate-800 mb-5 tracking-tight">
                Mẹo trả lời câu hỏi hay
              </h3>
              
              <ul className="space-y-4 text-[14px]">
                <li className="flex items-start gap-3 text-slate-700">
                  <Check className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                  <span><strong>1. Hãy tôn trọng:</strong> Luôn lịch sự và tôn trọng người khác.</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700">
                  <Check className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                  <span><strong>2. Cung cấp bằng chứng/nguồn:</strong> Trích dẫn nguồn hoặc đưa ra ví dụ.</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700">
                  <List className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
                  <span><strong>3. Tránh câu trả lời quá ngắn:</strong> Hãy viết rõ ràng và chi tiết.</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700">
                  <List className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
                  <span><strong>4. Tập trung vào câu hỏi:</strong> Chỉ trả lời những gì được hỏi.</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700">
                  <List className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
                  <span><strong>5. Giúp đỡ cộng đồng:</strong> Viết câu trả lời mà người khác có thể học hỏi.</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowReportModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[17px] font-bold text-slate-900 flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-500" /> Báo cáo vi phạm
              </h3>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Lý do báo cáo</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500"
                >
                  <option value="">-- Chọn lý do --</option>
                  <option value="spam">Spam / Quảng cáo</option>
                  <option value="offensive">Nội dung xúc phạm</option>
                  <option value="inappropriate">Không phù hợp</option>
                  <option value="duplicate">Trùng lặp</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  {reportReason === 'other' ? 'Mô tả chi tiết (bắt buộc)' : 'Mô tả thêm (tùy chọn)'}
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder={reportReason === 'other' ? 'Vui lòng cung cấp mô tả chi tiết cho lý do này...' : 'Mô tả chi tiết...'}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 min-h-[80px] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition"
                >Hủy</button>
                <button
                  onClick={async () => {
                    if (!reportReason) return;
                    if (reportReason === 'other' && !reportDescription.trim()) {
                      toast.error('Vui lòng nhập mô tả chi tiết');
                      return;
                    }
                    try {
                      await reportService.create({
                        targetType: reportTargetType as any,
                        targetId: reportTargetId,
                        reason: reportReason,
                        description: reportDescription
                      });
                      toast.success('Gửi báo cáo thành công');
                      setShowReportModal(false);
                      setReportReason('');
                      setReportDescription('');
                    } catch (err: any) {
                      toast.error(err.message || 'Có lỗi xảy ra khi gửi báo cáo');
                    }
                  }}
                  disabled={!reportReason || (reportReason === 'other' && !reportDescription.trim())}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-50"
                >Gửi báo cáo</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Lightbox Modal */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 cursor-pointer"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            onClick={() => setLightboxSrc(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxSrc}
            alt="Xem ảnh"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
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
                onClick={() => setShowDeleteConfirm(false)}
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

      {/* Delete Answer Confirm Modal */}
      {deletingAnswerId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Xóa câu trả lời?</h3>
              <p className="text-[15px] font-medium text-slate-500 leading-relaxed">
                Hành động này không thể hoàn tác. Câu trả lời và tất cả bình luận liên quan sẽ bị xóa vĩnh viễn.
              </p>
            </div>
            <div className="p-4 bg-slate-50 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => setDeletingAnswerId(null)}
                className="px-4 py-2 font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => handleDeleteAnswer(deletingAnswerId)}
                className="px-4 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-sm flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* History Modal */}
      {historyItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-xl animate-in fade-in zoom-in-95 duration-200">
             <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
                <h3 className="text-[17px] font-bold text-slate-800">Lịch sử chỉnh sửa</h3>
                <button onClick={() => setHistoryItem(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
             </div>
             <div className="p-6 overflow-y-auto flex-1 space-y-6">
                {[...historyItem].reverse().map((hist, idx) => {
                  const isCurrent = idx === 0;
                  return (
                    <div key={idx} className={`border rounded-xl p-5 relative ${isCurrent ? 'border-blue-200 bg-blue-50/40' : 'border-gray-100 bg-slate-50'}`}>
                      <div className={`absolute top-4 right-4 text-[12px] font-bold px-2.5 py-1 rounded-md shadow-sm ${isCurrent ? 'text-blue-600 bg-blue-100 border border-blue-200' : 'text-slate-400 bg-white border border-gray-100'}`}>
                        {isCurrent ? 'Bản hiện tại' : `Bản ghi ${historyItem.length - idx}`}
                      </div>
                      <div className={`text-[13px] font-bold mb-3 flex items-center gap-2 ${isCurrent ? 'text-blue-600' : 'text-blue-600'}`}>
                         <div className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-emerald-500' : 'bg-blue-600'}`}></div>
                         {isCurrent ? 'Hiện tại' : new Date(hist.editedAt).toLocaleString('vi-VN')}
                      </div>
                      {hist.title && <div className="font-bold text-slate-800 text-[16px] mb-3 pb-3 border-b border-gray-200">{hist.title}</div>}
                      <div
                        className="prose prose-slate prose-sm max-w-none text-slate-700 leading-relaxed [&_img]:max-w-[200px] [&_img]:rounded-md"
                        dangerouslySetInnerHTML={{ __html: hist.content }}
                      />
                    </div>
                  );
                })}
             </div>
          </div>
        </div>
      )}
    </>
  );
}
