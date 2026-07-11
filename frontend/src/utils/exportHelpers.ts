import { CRMRecord } from '../types';
import { toast } from 'sonner';

/**
 * Copy data array to user clipboard as formatted JSON
 */
export function copyToClipboard(data: CRMRecord[]) {
  try {
    const jsonStr = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(jsonStr);
    toast.success('Successfully copied CRM JSON payload to clipboard!');
  } catch (err) {
    toast.error('Failed to copy to clipboard.');
  }
}

/**
 * Download data array as structured JSON file
 */
export function downloadJson(data: CRMRecord[], filename = 'extracted_leads.json') {
  try {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Exported JSON successfully!');
  } catch (err) {
    toast.error('Failed to download JSON file.');
  }
}

/**
 * Convert CRMRecord list and download as a CSV file
 */
export function downloadCsv(records: CRMRecord[], filename = 'extracted_leads.csv') {
  if (records.length === 0) {
    toast.error('No records available to export.');
    return;
  }

  try {
    // CSV Header row
    const headers = [
      'Row',
      'Created At',
      'Name',
      'Email',
      'Country Code',
      'Mobile',
      'Company',
      'City',
      'State',
      'Country',
      'Lead Owner',
      'Status',
      'Notes',
      'Source',
      'Possession Time',
      'Description',
      'Certainty',
    ];

    // Map rows data
    const rows = records.map((r) => [
      r.rowNumber.toString(),
      `"${r.created_at}"`,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.email}"`,
      `"${r.country_code}"`,
      `"${r.mobile_without_country_code}"`,
      `"${r.company.replace(/"/g, '""')}"`,
      `"${r.city.replace(/"/g, '""')}"`,
      `"${r.state.replace(/"/g, '""')}"`,
      `"${r.country.replace(/"/g, '""')}"`,
      `"${r.lead_owner.replace(/"/g, '""')}"`,
      `"${r.crm_status}"`,
      `"${r.crm_note.replace(/"/g, '""')}"`,
      `"${r.data_source}"`,
      `"${r.possession_time}"`,
      `"${r.description.replace(/"/g, '""')}"`,
      `${(r.confidence / 100).toFixed(2)}`,
    ]);

    // Join rows
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Exported CSV successfully!');
  } catch (err) {
    toast.error('Failed to download CSV file.');
  }
}
export default { copyToClipboard, downloadJson, downloadCsv };
