'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, ChevronRight, MoreHorizontal, 
  ArrowUpDown, Eye, EyeOff, Maximize2, Minimize2,
  Columns, Settings, Download, Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMediaQuery } from '@/hooks/use-media-query';
import { motion, AnimatePresence } from 'framer-motion';
import type { FieldType } from '../fields/field-types';
import { FieldRenderer } from '../fields/field-renderer';

interface Column {
  id: string;
  name: string;
  type: FieldType;
  width?: number;
  visible?: boolean;
  frozen?: boolean;
  sortable?: boolean;
  resizable?: boolean;
}

interface Row {
  id: string;
  [key: string]: any;
}

interface ResponsiveTableProps {
  columns: Column[];
  rows: Row[];
  onCellEdit?: (rowId: string, columnId: string, value: any) => void;
  onRowSelect?: (rowIds: string[]) => void;
  onSort?: (columnId: string, direction: 'asc' | 'desc') => void;
  onColumnResize?: (columnId: string, width: number) => void;
  onColumnVisibilityChange?: (columnId: string, visible: boolean) => void;
  selectedRows?: string[];
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  className?: string;
}

type ViewMode = 'table' | 'cards' | 'list';

export function ResponsiveTable({
  columns,
  rows,
  onCellEdit,
  onRowSelect,
  onSort,
  onColumnResize,
  onColumnVisibilityChange,
  selectedRows = [],
  sortColumn,
  sortDirection,
  className,
}: ResponsiveTableProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.filter(c => c.visible !== false).map(c => c.id))
  );
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  
  const isMobile = useMediaQuery('(max-width: 640px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');
  
  // Auto-switch to card view on mobile
  useEffect(() => {
    if (isMobile) {
      setViewMode('cards');
    } else if (isTablet) {
      setViewMode('list');
    } else {
      setViewMode('table');
    }
  }, [isMobile, isTablet]);
  
  const handleColumnResize = (columnId: string, deltaX: number) => {
    const currentWidth = columnWidths[columnId] || 150;
    const newWidth = Math.max(50, Math.min(500, currentWidth + deltaX));
    
    setColumnWidths(prev => ({
      ...prev,
      [columnId]: newWidth,
    }));
    
    onColumnResize?.(columnId, newWidth);
  };
  
  const toggleRowExpansion = (rowId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };
  
  const toggleColumnVisibility = (columnId: string) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      onColumnVisibilityChange?.(columnId, next.has(columnId));
      return next;
    });
  };
  
  const handleRowSelection = (rowId: string, selected: boolean) => {
    const newSelection = selected
      ? [...selectedRows, rowId]
      : selectedRows.filter(id => id !== rowId);
    onRowSelect?.(newSelection);
  };
  
  const selectAllRows = (selected: boolean) => {
    onRowSelect?.(selected ? rows.map(r => r.id) : []);
  };
  
  // Table View
  const TableView = () => (
    <div className="relative overflow-auto">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10 bg-background border-b">
          <tr>
            <th className="w-12 p-2">
              <Checkbox
                checked={selectedRows.length === rows.length}
                indeterminate={selectedRows.length > 0 && selectedRows.length < rows.length}
                onCheckedChange={selectAllRows}
              />
            </th>
            {columns.filter(c => visibleColumns.has(c.id)).map(column => (
              <th
                key={column.id}
                className="relative text-left p-2 font-medium"
                style={{ width: columnWidths[column.id] || column.width || 150 }}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{column.name}</span>
                  <div className="flex items-center gap-1">
                    {column.sortable !== false && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => onSort?.(column.id, 
                          sortColumn === column.id && sortDirection === 'asc' ? 'desc' : 'asc'
                        )}
                      >
                        <ArrowUpDown className={cn(
                          "h-3 w-3",
                          sortColumn === column.id && "text-primary"
                        )} />
                      </Button>
                    )}
                  </div>
                </div>
                {column.resizable !== false && (
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/20"
                    onMouseDown={(e) => {
                      setIsResizing(true);
                      setResizingColumn(column.id);
                      const startX = e.clientX;
                      const startWidth = columnWidths[column.id] || column.width || 150;
                      
                      const handleMouseMove = (e: MouseEvent) => {
                        const deltaX = e.clientX - startX;
                        handleColumnResize(column.id, deltaX);
                      };
                      
                      const handleMouseUp = () => {
                        setIsResizing(false);
                        setResizingColumn(null);
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };
                      
                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }}
                  />
                )}
              </th>
            ))}
            <th className="w-12 p-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Settings className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {columns.map(column => (
                    <DropdownMenuItem
                      key={column.id}
                      onClick={() => toggleColumnVisibility(column.id)}
                    >
                      {visibleColumns.has(column.id) ? (
                        <Eye className="h-4 w-4 mr-2" />
                      ) : (
                        <EyeOff className="h-4 w-4 mr-2" />
                      )}
                      {column.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={row.id}
              className={cn(
                "border-b hover:bg-gray-50 dark:hover:bg-gray-800",
                selectedRows.includes(row.id) && "bg-blue-50 dark:bg-blue-950"
              )}
            >
              <td className="p-2">
                <Checkbox
                  checked={selectedRows.includes(row.id)}
                  onCheckedChange={(checked) => 
                    handleRowSelection(row.id, checked as boolean)
                  }
                />
              </td>
              {columns.filter(c => visibleColumns.has(c.id)).map(column => (
                <td key={column.id} className="p-2">
                  <FieldRenderer
                    type={column.type}
                    value={row[column.id]}
                    onChange={onCellEdit ? (value) => onCellEdit(row.id, column.id, value) : undefined}
                    options={{}}
                  />
                </td>
              ))}
              <td className="p-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem>Duplicate</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  
  // Card View (Mobile)
  const CardView = () => (
    <div className="grid gap-4 p-4 sm:grid-cols-2">
      {rows.map(row => (
        <motion.div
          key={row.id}
          layout
          className={cn(
            "p-4 rounded-lg border bg-card",
            selectedRows.includes(row.id) && "ring-2 ring-primary"
          )}
        >
          <div className="flex items-start justify-between mb-3">
            <Checkbox
              checked={selectedRows.includes(row.id)}
              onCheckedChange={(checked) => 
                handleRowSelection(row.id, checked as boolean)
              }
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="space-y-2">
            {columns.filter(c => visibleColumns.has(c.id)).slice(0, 4).map(column => (
              <div key={column.id} className="flex justify-between items-start gap-2">
                <span className="text-sm text-muted-foreground">{column.name}:</span>
                <div className="flex-1 text-right">
                  <FieldRenderer
                    type={column.type}
                    value={row[column.id]}
                    onChange={onCellEdit ? (value) => onCellEdit(row.id, column.id, value) : undefined}
                    options={{}}
                    compact
                  />
                </div>
              </div>
            ))}
          </div>
          
          {columns.filter(c => visibleColumns.has(c.id)).length > 4 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2"
              onClick={() => toggleRowExpansion(row.id)}
            >
              {expandedRows.has(row.id) ? (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Show more
                </>
              )}
            </Button>
          )}
          
          <AnimatePresence>
            {expandedRows.has(row.id) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-2 space-y-2 overflow-hidden"
              >
                {columns.filter(c => visibleColumns.has(c.id)).slice(4).map(column => (
                  <div key={column.id} className="flex justify-between items-start gap-2">
                    <span className="text-sm text-muted-foreground">{column.name}:</span>
                    <div className="flex-1 text-right">
                      <FieldRenderer
                        type={column.type}
                        value={row[column.id]}
                        onChange={onCellEdit ? (value) => onCellEdit(row.id, column.id, value) : undefined}
                        options={{}}
                        compact
                      />
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
  
  // List View (Tablet)
  const ListView = () => (
    <div className="divide-y">
      {rows.map(row => (
        <div
          key={row.id}
          className={cn(
            "p-4 hover:bg-gray-50 dark:hover:bg-gray-800",
            selectedRows.includes(row.id) && "bg-blue-50 dark:bg-blue-950"
          )}
        >
          <div className="flex items-start gap-3">
            <Checkbox
              checked={selectedRows.includes(row.id)}
              onCheckedChange={(checked) => 
                handleRowSelection(row.id, checked as boolean)
              }
            />
            
            <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2">
              {columns.filter(c => visibleColumns.has(c.id)).map(column => (
                <div key={column.id} className="flex items-start gap-2">
                  <span className="text-sm font-medium text-muted-foreground min-w-[100px]">
                    {column.name}:
                  </span>
                  <div className="flex-1">
                    <FieldRenderer
                      type={column.type}
                      value={row[column.id]}
                      onChange={onCellEdit ? (value) => onCellEdit(row.id, column.id, value) : undefined}
                      options={{}}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  );
  
  return (
    <div className={cn("w-full", className)}>
      {/* View Mode Selector */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {selectedRows.length} of {rows.length} selected
          </span>
        </div>
        
        <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="table">Table</SelectItem>
            <SelectItem value="cards">Cards</SelectItem>
            <SelectItem value="list">List</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Content */}
      <ScrollArea className="w-full">
        {viewMode === 'table' && <TableView />}
        {viewMode === 'cards' && <CardView />}
        {viewMode === 'list' && <ListView />}
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}