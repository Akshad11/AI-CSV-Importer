import { apiClient } from './apiClient';
import { ImportStatusResponse } from '../../types';

export const ImportService = {
  /**
   * Get the importer system status
   */
  async getStatus(): Promise<ImportStatusResponse['data']> {
    const { data } = await apiClient.get('/status');
    return data.data;
  },

  /**
   * Upload CSV file for parsing
   */
  async uploadCsv(
    file: File,
    onProgress?: (percent: number) => void,
    signal?: AbortSignal
  ): Promise<{ success: boolean; message: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      signal,
      onUploadProgress: (event) => {
        if (event.total && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      },
    });

    return data;
  },
};
export default ImportService;
