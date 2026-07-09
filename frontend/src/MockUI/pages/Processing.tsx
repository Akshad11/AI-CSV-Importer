import { useEffect } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';

export default function ProcessingPage() {
  const { processingState, updateProcessingState } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (processingState.status !== 'running') return;

    const interval = setInterval(() => {
      updateProcessingState({
        processedRows: Math.min(processingState.processedRows + 15, processingState.totalRows),
        estimatedTimeRemaining: Math.max(0, processingState.estimatedTimeRemaining - 1),
      });

      if (processingState.processedRows >= processingState.totalRows) {
        updateProcessingState({ status: 'completed', estimatedTimeRemaining: 0 });
        clearInterval(interval);
        
        setTimeout(() => {
          navigate('/results');
        }, 1500);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [processingState.status, processingState.processedRows, processingState.totalRows, updateProcessingState, navigate]);

  const percentage = processingState.totalRows > 0 
    ? (processingState.processedRows / processingState.totalRows) * 100 
    : 0;

  return (
    <div className="flex-1 flex flex-col gap-4 md:gap-6 w-full max-w-full overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 shrink-0">
        <div className="rounded-xl border border-slate-200 bg-white p-3 md:p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800 flex flex-col justify-center">
          <p className="text-xs font-serif italic text-slate-500 dark:text-slate-400">Status</p>
          <div className="mt-1 flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full shrink-0 ${processingState.status === 'completed' ? 'bg-green-500' : 'animate-pulse bg-indigo-600'}`}></div>
            <p className="text-base md:text-lg font-semibold tracking-tight truncate">{processingState.status === 'completed' ? 'Completed' : 'Processing'}</p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 md:p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800 flex flex-col justify-center">
          <p className="text-xs font-serif italic text-slate-500 dark:text-slate-400">Progress</p>
          <p className="mt-1 text-base md:text-lg font-mono font-semibold tracking-tight truncate">{percentage.toFixed(1)}%</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 md:p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800 flex flex-col justify-center">
          <p className="text-xs font-serif italic text-slate-500 dark:text-slate-400">Est. Time</p>
          <p className="mt-1 text-base md:text-lg font-semibold tracking-tight truncate">
            {Math.floor(processingState.estimatedTimeRemaining / 60).toString().padStart(2, '0')}:
            {(processingState.estimatedTimeRemaining % 60).toString().padStart(2, '0')}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 md:p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800 flex flex-col justify-center">
          <p className="text-xs font-serif italic text-slate-500 dark:text-slate-400">Confidence</p>
          <p className="mt-1 text-base md:text-lg font-semibold tracking-tight text-green-600 truncate">High <span className="hidden sm:inline">(98.2%)</span></p>
        </div>
      </div>

      <div className="flex-1 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col dark:bg-slate-900 dark:border-slate-800 min-h-[300px]">
        <div className="border-b border-slate-100 bg-slate-50/50 px-4 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 dark:border-slate-800 dark:bg-slate-900/50">
          <h3 className="font-medium text-slate-900 dark:text-slate-50">Batch Extraction Logs</h3>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-500 uppercase dark:text-slate-400">
              Batch {processingState.currentBatch.toString().padStart(2, '0')} / {processingState.totalBatches.toString().padStart(2, '0')}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-widest dark:bg-slate-800 dark:text-slate-400">
              {processingState.status === 'completed' ? 'Done' : 'Active'}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-auto w-full relative">
          <div className="min-w-max md:min-w-0 absolute inset-0">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500 sticky top-0 dark:bg-slate-900 dark:text-slate-400 shadow-sm z-10">
                  <th className="border-b border-slate-100 px-4 md:px-6 py-2 md:py-3 font-serif italic normal-case font-medium dark:border-slate-800 whitespace-nowrap">Row</th>
                  <th className="border-b border-slate-100 px-4 md:px-6 py-2 md:py-3 font-serif italic normal-case font-medium dark:border-slate-800 whitespace-nowrap">Target Field</th>
                  <th className="border-b border-slate-100 px-4 md:px-6 py-2 md:py-3 font-serif italic normal-case font-medium dark:border-slate-800 whitespace-nowrap">Raw Input Data</th>
                  <th className="border-b border-slate-100 px-4 md:px-6 py-2 md:py-3 font-serif italic normal-case font-medium dark:border-slate-800 whitespace-nowrap">Extracted Value</th>
                  <th className="border-b border-slate-100 px-4 md:px-6 py-2 md:py-3 font-serif italic normal-case font-medium text-right dark:border-slate-800 whitespace-nowrap">Certainty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[10px] md:text-[11px] leading-relaxed dark:divide-slate-800">
                <tr className="bg-white hover:bg-slate-50/80 transition-colors dark:bg-slate-900 dark:hover:bg-slate-800/80">
                  <td className="px-4 md:px-6 py-2 md:py-2.5 text-slate-400">782</td>
                  <td className="px-4 md:px-6 py-2 md:py-2.5 text-indigo-600 font-semibold dark:text-indigo-400">email</td>
                  <td className="px-4 md:px-6 py-2 md:py-2.5 text-slate-500 truncate max-w-[150px] md:max-w-xs" title="User ID: JDOE-99 - Contact: john.doe@acme.com">User ID: JDOE-99 - Contact: john.doe@acme.com</td>
                  <td className="px-4 md:px-6 py-2 md:py-2.5 text-slate-900 dark:text-slate-50 truncate max-w-[150px] md:max-w-xs" title="john.doe@acme.com">john.doe@acme.com</td>
                  <td className="px-4 md:px-6 py-2 md:py-2.5 text-right font-bold text-green-600 dark:text-green-500">1.00</td>
                </tr>
                <tr className="bg-white hover:bg-slate-50/80 transition-colors dark:bg-slate-900 dark:hover:bg-slate-800/80">
                  <td className="px-4 md:px-6 py-2 md:py-2.5 text-slate-400">783</td>
                  <td className="px-4 md:px-6 py-2 md:py-2.5 text-indigo-600 font-semibold dark:text-indigo-400">phone</td>
                  <td className="px-4 md:px-6 py-2 md:py-2.5 text-slate-500 truncate max-w-[150px] md:max-w-xs" title="Direct Office: +1 415-555-0192 (Ask for Sarah)">Direct Office: +1 415-555-0192 (Ask for Sarah)</td>
                  <td className="px-4 md:px-6 py-2 md:py-2.5 text-slate-900 dark:text-slate-50 truncate max-w-[150px] md:max-w-xs" title="+14155550192">+14155550192</td>
                  <td className="px-4 md:px-6 py-2 md:py-2.5 text-right font-bold text-green-600 dark:text-green-500">0.98</td>
                </tr>
                <tr className="bg-white hover:bg-slate-50/80 transition-colors dark:bg-slate-900 dark:hover:bg-slate-800/80">
                  <td className="px-4 md:px-6 py-2 md:py-2.5 text-slate-400">784</td>
                  <td className="px-4 md:px-6 py-2 md:py-2.5 text-indigo-600 font-semibold dark:text-indigo-400">company_size</td>
                  <td className="px-4 md:px-6 py-2 md:py-2.5 text-slate-500 truncate max-w-[150px] md:max-w-xs" title="Notes: Startup phase, around 50 people.">Notes: Startup phase, around 50 people.</td>
                  <td className="px-4 md:px-6 py-2 md:py-2.5 text-slate-900 dark:text-slate-50 truncate max-w-[150px] md:max-w-xs" title="11-50">11-50</td>
                  <td className="px-4 md:px-6 py-2 md:py-2.5 text-right font-bold text-amber-500">0.82</td>
                </tr>
                <tr className="bg-white hover:bg-slate-50/80 transition-colors dark:bg-slate-900 dark:hover:bg-slate-800/80">
                  <td className="px-4 md:px-6 py-2 md:py-2.5 text-slate-400">785</td>
                  <td className="px-4 md:px-6 py-2 md:py-2.5 text-indigo-600 font-semibold dark:text-indigo-400">linkedin_url</td>
                  <td className="px-4 md:px-6 py-2 md:py-2.5 text-slate-500 truncate max-w-[150px] md:max-w-xs" title="linkedin.com/in/michaels-fin-tech-vp-99">linkedin.com/in/michaels-...</td>
                  <td className="px-4 md:px-6 py-2 md:py-2.5 text-slate-900 dark:text-slate-50 truncate max-w-[150px] md:max-w-xs" title="/in/michaels-fin-tech-vp-99">/in/michaels-...</td>
                  <td className="px-4 md:px-6 py-2 md:py-2.5 text-right font-bold text-green-600 dark:text-green-500">0.99</td>
                </tr>
                <tr className="bg-white hover:bg-slate-50/80 transition-colors dark:bg-slate-900 dark:hover:bg-slate-800/80">
                  <td className="px-4 md:px-6 py-2 md:py-2.5 text-slate-400">786</td>
                  <td className="px-4 md:px-6 py-2 md:py-2.5 text-indigo-600 font-semibold dark:text-indigo-400">lead_source</td>
                  <td className="px-4 md:px-6 py-2 md:py-2.5 text-slate-500 truncate max-w-[150px] md:max-w-xs" title="Met at WebSummit 2023 at the AI pavilion">Met at WebSummit 2023...</td>
                  <td className="px-4 md:px-6 py-2 md:py-2.5 text-slate-900 dark:text-slate-50 truncate max-w-[150px] md:max-w-xs" title="CONFERENCE">CONFERENCE</td>
                  <td className="px-4 md:px-6 py-2 md:py-2.5 text-right font-bold text-green-600 dark:text-green-500">0.95</td>
                </tr>
                {processingState.status === 'running' && (
                  <tr className="bg-indigo-50/30 animate-pulse dark:bg-indigo-900/20">
                    <td className="px-4 md:px-6 py-2 md:py-2.5 text-slate-400">787</td>
                    <td className="px-4 md:px-6 py-2 md:py-2.5 text-indigo-600 font-semibold dark:text-indigo-400">job_title</td>
                    <td className="px-4 md:px-6 py-2 md:py-2.5 text-slate-500 italic">Scanning raw metadata fields...</td>
                    <td className="px-4 md:px-6 py-2 md:py-2.5 text-slate-300 dark:text-slate-600">...</td>
                    <td className="px-4 md:px-6 py-2 md:py-2.5 text-right font-bold text-slate-300 dark:text-slate-600">--</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border-t border-slate-100 p-3 md:p-4 bg-slate-50 shrink-0 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Overall Migration Progress</span>
            <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-50">{processingState.processedRows} / {processingState.totalRows} Rows</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden dark:bg-slate-800">
            <div className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300" style={{ width: `${percentage}%` }}></div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 shrink-0">
        <div className="text-center p-2 bg-white rounded-lg border border-slate-100 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Success</p>
          <p className="text-lg md:text-xl font-mono text-green-600 dark:text-green-500">{processingState.processedRows}</p>
        </div>
        <div className="text-center p-2 bg-white rounded-lg border border-slate-100 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Warnings</p>
          <p className="text-lg md:text-xl font-mono text-amber-500">12</p>
        </div>
        <div className="text-center p-2 bg-white rounded-lg border border-slate-100 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Failures</p>
          <p className="text-lg md:text-xl font-mono text-rose-500">0</p>
        </div>
        <div className="text-center p-2 bg-white rounded-lg border border-slate-100 shadow-sm dark:bg-slate-900 dark:border-slate-800 hidden sm:block">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Records/Sec</p>
          <p className="text-lg md:text-xl font-mono text-slate-700 dark:text-slate-300">4.2</p>
        </div>
        <div className="text-center p-2 bg-white rounded-lg border border-slate-100 shadow-sm dark:bg-slate-900 dark:border-slate-800 hidden sm:block md:block col-span-2 sm:col-span-1 md:col-span-1">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Total Cost</p>
          <p className="text-lg md:text-xl font-mono text-slate-700 dark:text-slate-300">${(processingState.processedRows * 0.0006).toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
