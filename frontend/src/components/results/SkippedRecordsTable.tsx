'use client';

import React, { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from '@tanstack/react-table';
import { useResultsStore } from '../../store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { Search, ChevronLeft, ChevronRight, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { SkippedRecord } from '../../types';

export function SkippedRecordsTable() {
  const { skippedRecords } = useResultsStore();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRowExpand = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const columns = useMemo<ColumnDef<SkippedRecord>[]>(() => [
    {
      accessorKey: 'rowNumber',
      header: 'Row',
      cell: (info) => <span className="font-mono text-xs text-muted-foreground">#{info.getValue() as number}</span>,
    },
    {
      accessorKey: 'reason',
      header: 'Skip Reason',
      cell: (info) => (
        <span className="font-bold text-foreground flex items-center gap-1.5">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          {info.getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: 'validationIssue',
      header: 'Issue Details',
      cell: (info) => <span className="text-xs text-muted-foreground leading-normal">{info.getValue() as string}</span>,
    },
    {
      id: 'actions',
      header: 'Raw Cells',
      cell: (info) => {
        const row = info.row.original;
        const isExpanded = !!expandedRows[row.id];
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleRowExpand(row.id)}
            className="h-8 text-xs gap-1 hover:bg-accent"
          >
            {isExpanded ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                Hide Cell Map
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" />
                Inspect Map
              </>
            )}
          </Button>
        );
      },
    },
  ], [expandedRows]);

  const table = useReactTable({
    data: skippedRecords,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="flex flex-col gap-4 w-full select-none font-sans">
      {/* Filtering Header bar */}
      <div className="flex bg-card p-4 rounded-2xl border border-border shadow-sm items-center justify-between">
        <div className="w-full sm:w-80">
          <Input
            icon={<Search className="h-4.5 w-4.5" />}
            placeholder="Search skipped reports..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-9.5 text-xs bg-secondary"
          />
        </div>
        <span className="text-xs text-muted-foreground font-medium shrink-0">
          Isolated {skippedRecords.length} records
        </span>
      </div>

      {/* Main Table view */}
      <div className="relative overflow-x-auto w-full select-none rounded-2xl border border-border bg-card shadow-sm">
        <Table className="border-0">
          <TableHeader className="bg-muted border-b border-border">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-0 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="px-4 py-3 text-xs font-semibold text-muted-foreground"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => {
                const rowObj = row.original;
                const isExpanded = !!expandedRows[rowObj.id];

                return (
                  <React.Fragment key={rowObj.id}>
                    <TableRow>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-4 py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* Expandable inspector map row */}
                    {isExpanded && (
                      <TableRow className="bg-muted/40">
                        <TableCell colSpan={columns.length} className="p-4 border-b border-border">
                          <div className="p-4 rounded-xl bg-zinc-950 text-zinc-400 border border-zinc-900 overflow-x-auto font-mono text-xs max-w-full">
                            <span className="text-[10px] text-muted-foreground font-bold block mb-2 select-none uppercase tracking-wider">
                              Raw Parsed Cell Map Values
                            </span>
                            <pre className="text-zinc-300 leading-normal">
                              {JSON.stringify(rowObj.originalRow, null, 2)}
                            </pre>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-44 text-center text-muted-foreground italic">
                  Excellent! Zero skipped items during this run.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between py-2 px-1 text-xs select-none shrink-0 font-sans">
          <span className="text-muted-foreground font-medium">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} (Total {skippedRecords.length} records)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-8 px-2.5 rounded-lg border-border"
            >
              <ChevronLeft className="h-4 w-4 mr-0.5" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-8 px-2.5 rounded-lg border-border"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-0.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
export default SkippedRecordsTable;
