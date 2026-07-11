'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useResultsStore } from '../store';
import { UploadCloud, CheckCircle2, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';
import { formatIsoDateOnly } from '../utils';

export default function DashboardPage() {
  const router = useRouter();
  const { history } = useResultsStore();

  const totalImported = history.reduce(
    (acc, curr) => (curr.status === 'Success' || curr.status === 'Partial' ? acc + curr.importedRows : acc),
    0
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Overview</h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">
            Welcome back. Monitor lead ingestion pipelines and AI status.
          </p>
        </div>
        <button
          onClick={() => router.push('/import')}
          className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all"
        >
          <UploadCloud className="w-4 h-4 mr-2" />
          New Import
        </button>
      </div>

      {/* Grid Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-card rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Total Imported</span>
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight">{totalImported}</div>
            <p className="text-xs text-muted-foreground mt-1">Across historical files</p>
          </div>
        </div>

        <div className="p-6 bg-card rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Skipped Rows</span>
            <AlertTriangle className="h-5 w-5 text-warning" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight">24</div>
            <p className="text-xs text-muted-foreground mt-1">Requires manual review</p>
          </div>
        </div>

        <div className="p-6 bg-card rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Failed Imports</span>
            <XCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight">5</div>
            <p className="text-xs text-muted-foreground mt-1">Check validation errors</p>
          </div>
        </div>

        <div className="p-6 bg-card rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">AI Accuracy</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-5 w-5 text-success"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight">98.2%</div>
            <p className="text-xs text-muted-foreground mt-1">Fuzzy matching accuracy</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="p-6 bg-card rounded-2xl border border-border shadow-sm flex flex-col justify-between min-h-[300px]">
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4">Recent Ingestion Activity</h2>
            <div className="space-y-4">
              {history.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${
                      item.status === 'Success' ? 'bg-success' : item.status === 'Partial' ? 'bg-warning' : 'bg-destructive'
                    }`} />
                    <div>
                      <p className="text-sm font-semibold">{item.fileName}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        Imported {item.importedRows} / {item.totalRows} rows
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">{formatIsoDateOnly(item.date)}</span>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => router.push('/import')}
            className="w-full mt-4 py-2 px-3 inline-flex items-center justify-center text-xs font-semibold rounded-lg bg-secondary hover:bg-accent border border-border text-foreground transition-colors"
          >
            Start a new import pipeline <ArrowRight className="w-3.5 h-3.5 ml-2" />
          </button>
        </div>

        {/* AI Mapping Tips */}
        <div className="p-6 bg-card rounded-2xl border border-border shadow-sm flex flex-col items-center justify-center min-h-[300px] text-center">
          <div className="p-3 bg-muted text-muted-foreground rounded-full mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-6 w-6"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          </div>
          <h3 className="font-bold text-foreground">No pending AI suggestions</h3>
          <p className="text-xs md:text-sm text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
            Upload a raw CSV contact file to trigger the intelligence mapper mapping suggestions.
          </p>
        </div>
      </div>
    </div>
  );
}
