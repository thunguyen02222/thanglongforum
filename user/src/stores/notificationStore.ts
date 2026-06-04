import { create } from 'zustand';

interface NotificationState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  decreaseUnread: () => void;
  increaseUnread: () => void;
  resetUnread: () => void;
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  unreadCount: 0,
  setUnreadCount: (count: number) => set({ unreadCount: count }),
  decreaseUnread: () => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
  increaseUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  resetUnread: () => set({ unreadCount: 0 })
}));
