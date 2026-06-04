import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import {
  Layers, Plus, Edit2, Trash2, Loader2, X, Check, Tag
} from 'lucide-react';
import { tagService } from '@services/tag.service';
import { toast } from '@lib/toast';

export default function AdminTopicsPage() {
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');

  const loadTags = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await tagService.search({ limit: 200 });
      if (res?.data?.data) setTags(res.data.data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadTags(); }, [loadTags]);

  const getSortedTags = () => {
    const query = searchQuery.trim().toLowerCase();
    let result = tags;
    if (query) {
      result = tags.filter((tag) => tag.name.toLowerCase().includes(query));
    }
    
    return [...result].sort((a, b) => {
      switch (sortOption) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'az':
          return a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' });
        case 'za':
          return b.name.localeCompare(a.name, 'vi', { sensitivity: 'base' });
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  };

  const handleCreate = async () => {
    if (!newTagName.trim()) return;
    try {
      await tagService.create({ name: newTagName.trim() });
      setNewTagName('');
      setShowAddModal(false);
      toast.success('Thêm chủ đề thành công');
      loadTags();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return;
    try {
      await tagService.update(id, { name: editingName.trim() });
      setEditingId(null);
      toast.success('Cập nhật chủ đề thành công');
      loadTags();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xác nhận xóa tag này?')) return;
    try {
      await tagService.delete(id);
      toast.success('Xóa chủ đề thành công');
      loadTags();
    } catch { /* silent */ }
  };

  return (
    <>
      <Head>
        <title>Quản lý chủ đề | Admin Thăng Long Forum</title>
      </Head>

      <div className="flex flex-col gap-6 p-6 pb-12">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5 tracking-tight">
            <Layers className="w-6 h-6 text-slate-500" strokeWidth={2.5} fill="#f1f5f9" />
            {' '}
            Quản lý chủ đề
            <span className="text-[14px] text-slate-400 font-medium">({tags.length} chủ đề)</span>
          </h1>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-bold rounded-full shadow-md transition-all shrink-0 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
            {' '}
            Thêm chủ đề
          </button>
        </div>

        {/* Search & Sort Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="relative w-full sm:w-[320px]">
            <input
              type="text"
              placeholder="Tìm kiếm chủ đề..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-4 pr-4 py-2.5 outline-none focus:border-blue-500 transition text-[14px] font-medium placeholder-slate-400"
            />
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <span className="text-[13px] font-bold text-slate-500 whitespace-nowrap">Sắp xếp:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="az">A-Z</option>
              <option value="za">Z-A</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] border border-gray-100 overflow-hidden mt-1">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-slate-50/30">
                    <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap w-[30%]">Chủ đề</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap text-center">Slug</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap text-center">Câu hỏi</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100/80">
                  {getSortedTags().map((tag) => (
                    <tr key={tag._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        {editingId === tag._id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="bg-slate-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 w-full max-w-[200px]"
                              onKeyDown={(e) => e.key === 'Enter' && handleUpdate(tag._id)}
                            />
                            <button onClick={() => handleUpdate(tag._id)} className="text-emerald-500 hover:text-emerald-600">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <Tag className="w-4 h-4 text-blue-500" />
                            <span className="text-[14px] font-bold text-slate-800">{tag.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-[13px] font-medium text-slate-400">{tag.slug}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-[14px] font-bold text-slate-700">{tag.questionCount || 0}</span>
                      </td>
                      <td className="px-6 py-5 text-right w-[180px]">
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => { setEditingId(tag._id); setEditingName(tag.name); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 transition shadow-sm"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-amber-500" strokeWidth={3} />
                            {' '}
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(tag._id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 transition shadow-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                            {' '}
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {getSortedTags().length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">Chưa có chủ đề nào</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[17px] font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-500" />
                  {' '}
                  Thêm chủ đề mới
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Tên chủ đề</label>
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    placeholder="Ví dụ: Lập trình"
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!newTagName.trim()}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    Tạo chủ đề
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
