import { CRMRecord, CSVRow, HistoryItem, SkippedRecord, Statistics } from '../types';

export const sampleCSV: CSVRow[] = Array.from({ length: 50 }).map((_, i) => ({
  id: `row-${i}`,
  data: {
    'First Name': ['John', 'Jane', 'Alice', 'Bob', 'Charlie'][i % 5],
    'Last Name': ['Doe', 'Smith', 'Johnson', 'Williams', 'Brown'][i % 5],
    'Email': `contact${i}@example.com`,
    'Company': ['Acme Corp', 'Globex', 'Soylent', 'Initech', 'Umbrella'][i % 5],
    'Job Title': ['CEO', 'CTO', 'Developer', 'Designer', 'Manager'][i % 5],
  }
}));

export const sampleResults: CRMRecord[] = Array.from({ length: 20 }).map((_, i) => ({
  id: `crm-${i}`,
  firstName: ['John', 'Jane', 'Alice', 'Bob', 'Charlie'][i % 5],
  lastName: ['Doe', 'Smith', 'Johnson', 'Williams', 'Brown'][i % 5],
  email: `contact${i}@example.com`,
  company: ['Acme Corp', 'Globex', 'Soylent', 'Initech', 'Umbrella'][i % 5],
  jobTitle: ['CEO', 'CTO', 'Developer', 'Designer', 'Manager'][i % 5],
  phone: `+1-555-010${i % 10}`,
  leadSource: ['Organic', 'Referral', 'Paid', 'Direct'][i % 4],
  status: ['New', 'Contacted', 'Qualified'][i % 3],
  confidence: 85 + (i % 15),
}));

export const sampleSkipped: SkippedRecord[] = [
  { id: 'skip-1', originalRow: { name: 'Invalid User', email: 'invalid' }, reason: 'Missing Email', validationIssue: 'Email format is invalid' },
  { id: 'skip-2', originalRow: { name: 'No Name', email: 'test@test.com' }, reason: 'Missing Fields', validationIssue: 'First Name is required' },
];

export const sampleStats: Statistics = {
  imported: 1250,
  skipped: 24,
  failed: 5,
  warnings: 12,
  processingTime: 45,
  averageConfidence: 94,
};

export const sampleHistory: HistoryItem[] = [
  { id: 'hist-1', fileName: 'leads_q3.csv', date: '2023-10-24T10:00:00Z', status: 'Success', importedRows: 1250, totalRows: 1279 },
  { id: 'hist-2', fileName: 'events_attendees.csv', date: '2023-10-20T14:30:00Z', status: 'Partial', importedRows: 450, totalRows: 500 },
  { id: 'hist-3', fileName: 'old_contacts.csv', date: '2023-10-15T09:15:00Z', status: 'Failed', importedRows: 0, totalRows: 1000 },
];
