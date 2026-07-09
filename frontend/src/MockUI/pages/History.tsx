import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { sampleHistory } from '../data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Download, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';

export default function HistoryPage() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Import History</h1>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">View your past CSV imports and download results.</p>
      </div>

      <Card className="flex-1 flex flex-col min-h-[400px]">
        <div className="flex-1 overflow-auto">
          <div className="min-w-max">
            <Table>
              <TableHeader className="sticky top-0 bg-white dark:bg-slate-950 shadow-sm z-10">
                <TableRow>
                  <TableHead className="whitespace-nowrap px-4">File Name</TableHead>
                  <TableHead className="whitespace-nowrap px-4">Date</TableHead>
                  <TableHead className="whitespace-nowrap px-4">Status</TableHead>
                  <TableHead className="text-right whitespace-nowrap px-4">Rows Imported</TableHead>
                  <TableHead className="w-[50px] px-4"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium whitespace-nowrap px-4">{item.fileName}</TableCell>
                    <TableCell className="whitespace-nowrap px-4">{format(new Date(item.date), 'MMM d, yyyy h:mm a')}</TableCell>
                    <TableCell className="px-4">
                      <Badge variant={
                        item.status === 'Success' ? 'default' : 
                        item.status === 'Partial' ? 'secondary' : 'destructive'
                      }>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-slate-500 whitespace-nowrap px-4">
                      {item.importedRows} / {item.totalRows}
                    </TableCell>
                    <TableCell className="px-4">
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
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
