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
import { usePreviewStore, useUploadStore } from '../../store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select } from '../ui/select';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Search, ChevronLeft, ChevronRight, Eye, Settings } from 'lucide-react';

const crmFieldOptions = [
  { value: '', label: 'Unmapped' },
  { value: 'created_at', label: 'Created At' },
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'country_code', label: 'Country Code' },
  { value: 'mobile_without_country_code', label: 'Mobile' },
  { value: 'company', label: 'Company' },
  { value: 'city', label: 'City' },
  { value: 'state', label: 'State' },
  { value: 'country', label: 'Country' },
  { value: 'lead_owner', label: 'Lead Owner' },
  { value: 'crm_status', label: 'CRM Status' },
  { value: 'crm_note', label: 'CRM Note' },
  { value: 'data_source', label: 'Data Source' },
  { value: 'possession_time', label: 'Possession Time' },
  { value: 'description', label: 'Description' },
];

export function CSVPreviewTable() {
  const { fileMeta } = useUploadStore();
  const { previewRows, columnMappings, updateColumnMapping } = usePreviewStore();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

  const headers = fileMeta?.headers || [];

  // Table Columns construction
  const columns = useMemo<ColumnDef<any>[]>(() => {
    return headers.map((header) => ({
      accessorKey: header,
      header: () => (
        <div className="flex flex-col gap-2 py-1.5 min-w-[140px] text-left">
          <span className="font-semibold text-foreground truncate select-all block" title={header}>
            {header}
          </span>
          <Select
            options={crmFieldOptions}
            value={columnMappings[header] || ''}
            onChange={(e) => updateColumnMapping(header, e.target.value)}
            className="h-8 text-xs font-sans border-border"
          />
        </div>
      ),
      cell: (info) => {
        const value = info.getValue() as string;
        return (
          <span className="text-xs font-mono font-medium block truncate max-w-[200px]" title={value}>
            {value || <span className="text-muted-foreground/60 italic">empty</span>}
          </span>
        );
      },
    }));
  }, [headers, columnMappings, updateColumnMapping]);

  // Map rows data for table — show first 50 rows in UI preview; all rows are available to the simulator
  const tableData = useMemo(() => {
    return previewRows.slice(0, 50).map((r) => r.data);
  }, [previewRows]);

  const table = useReactTable({
    data: tableData,
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
    <div className="flex flex-col gap-4 w-full">
      {/* Table search & Actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between bg-card p-4 rounded-2xl border border-border shadow-sm">
        <div className="w-full sm:w-80">
          <Input
            icon={<Search className="h-4.5 w-4.5" />}
            placeholder="Search preview rows..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-9.5 text-xs bg-secondary"
          />
        </div>

        {/* Column Visibility Selector dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-muted-foreground font-medium font-sans">
            Showing {table.getFilteredRowModel().rows.length} preview rows
          </span>
        </div>
      </div>

      {/* TanStack Table Element */}
      <div className="relative overflow-x-auto w-full select-none rounded-2xl border border-border bg-card shadow-sm min-h-[300px]">
        <Table className="border-0">
          <TableHeader className="bg-muted sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-border hover:bg-transparent">
                <TableHead className="w-[50px] text-center font-mono text-[10px] text-muted-foreground">#</TableHead>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="px-4 align-top py-3">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell className="text-center font-mono text-xs text-muted-foreground">
                    {row.index + 1}
                  </TableCell>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={headers.length + 1} className="h-40 text-center text-muted-foreground">
                  No preview rows matching query.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Local Pagination Controls */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between py-2 px-1 select-none shrink-0 font-sans text-xs">
          <span className="text-muted-foreground font-medium">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
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
export default CSVPreviewTable;
