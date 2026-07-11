import { create } from 'zustand';
import { CSVFile } from '../types';

interface UploadState {
  file: File | null;
  fileMeta: CSVFile | null;
  isUploading: boolean;
  uploadError: string | null;
  setFile: (file: File, meta: Omit<CSVFile, 'id' | 'uploadDate' | 'status'>) => void;
  clearFile: () => void;
  setUploading: (isUploading: boolean) => void;
  setUploadError: (error: string | null) => void;
  setImportStatus: (status: CSVFile['status']) => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  file: null,
  fileMeta: null,
  isUploading: false,
  uploadError: null,

  setFile: (file, meta) =>
    set({
      file,
      fileMeta: {
        ...meta,
        id: Math.random().toString(36).substring(7),
        uploadDate: new Date().toISOString(),
        status: 'pending',
      },
      uploadError: null,
    }),

  clearFile: () =>
    set({
      file: null,
      fileMeta: null,
      isUploading: false,
      uploadError: null,
    }),

  setUploading: (isUploading) => set({ isUploading }),
  setUploadError: (uploadError) => set({ uploadError }),
  setImportStatus: (status) =>
    set((state) => ({
      fileMeta: state.fileMeta ? { ...state.fileMeta, status } : null,
    })),
}));
