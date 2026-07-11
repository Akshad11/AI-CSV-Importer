export const APP_CONFIG = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1/importer',
  requestTimeoutMs: 30000, // 30 seconds
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ['text/csv', 'application/vnd.ms-excel'],
  allowedExtensions: ['.csv'],
};
