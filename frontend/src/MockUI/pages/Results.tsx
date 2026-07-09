import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { sampleResults, sampleStats, sampleSkipped } from '../data';
import { Button } from '../components/ui/button';
import { Download, Copy, AlertTriangle, CheckCircle2, XCircle, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';

export default function ResultsPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Import Results</h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">Review successfully processed records and skipped items.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none"><Copy className="w-4 h-4 mr-2" /> Copy JSON</Button>
          <Button className="flex-1 sm:flex-none"><Download className="w-4 h-4 mr-2" /> Export</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-slate-900 dark:text-slate-50" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">Imported</p>
                <p className="text-xl md:text-2xl font-bold">{sampleStats.imported}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">Skipped</p>
                <p className="text-xl md:text-2xl font-bold">{sampleStats.skipped}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-500" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">Failed</p>
                <p className="text-xl md:text-2xl font-bold">{sampleStats.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 md:p-6 h-full">
            <div className="flex flex-col justify-center h-full">
              <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">AI Confidence</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-xl md:text-2xl font-bold">{sampleStats.averageConfidence}%</p>
                <span className="text-[10px] md:text-xs text-green-600 dark:text-green-500 font-medium">Avg</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="flex-1 flex flex-col min-h-[400px]">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input type="search" placeholder="Search records..." className="pl-9 w-full" />
          </div>
          <Button variant="outline" size="sm" className="w-full sm:w-auto">Filter</Button>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="min-w-max">
            <Table>
              <TableHeader className="sticky top-0 bg-white dark:bg-slate-950 shadow-sm z-10">
                <TableRow>
                  <TableHead className="whitespace-nowrap px-4">Name</TableHead>
                  <TableHead className="whitespace-nowrap px-4">Email</TableHead>
                  <TableHead className="whitespace-nowrap px-4">Company</TableHead>
                  <TableHead className="whitespace-nowrap px-4">Status</TableHead>
                  <TableHead className="text-right whitespace-nowrap px-4">Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleResults.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium whitespace-nowrap px-4">{record.firstName} {record.lastName}</TableCell>
                    <TableCell className="px-4">{record.email}</TableCell>
                    <TableCell className="px-4 max-w-[150px] truncate" title={record.company}>{record.company}</TableCell>
                    <TableCell className="px-4">
                      <Badge variant={record.status === 'New' ? 'default' : 'secondary'}>
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-4">
                      <span className="text-green-600 dark:text-green-400 text-sm font-medium">{record.confidence}%</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>
    </div>
  );
}
