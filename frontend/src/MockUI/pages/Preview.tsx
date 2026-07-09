import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { sampleCSV } from '../data';
import { useStore } from '../store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

export default function PreviewPage() {
  const navigate = useNavigate();
  const { uploadFile, updateProcessingState } = useStore();

  const handleConfirm = () => {
    updateProcessingState({
      isProcessing: true,
      status: 'running',
      totalBatches: 22,
      currentBatch: 1,
      totalRows: uploadFile?.rows || 1200,
      processedRows: 0,
      estimatedTimeRemaining: 45
    });
    navigate('/processing');
  };

  const columns = Object.keys(sampleCSV[0]?.data || {});

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Preview Data</h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">Review the first 50 rows before confirming import.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => navigate('/import')}>Cancel</Button>
          <Button className="flex-1 sm:flex-none" onClick={handleConfirm}>Confirm Import</Button>
        </div>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-4 flex-1">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>File details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">File</span>
              <span className="font-medium truncate max-w-[120px] md:max-w-[160px]" title={uploadFile?.name || 'leads.csv'}>{uploadFile?.name || 'leads.csv'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Rows</span>
              <span className="font-medium">{uploadFile?.rows || 1200}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Columns</span>
              <span className="font-medium">{uploadFile?.columns || 8}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Est. Time</span>
              <span className="font-medium">~ 45s</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">AI Cost</span>
              <span className="font-medium text-green-600 dark:text-green-400">$0.12</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-3 flex flex-col min-h-[400px] h-[50vh] md:h-auto md:min-h-0">
          <div className="flex-1 overflow-auto p-0">
            <div className="min-w-max">
              <Table>
                <TableHeader className="sticky top-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur z-10 border-b border-slate-200 dark:border-slate-800">
                  <TableRow>
                    <TableHead className="w-[50px] whitespace-nowrap">#</TableHead>
                    {columns.map(col => (
                      <TableHead key={col} className="whitespace-nowrap px-4">{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleCSV.map((row, i) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-slate-500">{i + 1}</TableCell>
                      {columns.map(col => (
                        <TableCell key={col} className="whitespace-nowrap px-4 max-w-[200px] truncate" title={row.data[col]}>{row.data[col]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
