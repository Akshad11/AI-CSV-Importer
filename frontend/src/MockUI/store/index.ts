import { create } from 'zustand';
import { CSVFile, ProcessingState } from '../types';

interface GlobalState {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  
  uploadFile: CSVFile | null;
  setUploadFile: (file: CSVFile | null) => void;
  
  processingState: ProcessingState;
  updateProcessingState: (state: Partial<ProcessingState>) => void;
  resetProcessing: () => void;
}

const initialProcessingState: ProcessingState = {
  isProcessing: false,
  currentBatch: 0,
  totalBatches: 0,
  processedRows: 0,
  totalRows: 0,
  estimatedTimeRemaining: 0,
  status: 'idle',
  logs: [],
};

export const useStore = create<GlobalState>((set) => ({
  theme: 'system',
  setTheme: (theme) => set({ theme }),
  
  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  closeSidebar: () => set({ isSidebarOpen: false }),
  
  uploadFile: null,
  setUploadFile: (file) => set({ uploadFile: file }),
  
  processingState: initialProcessingState,
  updateProcessingState: (state) => set((prev) => ({ processingState: { ...prev.processingState, ...state } })),
  resetProcessing: () => set({ processingState: initialProcessingState }),
}));
