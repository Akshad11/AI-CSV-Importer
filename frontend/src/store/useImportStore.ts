import { create } from 'zustand';
import { ProcessingState, ActivityLog } from '../types';

interface ImportActions {
  startProcessing: (totalRows: number, totalBatches: number) => void;
  updateProgress: (
    processedRows: number,
    currentBatch: number,
    timeRemaining: number,
    stats: {
      success: number;
      warning: number;
      failure: number;
      speed: number;
      cost: number;
    }
  ) => void;
  addLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  cancelProcessing: (reason?: string) => void;
  failProcessing: (errorMsg: string) => void;
  completeProcessing: () => void;
  resetProcessing: () => void;
}

const initialImportState: ProcessingState = {
  isProcessing: false,
  currentBatch: 0,
  totalBatches: 0,
  processedRows: 0,
  totalRows: 0,
  estimatedTimeRemaining: 0,
  status: 'idle',
  logs: [],
  recordsPerSecond: 0,
  totalCost: 0,
  successCount: 0,
  warningCount: 0,
  failureCount: 0,
};

export const useImportStore = create<ProcessingState & ImportActions>((set) => ({
  ...initialImportState,

  startProcessing: (totalRows, totalBatches) =>
    set({
      ...initialImportState,
      isProcessing: true,
      status: 'running',
      totalRows,
      totalBatches,
      logs: [
        {
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
          message: `Initialization successful. Ready to process ${totalRows} rows across ${totalBatches} batches.`,
          type: 'info',
        },
      ],
    }),

  updateProgress: (processedRows, currentBatch, timeRemaining, stats) =>
    set((state) => ({
      processedRows,
      currentBatch,
      estimatedTimeRemaining: timeRemaining,
      successCount: stats.success,
      warningCount: stats.warning,
      failureCount: stats.failure,
      recordsPerSecond: stats.speed,
      totalCost: stats.cost,
    })),

  addLog: (log) =>
    set((state) => ({
      logs: [
        {
          ...log,
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
        },
        ...state.logs,
      ],
    })),

  cancelProcessing: (reason = 'Cancelled by user') =>
    set((state) => ({
      status: 'cancelled',
      isProcessing: false,
      logs: [
        {
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
          message: `Import process cancelled. Reason: ${reason}.`,
          type: 'warning',
        },
        ...state.logs,
      ],
    })),

  failProcessing: (errorMsg) =>
    set((state) => ({
      status: 'error',
      isProcessing: false,
      logs: [
        {
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
          message: `Import process failed. Error: ${errorMsg}.`,
          type: 'error',
        },
        ...state.logs,
      ],
    })),

  completeProcessing: () =>
    set((state) => ({
      status: 'completed',
      isProcessing: false,
      estimatedTimeRemaining: 0,
      logs: [
        {
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
          message: `Pipeline execution complete. ${state.processedRows} records processed.`,
          type: 'success',
        },
        ...state.logs,
      ],
    })),

  resetProcessing: () => set(initialImportState),
}));
