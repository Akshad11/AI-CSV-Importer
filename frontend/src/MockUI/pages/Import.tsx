import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { UploadCloud, FileType, CheckCircle2, X } from 'lucide-react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { CSVFile } from '../types';

export default function ImportPage() {
  const [isDragging, setIsDragging] = useState(false);
  const { uploadFile, setUploadFile } = useStore();
  const navigate = useNavigate();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // In a real app, we'd parse the CSV here
    const mockFile: CSVFile = {
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      rows: 1250,
      columns: 8,
      status: 'pending',
      uploadDate: new Date().toISOString(),
    };
    
    setUploadFile(mockFile);
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">New Import</h1>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">Upload a CSV file to map and import into your CRM.</p>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Upload File</CardTitle>
              <CardDescription>Drag and drop your CSV file here, or click to browse.</CardDescription>
            </CardHeader>
            <CardContent>
              {!uploadFile ? (
                <div
                  className={`border-2 border-dashed rounded-xl p-8 md:p-12 text-center transition-all ${
                    isDragging 
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' 
                      : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <UploadCloud className={`mx-auto h-10 w-10 md:h-12 md:w-12 mb-4 ${isDragging ? 'text-indigo-500' : 'text-slate-400'}`} />
                  <h3 className="text-base md:text-lg font-medium mb-1">Drop your CSV here</h3>
                  <p className="text-xs md:text-sm text-slate-500 mb-6">Supports .csv files up to 50MB</p>
                  
                  <div className="relative">
                    <input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept=".csv"
                      onChange={handleFileInput}
                    />
                    <Button variant="outline" className="pointer-events-none w-full sm:w-auto">
                      Browse Files
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 md:p-6 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <FileType className="h-5 w-5 md:h-6 md:w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-slate-900 dark:text-slate-50 truncate">{uploadFile.name}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs md:text-sm text-slate-500">
                          <span>{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</span>
                          <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                          <span>~{uploadFile.rows} rows</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setUploadFile(null)} className="absolute top-4 right-4 sm:static sm:top-auto sm:right-auto shrink-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <Button className="w-full sm:w-auto flex-1" onClick={() => navigate('/preview')}>
                      Continue to Mapping
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Import Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="mt-0.5 shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Automatic Mapping</h4>
                    <p className="text-xs md:text-sm text-slate-500 mt-1">Our AI analyzes your columns and automatically maps them to CRM fields.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="mt-0.5 shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Smart Data Cleaning</h4>
                    <p className="text-xs md:text-sm text-slate-500 mt-1">Names are capitalized, phone numbers formatted, and emails validated automatically.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="mt-0.5 shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Duplicate Detection</h4>
                    <p className="text-xs md:text-sm text-slate-500 mt-1">Fuzzy matching prevents creating duplicate records for the same person.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
