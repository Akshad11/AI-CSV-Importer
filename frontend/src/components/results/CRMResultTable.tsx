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
import { cn } from '../../lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal, EyeOff } from 'lucide-react';
import { formatPercentage } from '../../utils';

export function CRMResultTable() {
  const { crmRecords } = useResultsStore();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Define TanStack Columns
  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'rowNumber',
      header: 'Row',
      cell: (info) => <span className="font-mono text-xs text-muted-foreground">#{info.getValue() as number}</span>,
    },
    {
      accessorKey: 'created_at',
      header: 'Created At',
      cell: (info) => <span className="font-mono text-xs truncate block max-w-[130px]" title={info.getValue() as string}>{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: (info) => (
        <span className="font-semibold text-foreground truncate block max-w-[120px]" title={info.getValue() as string}>
          {info.getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email Address',
      cell: (info) => <span className="font-mono text-xs select-all truncate block max-w-[160px]" title={info.getValue() as string}>{info.getValue() as string || 'N/A'}</span>,
    },
    {
      accessorKey: 'company',
      header: 'Company',
      cell: (info) => <span className="truncate max-w-[110px] block" title={info.getValue() as string}>{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'mobile_without_country_code',
      header: 'Mobile',
      cell: (info) => {
        const row = info.row.original;
        const code = row.country_code || '';
        const phone = info.getValue() as string || '';
        return <span className="font-mono text-xs truncate block" title={code + phone}>{code} {phone || 'N/A'}</span>;
      },
    },
    {
      accessorKey: 'data_source',
      header: 'Source',
      cell: (info) => <span className="text-xs truncate block max-w-[110px] font-medium" title={info.getValue() as string}>{info.getValue() as string || 'N/A'}</span>,
    },
    {
      accessorKey: 'crm_status',
      header: 'Status',
      cell: (info) => {
        const val = info.getValue() as string;
        let variant: 'success' | 'warning' | 'destructive' | 'info' = 'info';
        if (val === 'SALE_DONE') variant = 'success';
        else if (val === 'GOOD_LEAD_FOLLOW_UP') variant = 'info';
        else if (val === 'DID_NOT_CONNECT') variant = 'warning';
        else if (val === 'BAD_LEAD') variant = 'destructive';

        return (
          <Badge variant={variant}>
            {val.replace(/_/g, ' ')}
          </Badge>
        );
      },
      filterFn: (row, columnId, filterValue) => {
        if (filterValue === 'all') return true;
        return row.getValue(columnId) === filterValue;
      },
    },
    {
      accessorKey: 'confidence',
      header: 'Certainty',
      cell: (info) => {
        const val = info.getValue() as number;
        return (
          <span className={cn(
            'font-bold font-mono text-xs',
            val > 90 ? 'text-primary' : 'text-warning'
          )}>
            {formatPercentage(val)}
          </span>
        );
      },
    },
  ], []);

  // Filter records based on Status selection
  const filteredData = useMemo(() => {
    if (statusFilter === 'all') return crmRecords;
    return crmRecords.filter((r) => r.crm_status === statusFilter);
  }, [crmRecords, statusFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
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
      {/* Filtering Actions bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between bg-card p-4 rounded-2xl border border-border shadow-sm">
        <div className="w-full sm:w-80">
          <Input
            icon={<Search className="h-4.5 w-4.5" />}
            placeholder="Search lead records..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-9.5 text-xs bg-secondary"
          />
        </div>

        {/* Quick status filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl bg-muted p-1 border border-border text-xs overflow-x-auto max-w-full">
            <button
              onClick={() => setStatusFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap',
                statusFilter === 'all'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              All Leads
            </button>
            <button
              onClick={() => setStatusFilter('GOOD_LEAD_FOLLOW_UP')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap',
                statusFilter === 'GOOD_LEAD_FOLLOW_UP'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Follow-Up
            </button>
            <button
              onClick={() => setStatusFilter('DID_NOT_CONNECT')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap',
                statusFilter === 'DID_NOT_CONNECT'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              No Connect
            </button>
            <button
              onClick={() => setStatusFilter('BAD_LEAD')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap',
                statusFilter === 'BAD_LEAD'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Bad Lead
            </button>
            <button
              onClick={() => setStatusFilter('SALE_DONE')}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap',
                statusFilter === 'SALE_DONE'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Sale Done
            </button>
          </div>
        </div>
      </div>

      {/* Main Table grid */}
      <div className="relative overflow-x-auto w-full select-none rounded-2xl border border-border bg-card shadow-sm">
        <Table className="border-0">
          <TableHeader className="bg-muted border-b border-border">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-0 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="px-4 py-3 text-xs font-semibold text-muted-foreground cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1.5">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc' && ' ▴'}
                      {header.column.getIsSorted() === 'desc' && ' ▾'}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-44 text-center text-muted-foreground italic">
                  No extracted CRM records matching query parameters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination control row */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between py-2 px-1 text-xs select-none shrink-0 font-sans">
          <span className="text-muted-foreground font-medium">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} (Total {filteredData.length} records)
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
export default CRMResultTable;
