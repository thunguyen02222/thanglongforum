import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Users, Search, Plus, GraduationCap, Medal, ShieldAlert,
  ChevronLeft, ChevronRight, X, Loader2, Pencil
} from 'lucide-react';
import { userService } from '@services/user.service';
import {
  facultyService, IFaculty, IMajor, IClass
} from '@services/faculty.service';
import { IUser, IUserCreatePayload, IUserUpdatePayload } from '@interfaces/user';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  student: 'Sinh viên',
  teacher: 'Giảng viên'
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Hoạt động',
  inactive: 'Bị khóa',
  deleted: 'Đã xóa'
};

function getRoleStyle(role: string) {
  switch (role) {
    case 'teacher':
      return { bg: 'bg-emerald-50 text-emerald-700', icon: <Medal className="w-3.5 h-3.5 text-amber-500" /> };
    case 'admin':
      return { bg: 'bg-red-50 text-red-700', icon: <ShieldAlert className="w-3.5 h-3.5 text-red-500" /> };
    default:
      return { bg: 'bg-blue-50 text-blue-700', icon: <GraduationCap className="w-3.5 h-3.5 fill-blue-600 text-blue-600" /> };
  }
}

function getAvatarInitials(name: string) {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  'bg-orange-500', 'bg-teal-500', 'bg-indigo-500', 'bg-pink-500',
  'bg-cyan-500', 'bg-violet-500', 'bg-amber-500', 'bg-emerald-500'
];

function getAvatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const router = useRouter();

  // Sync filter với query param từ sidebar
  useEffect(() => {
    if (router.query.role === 'student') setActiveFilter('student');
    else if (router.query.role === 'teacher') setActiveFilter('teacher');
  }, [router.query.role]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0, students: 0, teachers: 0, locked: 0
  });

  const limit = 12;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page, limit, sortBy: 'createdAt', sortOrder: 'desc'
      };
      if (searchQuery) params.q = searchQuery;
      if (activeFilter === 'student') params.role = 'student';
      if (activeFilter === 'teacher') params.role = 'teacher';
      if (activeFilter === 'active') params.status = 'active';
      if (activeFilter === 'locked') params.status = 'inactive';

      const result = await userService.search(params);
      setUsers(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, activeFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const [all, students, teachers, locked] = await Promise.all([
        userService.search({ limit: 1 }),
        userService.search({ limit: 1, role: 'student' }),
        userService.search({ limit: 1, role: 'teacher' }),
        userService.search({ limit: 1, status: 'inactive' })
      ]);
      setStats({
        total: all.total,
        students: students.total,
        teachers: teachers.total,
        locked: locked.total
      });
    } catch {}
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleToggleStatus = async (user: IUser) => {
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      await userService.update(user._id, { status: newStatus });
      fetchUsers();
      fetchStats();
    } catch (err) {
      console.error('Toggle status error:', err);
    }
  };

  const filters = [
    { key: 'all', label: 'Tất cả' },
    { key: 'student', label: 'Sinh viên' },
    { key: 'teacher', label: 'Giảng viên' },
    { key: 'active', label: 'Đang hoạt động' },
    { key: 'locked', label: 'Bị khóa' }
  ];

  return (
    <>
      <Head>
        <title>Quản lý người dùng | Admin Thăng Long Forum</title>
      </Head>

      <div className="flex flex-col gap-6 p-6 pb-12">

        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5 tracking-tight">
            <Users className="w-6 h-6 text-blue-600" strokeWidth={2.5} />
            {' '}
            Quản lý người dùng
          </h1>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <form onSubmit={handleSearch} className="relative w-full sm:w-[320px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm người dùng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-full pl-11 pr-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-[14px] font-medium placeholder-slate-400 shadow-sm"
              />
            </form>

            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-bold rounded-full shadow-md transition-all shrink-0 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" strokeWidth={3} />
              {' '}
              Thêm người dùng
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <Users className="w-6 h-6 text-blue-500 mb-2" strokeWidth={2.5} />
            <h2 className="text-3xl font-bold text-slate-800 mb-1">{stats.total.toLocaleString()}</h2>
            <p className="text-[13px] font-bold text-slate-400">Tổng người dùng</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <GraduationCap className="w-6 h-6 text-slate-800 mb-2" strokeWidth={2.5} />
            <h2 className="text-3xl font-bold text-slate-800 mb-1">{stats.students.toLocaleString()}</h2>
            <p className="text-[13px] font-bold text-slate-400">Sinh viên</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <Medal className="w-6 h-6 text-amber-500 mb-2" strokeWidth={2.5} />
            <h2 className="text-3xl font-bold text-slate-800 mb-1">{stats.teachers.toLocaleString()}</h2>
            <p className="text-[13px] font-bold text-slate-400">Giảng viên</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="w-4 h-4 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)] mb-2" />
            <h2 className="text-3xl font-bold text-slate-800 mb-1">{stats.locked.toLocaleString()}</h2>
            <p className="text-[13px] font-bold text-slate-400">Bị khóa</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 mt-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => { setActiveFilter(f.key); setPage(1); }}
              className={`px-5 py-2.5 rounded-full text-[13px] font-bold transition-all border ${
                activeFilter === f.key
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-600 border-gray-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Người dùng</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">MSV/MGV</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Vai trò</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Trạng thái</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/80">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
                      <span className="text-sm text-slate-400">Đang tải...</span>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-sm text-slate-400">
                      Không tìm thấy người dùng nào
                    </td>
                  </tr>
                ) : users.map((user) => {
                  const roleStyle = getRoleStyle(user.role);
                  return (
                    <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0 ${getAvatarColor(user._id)}`}>
                              {getAvatarInitials(user.name)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-[14px] font-bold text-slate-800 truncate">{user.name}</p>
                            <p className="text-[12px] font-medium text-slate-400 truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[14px] font-semibold text-slate-600">
                        {user.userCode || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-bold ${roleStyle.bg}`}>
                          {roleStyle.icon}
                          {' '}
                          {ROLE_LABELS[user.role] || user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[13px] font-bold">
                        {user.status === 'active' ? (
                          <span className="flex items-center gap-1.5 text-emerald-600">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            {' '}
                            Hoạt động
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-red-600">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            {' '}
                            {STATUS_LABELS[user.status] || user.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditingUser(user); setShowEditModal(true); }}
                            className="px-3 py-1.5 rounded-full text-[12px] font-bold bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100 transition shadow-sm flex items-center gap-1"
                          >
                            <Pencil className="w-3 h-3" />
                            {' '}
                            Sửa
                          </button>
                          {user.status === 'active' ? (
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className="px-4 py-1.5 rounded-full text-[12px] font-bold bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 transition shadow-sm"
                            >
                              Khóa
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className="px-4 py-1.5 rounded-full text-[12px] font-bold bg-emerald-50 border border-emerald-100 text-emerald-600 hover:bg-emerald-100 transition shadow-sm"
                            >
                              Mở khóa
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="border-t border-gray-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-[13px] font-medium text-slate-400">
              Hiển thị
              {' '}
              {(page - 1) * limit + 1}
              -
              {Math.min(page * limit, total)}
              {' '}
              trong
              {' '}
              {total.toLocaleString()}
              {' '}
              người dùng
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-slate-600 text-[13px] font-bold hover:bg-slate-50 transition disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                {' '}
                Trước
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-[13px] font-bold transition ${
                      page === pageNum
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'border border-gray-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-slate-600 text-[13px] font-bold hover:bg-slate-50 transition disabled:opacity-40"
              >
                Tiếp
                {' '}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); fetchUsers(); fetchStats(); }}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => { setShowEditModal(false); setEditingUser(null); }}
          onUpdated={() => { setShowEditModal(false); setEditingUser(null); fetchUsers(); fetchStats(); }}
        />
      )}
    </>
  );
}

// ─── Create User Modal ───
function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [faculties, setFaculties] = useState<IFaculty[]>([]);
  const [majors, setMajors] = useState<IMajor[]>([]);
  const [classes, setClasses] = useState<IClass[]>([]);

  const [form, setForm] = useState<IUserCreatePayload & { facultyId?: string; majorId?: string }>({
    firstName: '',
    lastName: '',
    name: '',
    email: '',
    password: '',
    userCode: '',
    role: 'student',
    classId: '',
    facultyId: '',
    majorId: ''
  });

  useEffect(() => {
    facultyService.getAllFaculties().then(setFaculties).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.facultyId) {
      facultyService.getMajorsByFaculty(form.facultyId).then(setMajors).catch(() => setMajors([]));
      setForm((prev) => ({ ...prev, majorId: '', classId: '' }));
      setClasses([]);
    } else {
      setMajors([]);
      setClasses([]);
    }
  }, [form.facultyId]);

  useEffect(() => {
    if (form.majorId) {
      facultyService.getClassesByMajor(form.majorId).then(setClasses).catch(() => setClasses([]));
      setForm((prev) => ({ ...prev, classId: '' }));
    } else {
      setClasses([]);
    }
  }, [form.majorId]);

  // Auto-build name from firstName + lastName
  useEffect(() => {
    const name = [form.lastName, form.firstName].filter(Boolean).join(' ').trim();
    if (name) setForm((prev) => ({ ...prev, name }));
  }, [form.firstName, form.lastName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.role === 'student') {
      const codeRegex = /^[a-zA-Z0-9]+$/;
      if (form.userCode && !codeRegex.test(form.userCode)) {
        setError('MSV không được chứa ký tự đặc biệt');
        return;
      }
    }

    setLoading(true);
    try {
      const selectedFaculty = faculties.find((f) => f._id === form.facultyId);
      const selectedMajor = majors.find((m) => m._id === form.majorId);
      const payload: IUserCreatePayload = {
        firstName: form.firstName,
        lastName: form.lastName,
        name: form.name,
        email: form.email,
        role: form.role,
        userCode: form.userCode || undefined,
        classId: form.classId || undefined,
        password: form.password || undefined,
        department: selectedFaculty?.name || undefined,
        major: selectedMajor?.name || undefined
      };
      await userService.create(payload);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-slate-900">Thêm người dùng mới</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Role */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Vai trò
              <span className="text-red-500">*</span>
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-sm font-medium"
            >
              <option value="student">Sinh viên</option>
              <option value="teacher">Giảng viên</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Họ</label>
              <input
                type="text"
                placeholder="Nguyễn Văn"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Tên
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="An"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-sm"
                required
              />
            </div>
          </div>

          {/* MSSV + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Email
                <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="annh@thanglong.edu.vn"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                {form.role === 'teacher' ? 'MGV' : form.role === 'admin' ? 'Username' : 'MSV'}
                {' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="2024001234"
                value={form.userCode}
                onChange={(e) => setForm({ ...form, userCode: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-sm"
                required
              />
            </div>
          </div>

          {/* Password (optional) */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Mật khẩu
              <span className="text-gray-400 text-xs font-normal">(để trống nếu SV tự lấy qua MSSV)</span>
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-sm"
            />
          </div>

          {/* Faculty → Major → Class cascade */}
          {(form.role === 'student') && (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Khoa</label>
                <select
                  value={form.facultyId || ''}
                  onChange={(e) => setForm({ ...form, facultyId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-sm font-medium"
                >
                  <option value="">-- Chọn khoa --</option>
                  {faculties.map((f) => (
                    <option key={f._id} value={f._id}>{f.name}</option>
                  ))}
                </select>
              </div>

              {majors.length > 0 && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Ngành</label>
                  <select
                    value={form.majorId || ''}
                    onChange={(e) => setForm({ ...form, majorId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-sm font-medium"
                  >
                    <option value="">-- Chọn ngành --</option>
                    {majors.map((m) => (
                      <option key={m._id} value={m._id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {classes.length > 0 && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Lớp</label>
                  <select
                    value={form.classId || ''}
                    onChange={(e) => setForm({ ...form, classId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-sm font-medium"
                  >
                    <option value="">-- Chọn lớp --</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Đang tạo...' : 'Tạo người dùng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit User Modal ───
function EditUserModal({ user, onClose, onUpdated }: { user: IUser; onClose: () => void; onUpdated: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [faculties, setFaculties] = useState<IFaculty[]>([]);
  const [majors, setMajors] = useState<IMajor[]>([]);
  const [classes, setClasses] = useState<IClass[]>([]);

  const [form, setForm] = useState<IUserUpdatePayload & { facultyId?: string; majorId?: string }>({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    name: user.name || '',
    email: user.email || '',
    userCode: user.userCode || '',
    role: user.role || 'student',
    classId: typeof user.classId === 'object' ? (user.classId as any)?._id || '' : user.classId || '',
    facultyId: '',
    majorId: ''
  });

  useEffect(() => {
    const initData = async () => {
      try {
        const allFaculties = await facultyService.getAllFaculties();
        setFaculties(allFaculties);

        const userDept = user.department;
        const userMaj = user.major;

        if (userDept) {
          const foundFaculty = allFaculties.find((f) => f.name === userDept);
          if (foundFaculty) {
            setForm((prev) => ({ ...prev, facultyId: foundFaculty._id }));
            
            const allMajors = await facultyService.getMajorsByFaculty(foundFaculty._id);
            setMajors(allMajors);

            if (userMaj) {
              const foundMajor = allMajors.find((m) => m.name === userMaj);
              if (foundMajor) {
                setForm((prev) => ({ 
                  ...prev, 
                  facultyId: foundFaculty._id,
                  majorId: foundMajor._id,
                  classId: typeof user.classId === 'object' ? (user.classId as any)?._id || '' : user.classId || ''
                }));

                const allClasses = await facultyService.getClassesByMajor(foundMajor._id);
                setClasses(allClasses);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to initialize EditUserModal data:', err);
      }
    };
    initData();
  }, [user]);

  const handleFacultyChange = async (facultyId: string) => {
    setForm((prev) => ({ ...prev, facultyId, majorId: '', classId: '' }));
    setMajors([]);
    setClasses([]);
    if (facultyId) {
      try {
        const list = await facultyService.getMajorsByFaculty(facultyId);
        setMajors(list);
      } catch {
        setMajors([]);
      }
    }
  };

  const handleMajorChange = async (majorId: string) => {
    setForm((prev) => ({ ...prev, majorId, classId: '' }));
    setClasses([]);
    if (majorId) {
      try {
        const list = await facultyService.getClassesByMajor(majorId);
        setClasses(list);
      } catch {
        setClasses([]);
      }
    }
  };

  // Auto-build name from firstName + lastName
  useEffect(() => {
    const name = [form.lastName, form.firstName].filter(Boolean).join(' ').trim();
    if (name) setForm((prev) => ({ ...prev, name }));
  }, [form.firstName, form.lastName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.role === 'student') {
      const codeRegex = /^[a-zA-Z0-9]+$/;
      if (form.userCode && !codeRegex.test(form.userCode)) {
        setError('MSV không được chứa ký tự đặc biệt');
        return;
      }
    }

    setLoading(true);
    try {
      const selectedFaculty = faculties.find((f) => f._id === form.facultyId);
      const selectedMajor = majors.find((m) => m._id === form.majorId);
      const payload: IUserUpdatePayload = {
        firstName: form.firstName,
        lastName: form.lastName,
        name: form.name,
        email: form.email,
        role: form.role,
        userCode: form.userCode || undefined,
        classId: form.classId || undefined,
        department: selectedFaculty?.name || undefined,
        major: selectedMajor?.name || undefined
      };
      await userService.update(user._id, payload);
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-slate-900">Chỉnh sửa người dùng</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Role */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Vai trò
              <span className="text-red-500">*</span>
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-sm font-medium"
            >
              <option value="student">Sinh viên</option>
              <option value="teacher">Giảng viên</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Họ</label>
              <input
                type="text"
                placeholder="Nguyễn Văn"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Tên
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="An"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-sm"
                required
              />
            </div>
          </div>

          {/* Email + MSSV/MNV */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Email
                <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="annh@thanglong.edu.vn"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                {form.role === 'teacher' ? 'MGV' : form.role === 'admin' ? 'Username' : 'MSV'}
                {' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="2024001234"
                value={form.userCode}
                onChange={(e) => setForm({ ...form, userCode: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-sm"
                required
              />
            </div>
          </div>

          {/* Faculty → Major → Class cascade */}
          {(form.role === 'student') && (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Khoa</label>
                <select
                  value={form.facultyId || ''}
                  onChange={(e) => handleFacultyChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-sm font-medium"
                >
                  <option value="">-- Chọn khoa --</option>
                  {faculties.map((f) => (
                    <option key={f._id} value={f._id}>{f.name}</option>
                  ))}
                </select>
              </div>

              {majors.length > 0 && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Ngành</label>
                  <select
                    value={form.majorId || ''}
                    onChange={(e) => handleMajorChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-sm font-medium"
                  >
                    <option value="">-- Chọn ngành --</option>
                    {majors.map((m) => (
                      <option key={m._id} value={m._id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {classes.length > 0 && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Lớp</label>
                  <select
                    value={form.classId || ''}
                    onChange={(e) => setForm({ ...form, classId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-sm font-medium"
                  >
                    <option value="">-- Chọn lớp --</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
