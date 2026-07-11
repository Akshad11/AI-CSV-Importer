import Papa from 'papaparse';
import { CSVRow } from '../types';

export interface ParseCsvOptions {
  onSuccess: (result: ParseCsvResult) => void;
  onError: (message: string) => void;
  onProgress?: (percent: number) => void;
}

export interface ParseCsvResult {
  headers: string[];
  allRows: CSVRow[];
  totalRows: number;
  columnsCount: number;
  delimiter: string;
  mapping: Record<string, string>;
}

/**
 * Fuzzy-match a CSV header to a known CRM field.
 * Returns the CRM field name or '' if unmapped.
 */
export function fuzzyMapHeader(header: string): string {
  const norm = header.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (norm === 'createdat' || norm === 'created' || norm === 'date' || norm === 'time') return 'created_at';
  if (norm === 'name' || norm === 'fullname' || norm === 'leadname') return 'name';
  if (norm === 'email' || norm === 'emailaddress' || norm === 'mail') return 'email';
  if (norm === 'countrycode' || norm === 'cc') return 'country_code';
  if (
    norm === 'mobile' ||
    norm === 'phone' ||
    norm === 'number' ||
    norm === 'mobilewithoutcountrycode' ||
    norm === 'mobilenumber'
  ) return 'mobile_without_country_code';
  if (norm === 'company' || norm === 'companyname' || norm === 'org') return 'company';
  if (norm === 'city' || norm === 'town') return 'city';
  if (norm === 'state' || norm === 'province' || norm === 'region') return 'state';
  if (norm === 'country' || norm === 'nation') return 'country';
  if (norm === 'owner' || norm === 'leadowner' || norm === 'agent') return 'lead_owner';
  if (norm === 'status' || norm === 'crmstatus' || norm === 'leadstatus') return 'crm_status';
  if (norm === 'note' || norm === 'crmnote' || norm === 'remark' || norm === 'comment') return 'crm_note';
  if (norm === 'source' || norm === 'datasource' || norm === 'leadsource') return 'data_source';
  if (norm === 'possession' || norm === 'possessiontime' || norm === 'propertytime') return 'possession_time';
  if (norm === 'description' || norm === 'desc' || norm === 'details') return 'description';

  return '';
}

/**
 * Build the column mapping record for a list of headers.
 */
export function buildColumnMappings(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  headers.forEach((header) => {
    mapping[header] = fuzzyMapHeader(header);
  });
  return mapping;
}

/**
 * Parse a File object using Papa Parse.
 * Calls onSuccess with the full ParseCsvResult, or onError with a friendly message.
 */
export function parseCsvFile(file: File, opts: ParseCsvOptions): void {
  opts.onProgress?.(10);

  Papa.parse(file, {
    header: true,
    skipEmptyLines: 'greedy',
    complete: (results) => {
      opts.onProgress?.(100);
      const headers = results.meta.fields || [];
      const rawRows = results.data as Record<string, string>[];
      const totalRows = rawRows.length;

      if (totalRows === 0) {
        opts.onError('The uploaded CSV file is empty.');
        return;
      }

      const allRows: CSVRow[] = rawRows.map((row, index) => ({
        id: `preview-row-${index}`,
        data: row,
      }));

      opts.onSuccess({
        headers,
        allRows,
        totalRows,
        columnsCount: headers.length,
        delimiter: results.meta.delimiter || ',',
        mapping: buildColumnMappings(headers),
      });
    },
    error: (err) => {
      opts.onError(`Failed parsing CSV: ${err.message}`);
    },
  });
}

/**
 * Parse raw CSV text (from paste) using Papa Parse.
 * Calls onSuccess with the full ParseCsvResult, or onError with a friendly message.
 */
export function parseCsvText(text: string, opts: ParseCsvOptions): void {
  opts.onProgress?.(10);

  try {
    const results = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: 'greedy',
    });

    opts.onProgress?.(100);

    const headers = results.meta.fields || [];
    const rawRows = results.data;
    const totalRows = rawRows.length;

    if (totalRows === 0) {
      opts.onError('The pasted CSV content contains no data rows.');
      return;
    }

    const allRows: CSVRow[] = rawRows.map((row, index) => ({
      id: `preview-row-${index}`,
      data: row,
    }));

    opts.onSuccess({
      headers,
      allRows,
      totalRows,
      columnsCount: headers.length,
      delimiter: results.meta.delimiter || ',',
      mapping: buildColumnMappings(headers),
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    opts.onError(`Failed parsing CSV text: ${errMsg}`);
  }
}

/** Auto-detect the delimiter used in a raw CSV string. */
export function detectDelimiter(text: string): string {
  const candidates = [',', ';', '\t', '|'];
  const firstLine = text.split('\n')[0] ?? '';
  let best = ',';
  let bestCount = 0;
  for (const c of candidates) {
    const count = firstLine.split(c).length - 1;
    if (count > bestCount) {
      bestCount = count;
      best = c;
    }
  }
  return best;
}

/** Delimiter display name */
export function delimiterLabel(d: string): string {
  if (d === ',') return 'Comma (,)';
  if (d === ';') return 'Semicolon (;)';
  if (d === '\t') return 'Tab (\\t)';
  if (d === '|') return 'Pipe (|)';
  return d;
}

/** Estimate import time in seconds based on row count */
export function estimateImportTime(rows: number): string {
  const secs = Math.ceil(rows / 50);
  if (secs < 60) return `~${secs}s`;
  const mins = Math.ceil(secs / 60);
  return `~${mins}m`;
}
