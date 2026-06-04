import { create } from 'zustand';

interface ReportState {
  pendingCount: number;
  setPendingCount: (count: number) => void;
  decrement: () => void;
}

export const useReportStore = create<ReportState>((set) => ({
  pendingCount: 0,
  setPendingCount: (count) => set({ pendingCount: count }),
  decrement: () => set((s) => ({ pendingCount: Math.max(0, s.pendingCount - 1) }))
}));
