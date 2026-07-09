import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { sampleStats } from '../data';
import { UploadCloud, CheckCircle2, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">Welcome back. Here's what's happening with your imports.</p>
        </div>
        <Button onClick={() => navigate('/import')} className="w-full sm:w-auto">
          <UploadCloud className="w-4 h-4 mr-2" />
          New Import
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Imported</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sampleStats.imported}</div>
            <p className="text-xs text-slate-500 mt-1">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skipped Rows</CardTitle>
            <AlertTriangle className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sampleStats.skipped}</div>
            <p className="text-xs text-slate-500 mt-1">Requires manual review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Imports</CardTitle>
            <XCircle className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sampleStats.failed}</div>
            <p className="text-xs text-slate-500 mt-1">Check validation errors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Confidence</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-slate-500"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sampleStats.averageConfidence}%</div>
            <p className="text-xs text-slate-500 mt-1">Average match accuracy</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2 flex-1">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="hidden sm:block w-2 h-2 rounded-full bg-slate-900 dark:bg-slate-50"></div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">Imported leads_q3.csv</p>
                    <p className="text-xs text-slate-500">1,250 rows processed successfully.</p>
                  </div>
                  <div className="text-xs text-slate-500">2h ago</div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4 text-sm" onClick={() => navigate('/history')}>
              View all history <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">AI Mapping Suggestions</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center min-h-[200px]">
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-6 w-6 text-slate-500"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              </div>
              <h3 className="font-semibold text-base md:text-lg">No pending suggestions</h3>
              <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-xs mx-auto">Upload a new CSV to get AI mapping recommendations.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
