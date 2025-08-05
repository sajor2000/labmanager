"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Plus,
  Download,
  Filter,
  Search,
  Trash2,
  Edit,
  Eye,
  Copy,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StudyEditModal } from "./study-edit-modal";
import { StudyFilters } from "./study-filters";
import { useServerAction } from "@/hooks/use-server-action";
import { deleteStudy, updateStudy } from "@/app/actions/study-actions";
import { showToast } from "@/components/ui/toast";
import { LoadingButton } from "@/components/ui/loading-button";
import { useConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface StudyData {
  id: string;
  title: string;
  oraNumber?: string | null;
  status: string;
  priority: string;
  studyType: string;
  fundingSource?: string | null;
  fundingDetails?: string | null;
  externalCollaborators?: string | null;
  dueDate?: Date | null;
  progress?: number;
  createdAt: Date;
  updatedAt: Date;
  bucket?: {
    id: string;
    title: string;
    color: string;
  };
  lab?: {
    id: string;
    name: string;
    shortName: string;
  };
  createdBy?: {
    id: string;
    name: string;
    initials: string;
  };
  assignees?: {
    user: {
      id: string;
      name: string;
      initials: string;
    };
  }[];
  _count?: {
    tasks: number;
  };
}

interface Props {
  studies: StudyData[];
  buckets: any[];
  users: any[];
}

export function StudiesDataTable({ studies, buckets, users }: Props) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    oraNumber: false,
    fundingDetails: false,
    externalCollaborators: false,
    createdAt: false,
  });
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [editingStudy, setEditingStudy] = useState<StudyData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { execute: executeDelete } = useServerAction(deleteStudy);
  const { execute: executeUpdate } = useServerAction(updateStudy);
  const { confirm, ConfirmationDialog } = useConfirmationDialog();

  // Define columns
  const columns: ColumnDef<StudyData>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const bucket = row.original.bucket;
        return (
          <div className="flex items-center space-x-2">
            {bucket && (
              <div
                className="w-1 h-8 rounded-full"
                style={{ backgroundColor: bucket.color }}
              />
            )}
            <div className="font-medium">{row.getValue("title")}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "oraNumber",
      header: "ORA Number",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.getValue("oraNumber") || "-"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const statusConfig = getStatusConfig(status);
        return (
          <Badge variant={statusConfig.variant as any}>
            {statusConfig.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const priority = row.getValue("priority") as string;
        const priorityConfig = getPriorityConfig(priority);
        return (
          <Badge variant={priorityConfig.variant as any}>
            {priorityConfig.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "studyType",
      header: "Type",
    },
    {
      accessorKey: "fundingSource",
      header: "Funding",
      cell: ({ row }) => (
        <span>{row.getValue("fundingSource") || "-"}</span>
      ),
    },
    {
      accessorKey: "fundingDetails",
      header: "Funding Details",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.getValue("fundingDetails") || "-"}
        </span>
      ),
    },
    {
      accessorKey: "externalCollaborators",
      header: "Collaborators",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.getValue("externalCollaborators") || "-"}
        </span>
      ),
    },
    {
      accessorKey: "progress",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Progress
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const progress = row.getValue("progress") as number || 0;
        return (
          <div className="flex items-center space-x-2">
            <div className="w-20 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
        );
      },
    },
    {
      id: "assignees",
      header: "Assignees",
      cell: ({ row }) => {
        const assignees = row.original.assignees || [];
        return (
          <div className="flex -space-x-2">
            {assignees.slice(0, 3).map((assignee, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-900"
                title={assignee.user.name}
              >
                {assignee.user.initials}
              </div>
            ))}
            {assignees.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-xs font-medium border-2 border-white dark:border-gray-900">
                +{assignees.length - 3}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "dueDate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Due Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = row.getValue("dueDate") as Date | null;
        if (!date) return <span className="text-muted-foreground">-</span>;
        
        const isOverdue = new Date(date) < new Date();
        return (
          <span className={cn(isOverdue && "text-red-600 font-medium")}>
            {format(new Date(date), "MMM d, yyyy")}
          </span>
        );
      },
    },
    {
      id: "tasks",
      header: "Tasks",
      cell: ({ row }) => {
        const taskCount = row.original._count?.tasks || 0;
        return (
          <Badge variant="secondary">
            {taskCount} {taskCount === 1 ? "task" : "tasks"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as Date;
        return format(new Date(date), "MMM d, yyyy");
      },
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Updated
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = row.getValue("updatedAt") as Date;
        return format(new Date(date), "MMM d, yyyy");
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const study = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => router.push(`/studies/${study.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setEditingStudy(study);
                  setIsEditModalOpen(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(study.id);
                  showToast({
                    type: "success",
                    title: "Copied",
                    message: "Study ID copied to clipboard",
                  });
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await confirm({
                    title: "Delete Study",
                    description: "Are you sure you want to delete this study? This action cannot be undone.",
                    confirmText: "Delete",
                    variant: "destructive",
                    onConfirm: async () => {
                      await executeDelete(study.id);
                      router.refresh();
                    },
                  });
                }}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: studies,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;

  const handleBulkDelete = async () => {
    await confirm({
      title: 'Delete Studies',
      description: `Are you sure you want to delete ${selectedRows.length} studies? This action cannot be undone.`,
      confirmText: 'Delete All',
      variant: 'destructive',
      onConfirm: async () => {
        for (const row of selectedRows) {
          await executeDelete(row.original.id);
        }
        setRowSelection({});
        router.refresh();
      },
    });
  };

  const handleBulkStatusUpdate = async (status: string) => {
    for (const row of selectedRows) {
      await executeUpdate({
        id: row.original.id,
        status: status as any,
      });
    }
    setRowSelection({});
    router.refresh();
  };

  const handleExport = () => {
    const data = table.getFilteredRowModel().rows.map((row) => ({
      Title: row.original.title,
      "ORA Number": row.original.oraNumber || "",
      Status: row.original.status,
      Priority: row.original.priority,
      Type: row.original.studyType,
      Funding: row.original.fundingSource || "",
      Progress: row.original.progress || 0,
      "Due Date": row.original.dueDate
        ? format(new Date(row.original.dueDate), "yyyy-MM-dd")
        : "",
      Tasks: row.original._count?.tasks || 0,
    }));

    const csv = [
      Object.keys(data[0]).join(","),
      ...data.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `studies-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Studies</h1>
          <p className="text-muted-foreground">
            Manage and track all research studies across your labs
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingStudy(null);
            setIsEditModalOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Study
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search studies..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {columnFilters.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {columnFilters.length}
              </Badge>
            )}
          </Button>
          {selectedRows.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {selectedRows.length} selected
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Bulk Actions
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Status Update</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => handleBulkStatusUpdate("PLANNING")}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Planning
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleBulkStatusUpdate("DATA_COLLECTION")}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Data Collection
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleBulkStatusUpdate("ON_HOLD")}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Mark as On Hold
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleBulkDelete}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <LoadingButton
            variant="outline"
            onAsyncClick={async () => {
              handleExport();
            }}
            loadingText="Exporting..."
            successMessage="Studies exported successfully"
            errorMessage="Failed to export studies"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </LoadingButton>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <StudyFilters
          columnFilters={columnFilters}
          setColumnFilters={setColumnFilters}
          buckets={buckets}
        />
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
              className="h-8 w-[70px] rounded-md border border-input bg-background px-2 py-1 text-sm"
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <StudyEditModal
        study={editingStudy}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingStudy(null);
        }}
        buckets={buckets}
        users={users}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog />
    </div>
  );
}

function getStatusConfig(status: string) {
  const configs: Record<string, { label: string; variant: string }> = {
    PLANNING: { label: "Planning", variant: "secondary" },
    IRB_SUBMISSION: { label: "IRB Submission", variant: "warning" },
    IRB_APPROVED: { label: "IRB Approved", variant: "success" },
    DATA_COLLECTION: { label: "Data Collection", variant: "default" },
    ANALYSIS: { label: "Analysis", variant: "default" },
    MANUSCRIPT: { label: "Manuscript", variant: "secondary" },
    UNDER_REVIEW: { label: "Under Review", variant: "warning" },
    PUBLISHED: { label: "Published", variant: "success" },
    ON_HOLD: { label: "On Hold", variant: "secondary" },
    CANCELLED: { label: "Cancelled", variant: "destructive" },
  };
  return configs[status] || { label: status, variant: "default" };
}

function getPriorityConfig(priority: string) {
  const configs: Record<string, { label: string; variant: string }> = {
    LOW: { label: "Low", variant: "secondary" },
    MEDIUM: { label: "Medium", variant: "default" },
    HIGH: { label: "High", variant: "warning" },
    CRITICAL: { label: "Critical", variant: "destructive" },
  };
  return configs[priority] || { label: priority, variant: "default" };
}