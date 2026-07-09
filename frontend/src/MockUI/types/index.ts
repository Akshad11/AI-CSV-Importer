export interface CSVFile {
  id: string;
  name: string;
  size: number;
  rows: number;
  columns: number;
  uploadDate: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface CSVColumn {
  id: string;
  header: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'unknown';
}

export interface CSVRow {
  id: string;
  data: Record<string, any>;
}

export interface CRMRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  jobTitle: string;
  phone: string;
  leadSource: string;
  status: string;
  confidence: number;
}

export interface SkippedRecord {
  id: string;
  originalRow: Record<string, any>;
  reason: string;
  validationIssue: string;
}

export interface ProcessingState {
  isProcessing: boolean;
  currentBatch: number;
  totalBatches: number;
  processedRows: number;
  totalRows: number;
  estimatedTimeRemaining: number; // in seconds
  status: 'idle' | 'running' | 'completed' | 'error';
  logs: string[];
}

export interface Statistics {
  imported: number;
  skipped: number;
  failed: number;
  warnings: number;
  processingTime: number; // in seconds
  averageConfidence: number; // percentage
}

export interface HistoryItem {
  id: string;
  fileName: string;
  date: string;
  status: 'Success' | 'Failed' | 'Partial';
  importedRows: number;
  totalRows: number;
}
