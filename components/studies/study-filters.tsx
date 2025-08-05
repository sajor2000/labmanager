"use client";

import { ColumnFiltersState } from "@tanstack/react-table";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Props {
  columnFilters: ColumnFiltersState;
  setColumnFilters: (filters: ColumnFiltersState) => void;
  buckets: any[];
}

export function StudyFilters({ columnFilters, setColumnFilters, buckets }: Props) {
  const statusOptions = [
    "PLANNING",
    "IRB_SUBMISSION",
    "IRB_APPROVED",
    "DATA_COLLECTION",
    "ANALYSIS",
    "MANUSCRIPT",
    "UNDER_REVIEW",
    "PUBLISHED",
    "ON_HOLD",
    "CANCELLED",
  ];

  const priorityOptions = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

  const fundingOptions = [
    "NIH",
    "NSF",
    "INDUSTRY_SPONSORED",
    "INTERNAL",
    "FOUNDATION",
    "OTHER",
  ];

  const getFilterValue = (columnId: string) => {
    const filter = columnFilters.find((f) => f.id === columnId);
    return filter?.value as string | undefined;
  };

  const setFilter = (columnId: string, value: string | undefined) => {
    if (value === "all" || !value) {
      setColumnFilters(columnFilters.filter((f) => f.id !== columnId));
    } else {
      const existingFilter = columnFilters.find((f) => f.id === columnId);
      if (existingFilter) {
        setColumnFilters(
          columnFilters.map((f) =>
            f.id === columnId ? { ...f, value } : f
          )
        );
      } else {
        setColumnFilters([...columnFilters, { id: columnId, value }]);
      }
    }
  };

  const clearAllFilters = () => {
    setColumnFilters([]);
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">Filters</h3>
        {columnFilters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-8 px-2 lg:px-3"
          >
            Clear all
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="status-filter">Status</Label>
          <Select
            value={getFilterValue("status") || "all"}
            onValueChange={(value) => setFilter("status", value)}
          >
            <SelectTrigger id="status-filter">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.replace(/_/g, " ").toLowerCase()}
                  {status
                    .split("_")
                    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
                    .join(" ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority-filter">Priority</Label>
          <Select
            value={getFilterValue("priority") || "all"}
            onValueChange={(value) => setFilter("priority", value)}
          >
            <SelectTrigger id="priority-filter">
              <SelectValue placeholder="All priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {priorityOptions.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority.charAt(0) + priority.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="funding-filter">Funding Source</Label>
          <Select
            value={getFilterValue("fundingSource") || "all"}
            onValueChange={(value) => setFilter("fundingSource", value)}
          >
            <SelectTrigger id="funding-filter">
              <SelectValue placeholder="All funding sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All funding sources</SelectItem>
              {fundingOptions.map((funding) => (
                <SelectItem key={funding} value={funding}>
                  {funding.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bucket-filter">Bucket</Label>
          <Select
            value={getFilterValue("bucketId") || "all"}
            onValueChange={(value) => setFilter("bucketId", value)}
          >
            <SelectTrigger id="bucket-filter">
              <SelectValue placeholder="All buckets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All buckets</SelectItem>
              {buckets.map((bucket) => (
                <SelectItem key={bucket.id} value={bucket.id}>
                  {bucket.name || bucket.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters Display */}
      {columnFilters.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {columnFilters.map((filter) => {
            let label = filter.id;
            let value = filter.value as string;
            
            if (filter.id === "bucketId") {
              const bucket = buckets.find((b) => b.id === value);
              label = "Bucket";
              value = bucket?.name || bucket?.title || value;
            }
            
            return (
              <Badge key={filter.id} variant="secondary">
                {label}: {value}
                <button
                  className="ml-2 hover:text-destructive"
                  onClick={() => setFilter(filter.id, undefined)}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}