import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  GraduationCap, Pencil, Save, X,
  MessageSquare, ChevronUp, CheckCircle2, AlertCircle,
  Phone, Mail, Hash, Eye, Loader2, FileQuestion, Camera, Building, BookOpen, UserCircle, Trophy, BarChart3, Star, ThumbsUp
} from 'lucide-react';
import { authService } from '@services/auth.service';
import { fileService } from '@services/file.service';
import { facultyService, IFaculty, IMajor } from '@services/faculty.service';
import { useCurrentUserStore } from 'src/stores';
import { IQuestion } from '@interfaces/question';

export default function ProfilePage() {
  const { currentUser, setCurrentUser } = useCurrentUserStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'questions' | 'answers'>('questions');
  const [form, setForm] = useState({ 
    name: '', phone: '', username: '', email: '', department: '', major: '', studentClass: '', userCode: '' 
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [faculties, setFaculties] = useState<IFaculty[]>([]);
  const [majors, setMajors] = useState<IMajor[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');

  useEffect(() => {
    if (!currentUser?._id) return;
    setLoading(true);
    authService.getMyProfile()
      .then((data: any) => {
        setProfile(data);
        setForm({ 
          name: data.name || '', phone: data.phone || '', username: data.username || '',
          email: data.email || '', department: data.department || '', major: data.major || '',
          studentClass: data.studentClass || '', userCode: data.userCode || ''
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser?._id]);

  // Load faculties khi vào chế độ chỉnh sửa
  useEffect(() => {
    if (!editing) return;
    facultyService.getAllFaculties().then((list) => {
      setFaculties(list);
      // Tìm faculty đã chọn theo tên department hiện tại
      if (form.department) {
        const matched = list.find((f) => f.name === form.department);
        if (matched) setSelectedFacultyId(matched._id);
      }
    }).catch(() => {});
  }, [editing]);

  // Load majors khi chọn khoa
  useEffect(() => {
    if (!selectedFacultyId) { setMajors([]); return; }
    facultyService.getMajorsByFaculty(selectedFacultyId).then(setMajors).catch(() => setMajors([]));
  }, [selectedFacultyId]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser?._id) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) { setError('Chỉ chấp nhận ảnh JPG, PNG, WebP hoặc GIF'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Ảnh không được quá 5MB'); return; }
    setAvatarUploading(true); setError(''); setSuccess('');
    try {
      const uploaded = await fileService.uploadAvatar(file);
      const fileId = uploaded?._id?.toString?.() || uploaded?._id;
      if (!fileId) { setError('Upload thất bại: không nhận được file ID'); return; }
      await authService.updateProfile(currentUser._id, { avatarId: fileId } as any);
      // Reload profile từ server để lấy avatarUrl đã resolve
      const freshProfile = await authService.getMyProfile();
      setProfile(freshProfile);
      setCurrentUser({ ...currentUser, avatarUrl: freshProfile.avatarUrl || uploaded.url, avatarId: fileId });
      setSuccess('Cập nhật ảnh đại diện thành công!');
    } catch (err: any) { setError(err?.message || 'Upload thất bại'); }
    finally { setAvatarUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handleSave = async () => {
    if (!currentUser?._id) return;
    if (form.phone && !/^(0[3-9]\d{8}|\+84[3-9]\d{8})$/.test(form.phone)) {
      setError('Số điện thoại không hợp lệ (VD: 0901234567 hoặc +84901234567)');
      return;
    }
    setSaving(true); setError(''); setSuccess('');
    try {
      const payload: any = { name: form.name, phone: form.phone, email: form.email, department: form.department, major: form.major, studentClass: form.studentClass, userCode: form.userCode };
      if (form.username) payload.username = form.username;
      Object.keys(payload).forEach(key => { if (payload[key] === '') delete payload[key]; });
      const updated = await authService.updateProfile(currentUser._id, payload);
      setProfile((prev: any) => ({ ...prev, ...updated }));
      setCurrentUser({ ...currentUser, name: updated.name || currentUser.name });
      setSuccess('Cập nhật thành công!'); setEditing(false);
    } catch (err: any) { setError(err?.response?.data?.message || 'Cập nhật thất bại'); }
    finally { setSaving(false); }
  };

  const getInitials = (name: string) => {
    const parts = (name || '').trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return (name || 'U').substring(0, 2).toUpperCase();
  };

  const getTimeDiff = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return `${Math.floor(hours / 24)} ngày trước`;
  };

  const formatJoinDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `Tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
  };

  if (!currentUser) return <div className="flex justify-center items-center py-20 text-slate-500 font-medium">Bạn cần đăng nhập để xem trang này</div>;
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;

  const data = profile || currentUser;
  const maxBarValue = Math.max(...(data.monthlyActivity || []).map((m: any) => m.questions + m.answers), 1);

  return (
    <>
      <Head><title>Thông tin cá nhân | Thăng Long Forum</title></Head>
      <div className="flex flex-col gap-6 pb-10 max-w-[1200px] mx-auto w-full">

        {/* Profile Banner */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible relative">
          <div className="bg-[#1e293b] rounded-t-2xl px-6 sm:px-10 py-6 sm:py-8 flex flex-col sm:flex-row justify-between items-start sm:items-center relative z-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            <div className="flex items-center gap-6 sm:gap-8 ml-[100px] sm:ml-[160px] relative z-10 w-full justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-[28px] font-bold text-white tracking-tight">{data.name}</h1>
                  <span className="px-2.5 py-1 rounded-full bg-slate-700/80 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-600">
                    <GraduationCap className="w-3.5 h-3.5" />
                    {data.role === 'teacher' ? 'Giảng viên' : data.role === 'admin' ? 'Quản trị viên' : 'Sinh viên'}
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-8 mt-2 text-slate-400 text-sm font-medium">
                  <span className="flex items-center gap-1.5">
                    {data.role === 'teacher' ? 'Mã Giảng Viên' : 'Mã Sinh Viên'}: <span className="text-slate-200">{data.userCode || 'Chưa cập nhật'}</span>
                  </span>
                  <span className="hidden sm:flex items-center gap-1.5">
                    Khoa: <span className="text-slate-200">{data.department || 'Chưa cập nhật'}</span>
                  </span>
                </div>
              </div>
              <div className="hidden lg:flex flex-col text-right">
                <p className="text-xs text-slate-400 font-medium">Member since:</p>
                <p className="text-base font-bold text-white mt-0.5">
                  {data.createdAt ? formatJoinDate(data.createdAt) : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Avatar */}
          <div className="absolute top-8 sm:top-12 left-6 sm:left-10 z-20">
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleAvatarChange} />
            <div className="w-[90px] h-[90px] sm:w-[130px] sm:h-[130px] rounded-full bg-slate-200 border-[6px] border-white flex items-center justify-center text-4xl font-bold text-slate-500 shadow-xl overflow-hidden cursor-pointer group relative bg-cover bg-center" onClick={() => fileInputRef.current?.click()}>
              {avatarUploading ? <Loader2 className="w-8 h-8 animate-spin" /> : profile?.avatarUrl ? <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : getInitials(data.name)}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center backdrop-blur-[2px]"><Camera className="w-8 h-8 text-white drop-shadow-md" /></div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="bg-white rounded-b-2xl px-6 sm:px-10 py-5 pl-[120px] sm:pl-[200px] border-t border-gray-100 flex flex-wrap gap-8 sm:gap-16">
            {[
              { icon: MessageSquare, color: 'blue', label: 'Số Câu Hỏi', value: profile?.questionCount ?? 0 },
              { icon: FileQuestion, color: 'emerald', label: 'Số Câu Trả Lời', value: profile?.answerCount ?? 0 },
              { icon: Star, color: 'orange', label: 'Số Lượt Vote', value: profile?.voteScore ?? 0 },
              { icon: ThumbsUp, color: 'teal', label: 'Câu Trả Lời Hữu Ích', value: profile?.acceptedCount ?? 0 }
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-500 shrink-0`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] text-slate-500 font-semibold mb-0.5">{stat.label}:</span>
                  <span className="text-xl font-bold text-slate-800 leading-none">{stat.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content 3 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4 items-start">
          
          {/* Left - Thông tin cá nhân */}
          <div className="col-span-1 lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-slate-100/60 px-5 py-4 border-b border-gray-100">
              <h3 className="text-[15px] font-bold text-slate-800">Thông tin cá nhân</h3>
            </div>
            <div className="p-5 flex flex-col gap-4">
              {error && <p className="text-red-500 text-[13px] font-medium">{error}</p>}
              {success && <p className="text-emerald-500 text-[13px] font-medium">{success}</p>}
              <div className="space-y-4">
                {/* Mã SV/GV */}
                <div className="flex items-start gap-3">
                  <Hash className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-slate-800">
                      {data.role === 'teacher' ? 'Mã giảng viên' : 'Mã sinh viên'}
                      {editing && <span className="text-[11px] font-normal text-slate-400 ml-2">(Không thể thay đổi)</span>}
                    </p>
                    {editing ? (
                      <input value={data.userCode || 'Chưa có'} disabled className="w-full mt-1 border border-gray-200 rounded px-2 py-1 text-sm bg-slate-100 text-slate-500 cursor-not-allowed" />
                    ) : (
                      <p className="text-[13px] text-slate-500 truncate">{data.userCode || 'Chưa có'}</p>
                    )}
                  </div>
                </div>

                {/* Khoa - dropdown */}
                <div className="flex items-start gap-3">
                  <Building className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-slate-800">Khoa</p>
                    {editing ? (
                      <select
                        value={selectedFacultyId}
                        onChange={(e) => {
                          const fId = e.target.value;
                          setSelectedFacultyId(fId);
                          const faculty = faculties.find((f) => f._id === fId);
                          setForm((p) => ({ ...p, department: faculty?.name || '', major: '' }));
                        }}
                        className="w-full mt-1 border border-gray-200 rounded px-2 py-1.5 text-sm bg-slate-50"
                      >
                        <option value="">-- Chọn khoa --</option>
                        {faculties.map((f) => (
                          <option key={f._id} value={f._id}>{f.name}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-[13px] text-slate-500 truncate">{data.department || 'Chưa có'}</p>
                    )}
                  </div>
                </div>

                {/* Ngành - dropdown */}
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-slate-800">Ngành</p>
                    {editing ? (
                      <select
                        value={form.major}
                        onChange={(e) => setForm((p) => ({ ...p, major: e.target.value }))}
                        className="w-full mt-1 border border-gray-200 rounded px-2 py-1.5 text-sm bg-slate-50"
                        disabled={!selectedFacultyId}
                      >
                        <option value="">{selectedFacultyId ? '-- Chọn ngành --' : '-- Chọn khoa trước --'}</option>
                        {majors.map((m) => (
                          <option key={m._id} value={m.name}>{m.name}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-[13px] text-slate-500 truncate">{data.major || 'Chưa có'}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-slate-800">
                      Email
                      {editing && <span className="text-[11px] font-normal text-slate-400 ml-2">(Không thể thay đổi)</span>}
                    </p>
                    {editing ? (
                      <input value={data.email || 'Chưa có'} disabled className="w-full mt-1 border border-gray-200 rounded px-2 py-1 text-sm bg-slate-100 text-slate-500 cursor-not-allowed" />
                    ) : (
                      <p className="text-[13px] text-slate-500 truncate">{data.email || 'Chưa có'}</p>
                    )}
                  </div>
                </div>

                {/* Số điện thoại */}
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-slate-800">Số điện thoại</p>
                    {editing ? (
                      <input value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} placeholder="0901234567" className="w-full mt-1 border border-gray-200 rounded px-2 py-1 text-sm bg-slate-50" />
                    ) : (
                      <p className="text-[13px] text-slate-500 truncate">{data.phone || 'Chưa có'}</p>
                    )}
                  </div>
                </div>
                {editing && (
                  <div className="flex items-start gap-3">
                    <UserCircle className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-slate-800">Họ tên</p>
                      <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className="w-full mt-1 border border-gray-200 rounded px-2 py-1 text-sm bg-slate-50" />
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-2 border-t border-gray-100 pt-5">
                {!editing ? (
                  <button onClick={() => { setEditing(true); setSuccess(''); setError(''); }} className="w-full py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-[13px] font-semibold transition shadow-sm">Chỉnh sửa hồ sơ</button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[13px] font-semibold transition">Hủy</button>
                    <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[13px] font-semibold transition shadow-sm flex items-center justify-center">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu lại'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Middle - Hoạt động */}
          <div className="col-span-1 lg:col-span-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">Hoạt động của tôi</h3>
              <div className="flex bg-slate-100/80 p-1 rounded-lg w-full sm:w-auto">
                <button onClick={() => setActiveTab('questions')} className={`flex-1 sm:w-32 py-1.5 rounded-md text-[13px] font-bold transition ${activeTab === 'questions' ? 'bg-slate-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Câu hỏi đã đăng</button>
                <button onClick={() => setActiveTab('answers')} className={`flex-1 sm:w-32 py-1.5 rounded-md text-[13px] font-bold transition ${activeTab === 'answers' ? 'bg-slate-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Câu trả lời</button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-5">
                {activeTab === 'questions' ? (
                  (profile?.recentQuestions || []).length === 0 ? (
                    <div className="text-center py-10">
                      <BarChart3 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                      <p className="text-sm font-medium text-slate-400">Chưa có câu hỏi nào</p>
                    </div>
                  ) : (
                    (profile?.recentQuestions || []).map((q: any) => (
                      <div key={q._id} className="group relative pl-4 border-l-2 border-slate-200 hover:border-blue-500 transition-colors">
                        <div className="absolute w-2 h-2 bg-slate-200 group-hover:bg-blue-500 rounded-full -left-[5px] top-1.5 transition-colors" />
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[12px] font-bold text-slate-400">{getTimeDiff(q.createdAt)}:</span>
                          <span className="text-[12px] font-semibold text-slate-500">Đã đăng câu hỏi</span>
                          <span className="text-[12px] font-bold text-emerald-500 ml-auto bg-emerald-50 px-2 py-0.5 rounded-full">(VOTE: {q.voteScore || 0})</span>
                        </div>
                        <Link href={`/questions/${q._id}`}>
                          <h4 className="text-[14px] font-bold text-slate-800 hover:text-blue-600 leading-snug">&quot;{q.title}&quot;</h4>
                        </Link>
                      </div>
                    ))
                  )
                ) : (
                  (profile?.recentAnswers || []).length === 0 ? (
                    <div className="text-center py-10">
                      <BarChart3 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                      <p className="text-sm font-medium text-slate-400">Chưa có câu trả lời nào</p>
                    </div>
                  ) : (
                    (profile?.recentAnswers || []).map((a: any) => (
                      <div key={a._id} className="group relative pl-4 border-l-2 border-slate-200 hover:border-emerald-500 transition-colors">
                        <div className="absolute w-2 h-2 bg-slate-200 group-hover:bg-emerald-500 rounded-full -left-[5px] top-1.5 transition-colors" />
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[12px] font-bold text-slate-400">{getTimeDiff(a.createdAt)}:</span>
                          <span className="text-[12px] font-semibold text-slate-500">Đã trả lời</span>
                          {a.isAccepted && <span className="text-[12px] font-bold text-emerald-500 ml-auto bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Được chấp nhận</span>}
                        </div>
                        <Link href={`/questions/${a.questionId?._id || a.questionId}`}>
                          <h4 className="text-[14px] font-bold text-slate-800 hover:text-emerald-600 leading-snug">&quot;{a.questionId?.title || 'Câu hỏi'}&quot;</h4>
                        </Link>
                      </div>
                    ))
                  )
                )}
              </div>

              {/* Biểu đồ hoạt động */}
              <div className="mt-10 border-t border-gray-100 pt-6">
                <h4 className="text-[15px] font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" /> Biểu đồ hoạt động (6 tháng)
                </h4>
                {(data.monthlyActivity || []).length > 0 ? (
                  <div className="flex items-end gap-3 h-40">
                    {(data.monthlyActivity || []).map((m: any, i: number) => {
                      const total = m.questions + m.answers;
                      const hPct = maxBarValue > 0 ? (total / maxBarValue) * 100 : 0;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[11px] font-bold text-slate-600">{total}</span>
                          <div className="w-full bg-slate-100 rounded-t-md relative" style={{ height: '120px' }}>
                            <div className="absolute bottom-0 w-full rounded-t-md overflow-hidden" style={{ height: `${Math.max(hPct, 4)}%` }}>
                              <div className="w-full bg-blue-400" style={{ height: `${total > 0 ? (m.questions / total) * 100 : 50}%` }} />
                              <div className="w-full bg-emerald-400" style={{ height: `${total > 0 ? (m.answers / total) * 100 : 50}%` }} />
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold text-slate-400">{m.month}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="w-full h-40 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 gap-2">
                    <BarChart3 className="w-6 h-6 opacity-50" />
                    <p className="text-xs font-semibold">Chưa có dữ liệu</p>
                  </div>
                )}
                <div className="flex items-center gap-4 mt-3 justify-center">
                  <span className="flex items-center gap-1.5 text-[11px] text-slate-500"><span className="w-3 h-3 rounded-sm bg-blue-400" /> Câu hỏi</span>
                  <span className="flex items-center gap-1.5 text-[11px] text-slate-500"><span className="w-3 h-3 rounded-sm bg-emerald-400" /> Câu trả lời</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Thành tích & Cài đặt */}
          <div className="col-span-1 lg:col-span-3 flex flex-col gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-amber-100/50 px-5 py-4 border-b border-amber-200/50">
                <h3 className="text-[15px] font-bold text-amber-900">Thành tích của bạn</h3>
              </div>
              <div className="p-5 flex flex-col gap-5">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[13px] font-semibold text-slate-500">Tổng điểm đóng góp:</span>
                    <span className="text-lg font-bold text-slate-800">{profile?.contributionScore ?? 0}</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min((profile?.contributionScore || 0) / 20, 100)}%` }} />
                  </div>
                  <div className="flex justify-center mt-3"><Trophy className="w-6 h-6 text-slate-400" /></div>
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-[12px] font-semibold text-slate-500 mb-1">Xếp hạng tuần</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold text-slate-800 tracking-tighter">
                        {profile?.weekRank ? `#${profile.weekRank}` : '—'}
                      </span>
                    </div>
                    <Trophy className="w-8 h-8 text-amber-400 fill-amber-100" />
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-slate-500">Câu trả lời hữu ích:</span>
                  <span className="text-base font-bold text-slate-800">{profile?.acceptedCount ?? 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-amber-100/50 px-5 py-4 border-b border-amber-200/50">
                <h3 className="text-[15px] font-bold text-amber-900">Cài đặt tài khoản</h3>
              </div>
              <div className="p-5 flex flex-col gap-3">
                <p className="text-[13px] font-semibold text-slate-500 mb-1">Cập nhật thông tin</p>
                <Link href="/user/change-password" className="flex items-center justify-center gap-2 w-full py-2.5 bg-white text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg text-[13px] font-bold border border-gray-200 hover:border-amber-200 transition shadow-sm">
                  🔑 Đổi mật khẩu
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
