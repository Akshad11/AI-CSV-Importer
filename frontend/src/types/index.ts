export interface CSVFile {
  id: string;
  name: string;
  size: number;
  rows: number;
  columns: number;
  uploadDate: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  headers: string[];
  delimiter?: string;
  encoding?: string;
}

export interface CSVRow {
  id: string;
  data: Record<string, string>;
}

export interface CRMRecord {
  id: string;
  rowNumber: number;
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: 'GOOD_LEAD_FOLLOW_UP' | 'DID_NOT_CONNECT' | 'BAD_LEAD' | 'SALE_DONE';
  crm_note: string;
  data_source: 'leads_on_demand' | 'meridian_tower' | 'eden_park' | 'varah_swamy' | 'sarjapur_plots' | '';
  possession_time: string;
  description: string;
  confidence: number;
}

export interface SkippedRecord {
  id: string;
  rowNumber: number;
  originalRow: Record<string, string>;
  reason: string;
  validationIssue: string;
}

export interface ImportStats {
  imported: number;
  skipped: number;
  failed: number;
  warnings: number;
  processingTime: number; // in seconds
  averageConfidence: number; // percentage
  recordsPerSecond: number;
  totalCost: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  rowNumber?: number;
  targetField?: string;
  rawInput?: string;
  extractedValue?: string;
  certainty?: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface ProcessingState {
  isProcessing: boolean;
  currentBatch: number;
  totalBatches: number;
  processedRows: number;
  totalRows: number;
  estimatedTimeRemaining: number; // in seconds
  status: 'idle' | 'running' | 'completed' | 'error' | 'cancelled';
  logs: ActivityLog[];
  recordsPerSecond: number;
  totalCost: number;
  successCount: number;
  warningCount: number;
  failureCount: number;
}

export type ImporterStatus = 'ready' | 'busy' | 'error' | 'initializing';

export interface ImportStatusResponse {
  success: boolean;
  message: string;
  data: {
    status: ImporterStatus;
    message: string;
  };
}

export interface UploadSuccessResponse {
  success: boolean;
  message: string;
  data: {
    headers: string[];
    totalRows: number;
    skippedRows: number;
    durationMs: number;
  };
}

export interface SystemSettings {
  theme: 'light' | 'dark' | 'system';
  confidenceThreshold: number;
  defaultLeadSource: string;
  rowsPerPage: number;
  animationSpeed: 'slow' | 'normal' | 'fast';
  defaultPreviewRows: number;
  aiProvider: 'openai' | 'gemini' | 'ollama' | 'mock';
}
