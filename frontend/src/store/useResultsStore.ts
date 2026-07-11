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
  history: [
    {
      id: 'hist-1',
      fileName: 'leads_q3.csv',
      date: new Date(Date.now() - 2 * 3600000).toISOString(),
      status: 'Success',
      importedRows: 1250,
      totalRows: 1279,
    },
    {
      id: 'hist-2',
      fileName: 'events_attendees.csv',
      date: new Date(Date.now() - 24 * 3600000).toISOString(),
      status: 'Partial',
      importedRows: 450,
      totalRows: 500,
    },
    {
      id: 'hist-3',
      fileName: 'old_contacts.csv',
      date: new Date(Date.now() - 5 * 86400000).toISOString(),
      status: 'Failed',
      importedRows: 0,
      totalRows: 1000,
    },
  ],

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
