import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { authService } from '@services/auth.service';
import { tagService } from '@services/tag.service';
import { notificationService } from '@services/notification.service';
import { useCurrentUserStore, useNotificationStore } from 'src/stores';
import { LazyHydrate } from '@components/common';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@components/ui';
import { ITag } from '@interfaces/question';
import useSocket from 'src/socket/useSocket';
import {
  Menu, Home, LogOut, ChevronDown, ChevronLeft, ChevronRight, Flame, Sparkles, HelpCircle,
  FileText, Eye, Bell, Hash, Search, Edit3, User, Settings
} from 'lucide-react';
import ChatbotWidget from '@components/chatbot/ChatbotWidget';

interface DefaultLayoutProps {
  children: React.ReactNode;
}

export default function DefaultLayout({ children }: DefaultLayoutProps) {
  const router = useRouter();
  const { currentUser, setCurrentUser, clearCurrentUser } = useCurrentUserStore();
  const { unreadCount, setUnreadCount, increaseUnread } = useNotificationStore();
  const { on } = useSocket();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [tags, setTags] = useState<ITag[]>([]);

  // Rehydrate avatarUrl từ API khi app load
  useEffect(() => {
    if (!currentUser) return;
    authService.me().then((res: any) => {
      const fresh = res?.data;
      if (fresh && fresh.avatarUrl !== currentUser.avatarUrl) {
        setCurrentUser({ ...currentUser, ...fresh });
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    tagService.getPopular().then((res: any) => {
      setTags(res?.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const fetchUnread = () => {
      notificationService.getUnreadCount().then((res: any) => {
        setUnreadCount(res?.data?.count || 0);
      }).catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);

    const offNotification = on('notification:new', () => {
      increaseUnread();
      // Optionally fire a toast here
    });

    return () => {
      clearInterval(interval);
      offNotification();
    };
  }, [currentUser, on, increaseUnread]);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      clearCurrentUser();
      router.push('/auth/login');
    }
  };

  useEffect(() => {
    setMenuOpen(false);
  }, [router.asPath]);

  const NavItem = ({ href, icon: Icon, label, isActive, badge }: any) => (
    <Link
      href={href}
      onClick={() => setMenuOpen(false)}
      title={isCollapsed ? label : undefined}
      className={`relative flex items-center transition-colors rounded-xl ${
        isCollapsed ? 'md:justify-center md:px-0 px-4' : 'justify-between px-4'
      } py-2.5 ${
        isActive
          ? 'bg-blue-600 text-white'
          : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
      }`}
    >
      <div className="flex items-center">
        <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
        <span className={`text-sm font-medium ml-3 ${isCollapsed ? 'md:hidden block' : 'block'}`}>{label}</span>
      </div>
      {!isCollapsed && badge && (
        <span className="bg-red-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full md:block">
          {badge}
        </span>
      )}
      {isCollapsed && badge && (
        <>
          <span className="md:hidden block bg-red-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">{badge}</span>
          <span className="hidden md:block absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-[#1a1d2d] rounded-full"></span>
        </>
      )}
    </Link>
  );

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed md:relative flex-shrink-0 inset-y-0 left-0 z-50 bg-[#1a1d2d] flex flex-col transform transition-[width,transform] duration-300 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-[80px] w-[260px]' : 'w-[260px]'}`}
      >
        {/* Logo Component */}
        <div className={`h-[72px] flex items-center ${isCollapsed ? 'md:justify-center justify-between' : 'justify-between'} px-6 border-b border-slate-800/50 overflow-hidden`}>
          <Link href="/home" className={`flex items-center gap-3 ${isCollapsed ? 'md:hidden flex' : 'flex'}`} onClick={() => setMenuOpen(false)}>
            <img src="/image/logo.png" alt="Logo" className="h-10 w-10 object-cover rounded-full shadow-lg shrink-0" />
            <span className={`text-white font-bold text-lg tracking-tight whitespace-nowrap ${isCollapsed ? 'md:hidden block' : 'block'}`}>
              Thăng Long Forum
            </span>
          </Link>
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition shrink-0 ml-2">
            {isCollapsed ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
          </button>
        </div>

        {/* Scrollable Nav List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          
          {/* Section: CHÍNH */}
          <div>
            <h4 className={`text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider ${isCollapsed ? 'md:opacity-0 md:h-0 overflow-hidden px-4' : 'px-4'}`}>Chính</h4>
            <div className="space-y-1">
              <NavItem href="/home" icon={Home} label="Trang chủ" isActive={router.pathname.startsWith('/home')} />
              <NavItem href="/questions/ask" icon={Edit3} label="Đặt câu hỏi" isActive={router.pathname === '/questions/ask'} />
              <NavItem href="/search" icon={Search} label="Tìm kiếm" isActive={router.pathname.startsWith('/search')} />
            </div>
          </div>

          {/* Section: CÁ NHÂN */}
          <div className="pt-2">
            <h4 className={`text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider ${isCollapsed ? 'md:opacity-0 md:h-0 overflow-hidden px-4' : 'px-4'}`}>Cá nhân</h4>
            <div className="space-y-1">
              <NavItem href="/my-questions" icon={FileText} label="Câu hỏi của tôi" isActive={router.pathname.startsWith('/my-questions')} />
              <NavItem href="/bookmarks" icon={Eye} label="Đang theo dõi" isActive={router.pathname.startsWith('/bookmarks')} />
              <NavItem
                href="/notifications"
                icon={Bell}
                label="Thông báo"
                badge={unreadCount > 0 ? (unreadCount > 99 ? '99+' : String(unreadCount)) : undefined}
                isActive={router.pathname.startsWith('/notifications')}
              />
            </div>
          </div>

          {/* Section: CHỦ ĐỀ */}
          {tags.length > 0 && (
            <div className="pt-2">
              <h4 className={`text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider ${isCollapsed ? 'md:opacity-0 md:h-0 overflow-hidden px-4' : 'px-4'}`}>Chủ đề</h4>
              <div className="space-y-1">
                {tags.slice(0, 8).map((tag) => (
                  <NavItem
                    key={tag._id}
                    href={`/search?tag=${tag.slug}`}
                    icon={Hash}
                    label={tag.name}
                    isActive={router.query.tag === tag.slug}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Bottom Bar */}
        <div className={`p-4 border-t border-slate-700/50 ${isCollapsed ? 'md:flex md:justify-center md:px-2' : ''}`}>
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`flex items-center w-full rounded-xl hover:bg-slate-800/50 transition text-left group ${isCollapsed ? 'md:justify-center p-0 md:p-2' : 'gap-3 p-2'}`}>
                  <div className="w-10 h-10 rounded-full shrink-0 bg-slate-700 flex items-center justify-center text-slate-300 font-semibold overflow-hidden">
                    {currentUser.avatarUrl ? (
                       <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                       <span>{currentUser.name?.substring(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div className={`flex-1 truncate ${isCollapsed ? 'md:hidden block' : 'block'}`}>
                    <p className="text-sm font-semibold text-white truncate">{currentUser.name}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {currentUser.role === 'admin' ? 'Quản trị viên' : `${currentUser.role === 'teacher' ? 'Giảng viên' : 'Sinh viên'}${currentUser.department ? ` - ${currentUser.department}` : ''}`}
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 group-hover:text-white transition ${isCollapsed ? 'md:hidden block' : 'block'}`} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[220px] bg-white rounded-xl shadow-xl border-0 p-2">
                <DropdownMenuItem asChild>
                  <Link
                    href="/user/profile"
                    className="flex items-center py-2.5 px-3 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-700 cursor-pointer w-full"
                  >
                    <User className="w-4 h-4 mr-2 text-slate-400" /> Thông tin cá nhân
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/user/change-password"
                    className="flex items-center py-2.5 px-3 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-700 cursor-pointer w-full"
                  >
                    <Settings className="w-4 h-4 mr-2 text-slate-400" /> Đổi mật khẩu
                  </Link>
                </DropdownMenuItem>
                <div className="h-px bg-slate-100 my-1 mx-2"></div>
                <DropdownMenuItem
                  className="py-2.5 px-3 rounded-lg hover:bg-red-50 text-sm font-medium text-red-600 cursor-pointer"
                  onSelect={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2 text-red-500" /> Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/auth/login"
              className={`w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold text-center flex items-center justify-center transition ${isCollapsed ? 'md:px-0' : 'px-4'}`}
              title="Đăng nhập"
            >
              {isCollapsed && <LogOut className="w-5 h-5 hidden md:block" />}
              <span className={isCollapsed ? 'md:hidden block' : 'block'}>Đăng nhập</span>
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Mobile-Only Toggle */}
        <div className="md:hidden sticky top-0 z-30 bg-[#F8F9FA] border-b border-gray-200 px-4 py-3 flex items-center">
          <button
            onClick={() => setMenuOpen(true)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-200"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto w-full">
          <div className="p-6 w-full max-w-[1400px] mx-auto">
            <LazyHydrate whenIdle>
              <div>{children}</div>
            </LazyHydrate>
          </div>
        </div>
      </main>

      {/* Chatbot Widget */}
      <ChatbotWidget />
    </div>
  );
}
