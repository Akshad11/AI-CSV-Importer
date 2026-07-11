import { apiClient } from './apiClient';
import { ImportStatusResponse, CRMRecord, SkippedRecord, ImportStats } from '../../types';

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

  /**
   * Process CSV file using backend AI pipeline
   */
  async processCsv(params: {
    file: File;
    provider: string;
    model: string;
    batchSize: number;
    columnMappings: Record<string, string>;
    confidenceThreshold: number;
    defaultLeadSource: string;
    onProgress?: (percent: number) => void;
    signal?: AbortSignal;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      records: CRMRecord[];
      skipped: SkippedRecord[];
      statistics: ImportStats;
      processingTime: number;
    };
  }> {
    const formData = new FormData();
    formData.append('file', params.file);
    formData.append('provider', params.provider);
    formData.append('model', params.model);
    formData.append('batchSize', String(params.batchSize));
    formData.append('columnMappings', JSON.stringify(params.columnMappings));
    formData.append('confidenceThreshold', String(params.confidenceThreshold));
    formData.append('defaultLeadSource', params.defaultLeadSource);

    const { data } = await apiClient.post('/process', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      signal: params.signal,
      onUploadProgress: (event) => {
        if (event.total && params.onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          params.onProgress(percent);
        }
      },
    });

    return data;
  },
};
export default ImportService;
