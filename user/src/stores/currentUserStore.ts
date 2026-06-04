import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IUser } from '@interfaces/user';

interface CurrentUserState {
  currentUser: IUser | null;
  isLoading: boolean;
  setCurrentUser: (user: IUser) => void;
  clearCurrentUser: () => void;
  setLoading: (loading: boolean) => void;
}

export const useCurrentUserStore = create<CurrentUserState>()(
  persist(
    (set) => ({
      currentUser: null,
      isLoading: true,
      setCurrentUser: (user: IUser) => set({ currentUser: user, isLoading: false }),
      clearCurrentUser: () => set({ currentUser: null, isLoading: false }),
      setLoading: (loading: boolean) => set({ isLoading: loading })
    }),
    {
      name: 'user-storage'
    }
  )
);
