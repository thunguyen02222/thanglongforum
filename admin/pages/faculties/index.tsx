import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import {
  Building2, Plus, Pencil, Trash2, Loader2, X, BookOpen, ChevronDown, ChevronRight
} from 'lucide-react';
import { facultyService, IFaculty, IMajor } from '@services/faculty.service';
import { toast } from '@lib/toast';

export default function FacultiesPage() {
  const [faculties, setFaculties] = useState<IFaculty[]>([]);
  const [majorsMap, setMajorsMap] = useState<Record<string, IMajor[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedFaculty, setExpandedFaculty] = useState<string | null>(null);
  const [loadingMajors, setLoadingMajors] = useState<string | null>(null);

  // Modal states
  const [modal, setModal] = useState<{
    type: 'create-faculty' | 'edit-faculty' | 'create-major' | 'edit-major';
    data?: any;
    facultyId?: string;
  } | null>(null);
  const [formName, setFormName] = useState('');
  const [formShortName, setFormShortName] = useState('');
  const [saving, setSaving] = useState(false);

  const loadFaculties = useCallback(async () => {
    setLoading(true);
    try {
      const res = await facultyService.searchFaculties({ limit: 100 });
      setFaculties(res.data || []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadFaculties(); }, [loadFaculties]);

  const loadMajors = async (facultyId: string) => {
    if (expandedFaculty === facultyId) {
      setExpandedFaculty(null);
      return;
    }
    setExpandedFaculty(facultyId);
    if (majorsMap[facultyId]) return;
    setLoadingMajors(facultyId);
    try {
      const majors = await facultyService.getMajorsByFaculty(facultyId);
      setMajorsMap((prev) => ({ ...prev, [facultyId]: majors }));
    } catch { /* silent */ } finally { setLoadingMajors(null); }
  };

  const openModal = (type: any, data?: any, facultyId?: string) => {
    setModal({ type, data, facultyId });
    setFormName(data?.name || '');
    setFormShortName(data?.shortName || '');
  };

  const handleSave = async () => {
    if (!formName.trim()) return;

    if (modal?.type.includes('faculty')) {
      const nameRegex = /^[a-zA-Z0-9\sÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠ-ỹ&.\-\/,()]+$/;
      if (!nameRegex.test(formName.trim())) {
        toast.error('Tên khoa không được chứa ký tự đặc biệt.');
        return;
      }
    }

    if (modal?.type.includes('major')) {
      const shortNameCheck = formShortName.trim();
      if (shortNameCheck && !/^[A-Za-z0-9]+$/.test(shortNameCheck)) {
        toast.error('Mã ngành không được chứa dấu cách hoặc ký tự đặc biệt!');
        return;
      }
    }

    setSaving(true);
    try {
      if (modal?.type === 'create-faculty') {
        await facultyService.createFaculty({ name: formName.trim() });
        loadFaculties();
        toast.success('Thêm khoa thành công');
      } else if (modal?.type === 'edit-faculty' && modal.data?._id) {
        await facultyService.updateFaculty(modal.data._id, { name: formName.trim() });
        loadFaculties();
      } else if (modal?.type === 'create-major' && modal.facultyId) {
        const created = await facultyService.createMajor({ name: formName.trim(), shortName: formShortName.trim() || undefined, facultyId: modal.facultyId });
        setMajorsMap((prev) => ({
          ...prev,
          [modal.facultyId!]: [...(prev[modal.facultyId!] || []), created]
        }));
        toast.success('Thêm ngành thành công');
      } else if (modal?.type === 'edit-major' && modal.data?._id) {
        const updated = await facultyService.updateMajor(modal.data._id, { name: formName.trim(), shortName: formShortName.trim() || undefined });
        const fId = modal.data.facultyId;
        setMajorsMap((prev) => ({
          ...prev,
          [fId]: (prev[fId] || []).map((m) => (m._id === updated._id ? updated : m))
        }));
      }
      setModal(null);
    } catch (e: any) {
      toast.error(e.message);
    } finally { setSaving(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!saving && formName.trim()) {
        handleSave();
      }
    }
  };

  const handleDeleteFaculty = async (id: string) => {
    if (!confirm('Xóa khoa này? Tất cả ngành thuộc khoa cũng sẽ bị xóa.')) return;
    try {
      await facultyService.deleteFaculty(id);
      setFaculties((prev) => prev.filter((f) => f._id !== id));
    } catch { /* silent */ }
  };

  const handleDeleteMajor = async (majorId: string, facultyId: string) => {
    if (!confirm('Xóa ngành này?')) return;
    try {
      await facultyService.deleteMajor(majorId);
      setMajorsMap((prev) => ({
        ...prev,
        [facultyId]: (prev[facultyId] || []).filter((m) => m._id !== majorId)
      }));
    } catch { /* silent */ }
  };

  const modalTitle = modal?.type === 'create-faculty' ? 'Thêm khoa mới'
    : modal?.type === 'edit-faculty' ? 'Sửa khoa'
      : modal?.type === 'create-major' ? 'Thêm ngành mới'
        : 'Sửa ngành';

  return (
    <>
      <Head>
        <title>Quản lý Khoa & Ngành | Admin Thăng Long Forum</title>
      </Head>

      <div className="flex flex-col gap-6 p-6 pb-12 w-full max-w-[1400px]">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5 tracking-tight">
            <Building2 className="w-7 h-7 text-indigo-500" strokeWidth={2} />
            {' '}
            Quản lý Khoa & Ngành
          </h1>
          <button
            onClick={() => openModal('create-faculty')}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[13px] font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {' '}
            Thêm khoa
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : faculties.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center text-slate-400 font-medium">
            Chưa có khoa nào
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {faculties.map((faculty) => (
              <div key={faculty._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Faculty Row */}
                <div className="flex items-center justify-between px-6 py-4">
                  <button
                    onClick={() => loadMajors(faculty._id)}
                    className="flex items-center gap-3 text-left flex-1 min-w-0"
                  >
                    {expandedFaculty === faculty._id
                      ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
                    <Building2 className="w-5 h-5 text-indigo-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-slate-800 truncate">{faculty.name}</p>
                      {faculty.shortName && (
                        <p className="text-[12px] font-medium text-slate-400">{faculty.shortName}</p>
                      )}
                    </div>
                  </button>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => openModal('edit-faculty', faculty)}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteFaculty(faculty._id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Majors List */}
                {expandedFaculty === faculty._id && (
                  <div className="border-t border-gray-100 bg-slate-50/50">
                    {loadingMajors === faculty._id ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      </div>
                    ) : (
                      <>
                        {(majorsMap[faculty._id] || []).map((major) => (
                          <div key={major._id} className="flex items-center justify-between px-6 pl-14 py-3 border-b border-gray-100/80 last:border-b-0">
                            <div className="flex items-center gap-2.5">
                              <BookOpen className="w-4 h-4 text-emerald-500" />
                              <span className="text-[13px] font-semibold text-slate-700">{major.name}</span>
                              {major.shortName && (
                                <span className="text-[11px] font-medium text-slate-400">
                                  (
                                  {major.shortName}
                                  )
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => openModal('edit-major', major)}
                                className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-blue-600 transition"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteMajor(major._id, faculty._id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                        <div className="px-6 pl-14 py-3">
                          <button
                            onClick={() => openModal('create-major', undefined, faculty._id)}
                            className="flex items-center gap-1.5 text-[12px] font-bold text-blue-600 hover:text-blue-700 transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            {' '}
                            Thêm ngành
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !saving && setModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-bold text-slate-900">{modalTitle}</h3>
              <button onClick={() => !saving && setModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[13px] font-bold text-slate-700 mb-1.5 block">Tên *</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={modal.type.includes('faculty') ? 'Nhập tên khoa...' : 'Nhập tên ngành...'}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] font-medium text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              {modal.type.includes('major') && (
                <div>
                  <label className="text-[13px] font-bold text-slate-700 mb-1.5 block">Mã ngành</label>
                  <input
                    value={formShortName}
                    onChange={(e) => setFormShortName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="VD: TE"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] font-medium text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => !saving && setModal(null)}
                disabled={saving}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formName.trim()}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {' '}
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
