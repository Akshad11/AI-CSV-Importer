import { create } from 'zustand';
import { CRMRecord, SkippedRecord, ImportStats } from '../types';

interface ResultsState {
  crmRecords: CRMRecord[];
  skippedRecords: SkippedRecord[];
  stats: ImportStats | null;
  history: Array<{
    id: string;
    fileName: string;
    date: string;
    status: 'Success' | 'Failed' | 'Partial';
    importedRows: number;
    totalRows: number;
  }>;
  setResults: (
    crmRecords: CRMRecord[],
    skippedRecords: SkippedRecord[],
    stats: ImportStats
  ) => void;
  clearResults: () => void;
  addHistoryItem: (item: {
    fileName: string;
    status: 'Success' | 'Failed' | 'Partial';
    importedRows: number;
    totalRows: number;
  }) => void;
  clearHistory: () => void;
}

export const useResultsStore = create<ResultsState>((set) => ({
  crmRecords: [],
  skippedRecords: [],
  stats: null,
  history: [],

  setResults: (crmRecords, skippedRecords, stats) =>
    set({
      crmRecords,
      skippedRecords,
      stats,
    }),

  clearResults: () =>
    set({
      crmRecords: [],
      skippedRecords: [],
      stats: null,
    }),

  addHistoryItem: (item) =>
    set((state) => ({
      history: [
        {
          id: Math.random().toString(36).substring(7),
          date: new Date().toISOString(),
          ...item,
        },
        ...state.history,
      ],
    })),

  clearHistory: () => set({ history: [] }),
}));
