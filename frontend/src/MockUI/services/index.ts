import { CSVFile } from '../types';

// TODO: Connect backend endpoint
// POST /api/import
export const ImportService = {
  uploadFile: async (file: File): Promise<CSVFile> => {
    // Mock implementation for frontend
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: Math.random().toString(36).substring(7),
          name: file.name,
          size: file.size,
          rows: Math.floor(Math.random() * 1000) + 100,
          columns: 8,
          uploadDate: new Date().toISOString(),
          status: 'pending'
        });
      }, 1500);
    });
  }
};

// TODO: Connect backend endpoint
// GET /api/results
export const ResultService = {
  getResults: async () => {
    // Mock
    return [];
  }
};
