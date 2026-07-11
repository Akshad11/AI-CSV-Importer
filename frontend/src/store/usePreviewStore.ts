import { create } from 'zustand';
import { CSVRow } from '../types';

interface PreviewState {
  previewRows: CSVRow[];
  detectedDelimiter: string;
  detectedEncoding: string;
  columnMappings: Record<string, string>; // CSV column name -> CRM field name
  setPreviewData: (
    rows: CSVRow[],
    delimiter: string,
    encoding: string,
    mappings: Record<string, string>
  ) => void;
  updateColumnMapping: (csvColumn: string, crmField: string) => void;
  clearPreview: () => void;
}

export const usePreviewStore = create<PreviewState>((set) => ({
  previewRows: [],
  detectedDelimiter: ',',
  detectedEncoding: 'UTF-8',
  columnMappings: {},

  setPreviewData: (rows, delimiter, encoding, mappings) =>
    set({
      previewRows: rows,
      detectedDelimiter: delimiter,
      detectedEncoding: encoding,
      columnMappings: mappings,
    }),

  updateColumnMapping: (csvColumn, crmField) =>
    set((state) => ({
      columnMappings: {
        ...state.columnMappings,
        [csvColumn]: crmField,
      },
    })),

  clearPreview: () =>
    set({
      previewRows: [],
      detectedDelimiter: ',',
      detectedEncoding: 'UTF-8',
      columnMappings: {},
    }),
}));
