import { useUploadStore, usePreviewStore, useImportStore, useResultsStore, useSettingsStore } from '../../store';
import { CRMRecord, SkippedRecord, ActivityLog, ImportStats } from '../../types';

class ExtractionSimulator {
  private activeTimer: NodeJS.Timeout | null = null;
  private isCancelled = false;

  /**
   * Start the AI CRM extraction simulation
   */
  public start(onComplete: () => void) {
    this.isCancelled = false;
    const file = useUploadStore.getState().file;
    const fileMeta = useUploadStore.getState().fileMeta;
    const { previewRows, columnMappings } = usePreviewStore.getState();
    const { confidenceThreshold, defaultLeadSource, aiProvider } = useSettingsStore.getState().settings;

    if (!file || !fileMeta) {
      useImportStore.getState().failProcessing('No file loaded.');
      return;
    }

    const totalRows = fileMeta.rows;
    const batchSize = 25; // process in batches of 25 for quick feedback
    const totalBatches = Math.ceil(totalRows / batchSize);
    
    // Reset stores
    useImportStore.getState().startProcessing(totalRows, totalBatches);
    useResultsStore.getState().clearResults();

    let providerName = 'Mock Provider';
    let modelName = 'local';
    let costPerRow = 0.0;
    const usdToInrRate = 83.0; // 1 USD = 83 INR
    
    if (aiProvider === 'openai') {
      providerName = 'ChatGPT';
      modelName = 'gpt-4o-mini';
      costPerRow = 0.0005 * usdToInrRate;
    } else if (aiProvider === 'gemini') {
      providerName = 'Gemini';
      modelName = 'gemini-2.5-flash';
      costPerRow = 0.00015 * usdToInrRate;
    } else if (aiProvider === 'ollama') {
      providerName = 'Local Llama';
      modelName = 'llama3';
      costPerRow = 0.0;
    } else {
      costPerRow = 0.0001 * usdToInrRate;
    }

    useImportStore.getState().addLog({
      message: `[AI Provider: ${providerName}] Initializing model ${modelName}. Ready to parse ${totalRows} rows.`,
      type: 'info',
    });

    let processedCount = 0;
    let currentBatch = 0;
    const startTime = Date.now();

    const crmRecords: CRMRecord[] = [];
    const skippedRecords: SkippedRecord[] = [];
    let successCount = 0;
    let warningCount = 0;
    let failureCount = 0;

    // Helper to generate simulated extraction data based on column mappings and headers
    const processRow = (rowIndex: number): { record?: CRMRecord; skipped?: SkippedRecord; log?: Omit<ActivityLog, 'id' | 'timestamp'> } => {
      const sampleNames = ['John', 'Jane', 'Alice', 'Bob', 'Charlie', 'Sarah', 'Michael', 'David', 'Emily', 'James'];
      const sampleLasts = ['Doe', 'Smith', 'Johnson', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor'];
      const sampleCompanies = ['Acme Corp', 'Globex', 'Soylent', 'Initech', 'Umbrella', 'Hooli', 'Vehement', 'Stark Industries', 'Wayne Enterprises'];
      const sampleTitles = ['CEO', 'CTO', 'Developer', 'Designer', 'Manager', 'Analyst', 'VP of Sales', 'HR Lead', 'Operations Director'];
      
      const seed = rowIndex;
      const nameSeed = rowIndex % sampleNames.length;
      const lastSeed = rowIndex % sampleLasts.length;
      const companySeed = rowIndex % sampleCompanies.length;
      
      const hasPreviewRow = rowIndex < previewRows.length;
      const rawRow: Record<string, string> = hasPreviewRow
        ? { ...previewRows[rowIndex].data }
        : {};

      if (!hasPreviewRow) {
        // Build raw row representation
        fileMeta.headers.forEach(h => {
          const normH = h.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (normH.includes('first')) rawRow[h] = sampleNames[nameSeed];
          else if (normH.includes('last')) rawRow[h] = `${sampleLasts[lastSeed]}`;
          else if (normH.includes('email')) rawRow[h] = `${sampleNames[nameSeed].toLowerCase()}.${sampleLasts[lastSeed].toLowerCase()}${rowIndex > 0 ? rowIndex : ''}@${sampleCompanies[companySeed].toLowerCase().replace(/\s+/g, '')}.com`;
          else if (normH.includes('company')) rawRow[h] = sampleCompanies[companySeed];
          else if (normH.includes('title')) rawRow[h] = sampleTitles[seed % sampleTitles.length];
          else if (normH.includes('phone')) rawRow[h] = `+1-555-01${(10 + seed % 90)}`;
          else rawRow[h] = sampleNames[nameSeed];
        });
      }

      // Find mapped fields values
      let created_at = '';
      let name = '';
      let email = '';
      let country_code = '';
      let mobile_without_country_code = '';
      let company = '';
      let city = '';
      let state = '';
      let country = '';
      let lead_owner = '';
      let crm_status = '';
      let crm_note = '';
      let data_source = '';
      let possession_time = '';
      let description = '';

      Object.entries(columnMappings).forEach(([csvCol, crmField]) => {
        const value = rawRow[csvCol] || '';
        if (crmField === 'created_at') created_at = value;
        else if (crmField === 'name') name = value;
        else if (crmField === 'email') email = value;
        else if (crmField === 'country_code') country_code = value;
        else if (crmField === 'mobile_without_country_code') mobile_without_country_code = value;
        else if (crmField === 'company') company = value;
        else if (crmField === 'city') city = value;
        else if (crmField === 'state') state = value;
        else if (crmField === 'country') country = value;
        else if (crmField === 'lead_owner') lead_owner = value;
        else if (crmField === 'crm_status') crm_status = value;
        else if (crmField === 'crm_note') crm_note = value;
        else if (crmField === 'data_source') data_source = value;
        else if (crmField === 'possession_time') possession_time = value;
        else if (crmField === 'description') description = value;
      });

      // Validation Rules
      // 1. Skip record if it contains neither email nor mobile number
      const hasEmailVal = !!email && email.trim() !== '';
      const hasMobileVal = !!mobile_without_country_code && mobile_without_country_code.trim() !== '';
      if (!hasEmailVal && !hasMobileVal) {
        const skippedRow: SkippedRecord = {
          id: `skipped-${rowIndex}`,
          rowNumber: rowIndex + 1,
          originalRow: rawRow,
          reason: 'Skipped: Missing Identifier',
          validationIssue: 'Record contains neither email address nor mobile number.',
        };
        return {
          skipped: skippedRow,
          log: {
            rowNumber: rowIndex + 1,
            targetField: 'email',
            rawInput: 'N/A',
            message: `Row ${rowIndex + 1} skipped: Contains neither email nor mobile number.`,
            type: 'error',
          }
        };
      }

      // 2. Date Format check
      let finalCreatedAt = created_at;
      let dateValid = false;
      if (finalCreatedAt) {
        const parsedDate = new Date(finalCreatedAt);
        dateValid = !isNaN(parsedDate.getTime());
      }
      if (!dateValid) {
        finalCreatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
      }

      // 3. CRM Notes and Multiple emails/phones separation
      let finalEmail = email || '';
      let extraEmails: string[] = [];
      if (finalEmail.includes(',') || finalEmail.includes(';')) {
        const emailParts = finalEmail.split(/[,;]/).map(e => e.trim()).filter(Boolean);
        finalEmail = emailParts[0] || '';
        extraEmails = emailParts.slice(1);
      }

      let finalMobile = mobile_without_country_code || '';
      let extraMobiles: string[] = [];
      if (finalMobile.includes(',') || finalMobile.includes(';')) {
        const mobileParts = finalMobile.split(/[,;]/).map(m => m.trim()).filter(Boolean);
        finalMobile = mobileParts[0] || '';
        extraMobiles = mobileParts.slice(1);
      }

      let finalNote = crm_note || '';
      if (extraEmails.length > 0) {
        finalNote += (finalNote ? ' | ' : '') + `Extra Emails: ${extraEmails.join(', ')}`;
      }
      if (extraMobiles.length > 0) {
        finalNote += (finalNote ? ' | ' : '') + `Extra Mobiles: ${extraMobiles.join(', ')}`;
      }

      // 4. Allowed CRM Status Values
      let finalStatus: 'GOOD_LEAD_FOLLOW_UP' | 'DID_NOT_CONNECT' | 'BAD_LEAD' | 'SALE_DONE' = 'GOOD_LEAD_FOLLOW_UP';
      const allowedStatuses = ['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'];
      if (crm_status && allowedStatuses.includes(crm_status)) {
        finalStatus = crm_status as any;
      } else {
        const statusMap: Record<number, 'GOOD_LEAD_FOLLOW_UP' | 'DID_NOT_CONNECT' | 'BAD_LEAD' | 'SALE_DONE'> = {
          0: 'GOOD_LEAD_FOLLOW_UP',
          1: 'DID_NOT_CONNECT',
          2: 'BAD_LEAD',
          3: 'SALE_DONE',
        };
        finalStatus = statusMap[seed % 4];
      }

      // 5. Allowed Data Source Values
      let finalDataSource: 'leads_on_demand' | 'meridian_tower' | 'eden_park' | 'varah_swamy' | 'sarjapur_plots' | '' = '';
      const allowedSources = ['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots'];
      if (data_source && allowedSources.includes(data_source)) {
        finalDataSource = data_source as any;
      } else {
        finalDataSource = '';
      }

      // Confidence & warnings calculations
      const isMissingCompany = !company || company.trim() === '';
      const finalCompany = isMissingCompany ? 'Unknown Company' : company;
      const confidence = isMissingCompany
        ? 75 + (seed % 10)
        : 85 + (seed % 15);

      // Create valid CRM record
      const record: CRMRecord = {
        id: `crm-record-${rowIndex}`,
        rowNumber: rowIndex + 1,
        created_at: finalCreatedAt,
        name: name || 'Unknown Name',
        email: finalEmail,
        country_code: country_code || '+91',
        mobile_without_country_code: finalMobile,
        company: finalCompany,
        city: city || '',
        state: state || '',
        country: country || '',
        lead_owner: lead_owner || '',
        crm_status: finalStatus,
        crm_note: finalNote,
        data_source: finalDataSource,
        possession_time: possession_time || '',
        description: description || '',
        confidence,
      };

      if (isMissingCompany) {
        return {
          record,
          log: {
            rowNumber: rowIndex + 1,
            targetField: 'company',
            rawInput: 'EMPTY',
            extractedValue: finalCompany,
            certainty: confidence / 100,
            message: `Row ${rowIndex + 1}: Extracted lead with warnings (missing company field resolved as fallback).`,
            type: 'warning',
          }
        };
      }

      // Success extraction log (random field to highlight)
      const fields = ['email', 'mobile_without_country_code', 'company', 'name'];
      const highlightField = fields[seed % fields.length];
      const rawInput = rawRow[Object.keys(columnMappings).find(k => columnMappings[k] === highlightField) || ''] || '';
      const extractedValue = (record as any)[highlightField];

      return {
        record,
        log: {
          rowNumber: rowIndex + 1,
          targetField: highlightField,
          rawInput,
          extractedValue,
          certainty: confidence / 100,
          message: `Row ${rowIndex + 1}: AI extracted field [${highlightField}] with ${confidence}% confidence.`,
          type: 'success',
        }
      };
    };

    const processNextBatch = () => {
      if (this.isCancelled) return;

      currentBatch++;
      const currentBatchStartRow = (currentBatch - 1) * batchSize;
      const currentBatchEndRow = Math.min(totalRows, currentBatch * batchSize);
      const rowsInBatch = currentBatchEndRow - currentBatchStartRow;

      const providerPrefix = aiProvider === 'openai' ? '[ChatGPT]' :
                             aiProvider === 'gemini' ? '[Gemini]' :
                             aiProvider === 'ollama' ? '[Llama]' : '[Mock]';

      useImportStore.getState().addLog({
        message: `${providerPrefix} Processing batch ${currentBatch} of ${totalBatches} (${currentBatchStartRow + 1} to ${currentBatchEndRow})...`,
        type: 'info',
      });

      // Process rows of this batch
      for (let i = currentBatchStartRow; i < currentBatchEndRow; i++) {
        const { record, skipped, log } = processRow(i);
        
        if (record) {
          crmRecords.push(record);
          successCount++;
          if (log?.type === 'warning') warningCount++;
        }
        if (skipped) {
          skippedRecords.push(skipped);
          failureCount++; // treat skipped as failure/skipped statistic
        }
        if (log) {
          useImportStore.getState().addLog(log);
        }
      }

      processedCount += rowsInBatch;

      // Calculate performance metrics
      const elapsedSeconds = Math.max(1, (Date.now() - startTime) / 1000);
      const speed = parseFloat((processedCount / elapsedSeconds).toFixed(1));
      const cost = parseFloat((processedCount * costPerRow).toFixed(4));
      
      // Calculate estimated time remaining
      const remainingRows = totalRows - processedCount;
      const timeRemaining = Math.ceil(remainingRows / (speed || 10));

      // Update progress store
      useImportStore.getState().updateProgress(
        processedCount,
        currentBatch,
        timeRemaining,
        {
          success: successCount,
          warning: warningCount,
          failure: failureCount,
          speed,
          cost,
        }
      );

      // Verify if finished
      if (processedCount >= totalRows) {
        const finalDuration = Math.round((Date.now() - startTime) / 1000);
        const averageConfidence = Math.round(
          crmRecords.reduce((acc, curr) => acc + curr.confidence, 0) / (crmRecords.length || 1)
        );

        const stats: ImportStats = {
          imported: crmRecords.length,
          skipped: skippedRecords.length,
          failed: failureCount,
          warnings: warningCount,
          processingTime: finalDuration,
          averageConfidence,
          recordsPerSecond: speed,
          totalCost: cost,
        };

        // Save final lists to results store
        useResultsStore.getState().setResults(crmRecords, skippedRecords, stats);

        // Add item to history store
        useResultsStore.getState().addHistoryItem({
          fileName: fileMeta.name,
          status: skippedRecords.length === 0 ? 'Success' : crmRecords.length > 0 ? 'Partial' : 'Failed',
          importedRows: crmRecords.length,
          totalRows,
        });

        // Set completed in import store
        useImportStore.getState().completeProcessing();
        onComplete();
      } else {
        // Schedule next batch with random delay simulating server/AI response latencies (e.g. 1.2 to 2s)
        const delay = aiProvider === 'openai' ? (1200 + Math.random() * 800) :
                      aiProvider === 'gemini' ? (900 + Math.random() * 600) :
                      aiProvider === 'ollama' ? (2500 + Math.random() * 1500) :
                      (300 + Math.random() * 200);
        this.activeTimer = setTimeout(processNextBatch, delay);
      }
    };

    // Trigger first batch parsing
    this.activeTimer = setTimeout(processNextBatch, 800);
  }

  /**
   * Cancel the active simulator
   */
  public cancel() {
    this.isCancelled = true;
    if (this.activeTimer) {
      clearTimeout(this.activeTimer);
      this.activeTimer = null;
    }
    useImportStore.getState().cancelProcessing();
  }
}

export const extractionSimulator = new ExtractionSimulator();
export default extractionSimulator;
