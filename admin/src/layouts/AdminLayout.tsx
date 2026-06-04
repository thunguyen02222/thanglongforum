import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { authService } from '@services/auth.service';
import { reportService } from '@services/report.service';
import { useCurrentUserStore, useReportStore } from 'src/stores';

import { LazyHydrate } from '@components/common';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem
} from '@components/ui';
import {
  Users,
  Tag,
  ShieldAlert,
  BarChart3,
  Bell,
  LogOut,
  Menu,
  Settings,
  User as UserIcon,
  Building2,
  GraduationCap,
  BookUser,
  FileText,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  LayoutDashboard
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface MenuGroup {
  label: string;
  icon: React.ReactNode;
  children?: { path: string; label: string; badge?: number }[];
  path?: string;
  badge?: number;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { currentUser, clearCurrentUser } = useCurrentUserStore();
  const { pendingCount, setPendingCount } = useReportStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['users', 'content']);

  const getAvatarInitials = (n: string) => {
    const parts = n.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return n.slice(0, 2).toUpperCase();
  };

  useEffect(() => {
    const fetchPending = () => {
      reportService.countPending().then((res: any) => {
        setPendingCount(res?.data?.count || 0);
      }).catch(() => {});
    };
    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, []);

  const menuGroups: MenuGroup[] = [
    {
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      path: '/dashboard'
    },
    {
      label: 'Quản lý khoa',
      icon: <Building2 className="w-5 h-5" />,
      path: '/faculties'
    },
    {
      label: 'Quản lý người dùng',
      icon: <Users className="w-5 h-5" />,
      children: [
        { path: '/users?role=student', label: 'Sinh viên' },
        { path: '/users?role=teacher', label: 'Giảng viên' }
      ]
    },
    {
      label: 'Quản lý nội dung',
      icon: <FolderOpen className="w-5 h-5" />,
      children: [
        { path: '/topics', label: 'Chủ đề' },
        { path: '/posts', label: 'Bài đăng' },
        { path: '/moderate', label: 'Kiểm duyệt', badge: pendingCount }
      ]
    },
    {
      label: 'Thông báo',
      icon: <Bell className="w-5 h-5" />,
      path: '/notifications'
    }
  ];

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => (prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]));
  };

  const isPathActive = (path: string) => {
    // Handle query params: /users?role=student
    const [pathname] = path.split('?');
    if (!router.pathname.startsWith(pathname)) return false;
    if (path.includes('?')) {
      const params = new URLSearchParams(path.split('?')[1]);
      for (const [key, value] of params.entries()) {
        if (router.query[key] !== value) return false;
      }
    }
    return true;
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      clearCurrentUser();
      router.push('/auth/login');
    }
  };

  function NavLink({ path, label, badge }: { path: string; label: string; badge?: number }) {
    const active = isPathActive(path);
    return (
      <Link
        href={path}
        className={`flex items-center justify-between pl-11 pr-4 py-2.5 rounded-lg transition-colors text-[13px] font-medium ${
          active
            ? 'bg-blue-600/20 text-blue-400'
            : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
        }`}
      >
        <span>{label}</span>
        {!!badge && (
          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
            {badge}
          </span>
        )}
      </Link>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden font-sans">

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[260px] bg-[#1a1d2d] text-white flex flex-col transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 h-20 shrink-0 border-b border-slate-800/50 overflow-hidden">
          <Link href="/dashboard" className="flex items-center gap-3 w-full">
            <img src="/image/logo.png" alt="Logo" className="h-10 w-10 object-cover rounded-full shadow-lg shrink-0" />
            <span className="text-white font-bold text-lg tracking-tight whitespace-nowrap">
              Thăng Long Forum
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
          <h4 className="px-4 text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Danh mục quản trị</h4>
          <div className="space-y-1">
            {menuGroups.map((group) => {
              // Simple link (no children)
              if (group.path && !group.children) {
                const active = isPathActive(group.path);
                return (
                  <Link
                    key={group.label}
                    href={group.path}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                      active
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={active ? 'text-white' : 'text-slate-400'}>{group.icon}</div>
                      <span className="text-[14px] font-medium">{group.label}</span>
                    </div>
                    {!!group.badge && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                        {group.badge}
                      </span>
                    )}
                  </Link>
                );
              }

              // Expandable group
              const isExpanded = expandedGroups.includes(group.label);
              const hasActiveSub = group.children?.some((c) => isPathActive(c.path));
              const totalBadge = group.children?.reduce((acc, c) => acc + (c.badge || 0), 0) || 0;

              return (
                <div key={group.label}>
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                      hasActiveSub
                        ? 'bg-slate-800/60 text-white'
                        : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={hasActiveSub ? 'text-blue-400' : 'text-slate-400'}>{group.icon}</div>
                      <span className="text-[14px] font-medium">{group.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isExpanded && totalBadge > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                          {totalBadge}
                        </span>
                      )}
                      {isExpanded
                        ? <ChevronDown className="w-4 h-4 text-slate-400" />
                        : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    </div>
                  </button>

                  {isExpanded && group.children && (
                    <div className="mt-1 space-y-0.5">
                      {group.children.map((child) => (
                        <NavLink key={child.path} {...child} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-4 shrink-0 relative">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-white/5 transition-colors focus:outline-none">
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser?.name || 'Admin'}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-sm font-bold text-white shadow-inner overflow-hidden shrink-0">
                    {getAvatarInitials(currentUser?.name || 'Admin')}
                  </div>
                )}
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <span className="text-sm font-semibold text-white truncate w-full text-left">
                    {currentUser?.name || 'Admin'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium truncate w-full text-left">
                    {currentUser?.role === 'admin' ? 'Quản trị viên'
                      : currentUser?.role === 'teacher' ? 'Giảng viên'
                      : currentUser?.role === 'student' ? 'Sinh viên'
                      : 'Quản trị viên'}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              side="top"
              align="center"
              sideOffset={10}
              className="w-56 bg-[#25283d] rounded-xl shadow-xl shadow-black/20 p-2 border border-white/5"
            >
              <DropdownMenuItem className="flex items-center gap-2 px-2 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer outline-none transition-colors">
                <UserIcon className="w-4 h-4" />
                {' '}
                Xem hồ sơ
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 px-2 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer outline-none transition-colors">
                <Settings className="w-4 h-4" />
                {' '}
                Cài đặt hệ thống
              </DropdownMenuItem>
              <div className="my-1 border-t border-white/5" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center gap-2 px-2 py-2 text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg cursor-pointer outline-none transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {' '}
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <main className="flex-1 flex flex-col h-full relative min-w-0">

        {/* Top Mobile-Only Toggle */}
        <div className="lg:hidden sticky top-0 z-30 bg-[#F8F9FA] border-b border-gray-200 px-4 py-3 flex items-center">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-200"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto w-full">
          <div className="w-full max-w-[1400px] mx-auto min-h-full">
            <LazyHydrate whenIdle>
              {children}
            </LazyHydrate>
          </div>
        </div>
      </main>
    </div>
  );
}
