"use client";

import Link from "next/link";
import { MoreHorizontal, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudyData {
  id: string;
  title: string;
  status: string;
  studyType?: string;
  bucket?: {
    title: string;
    color: string;
  };
  createdBy?: {
    name: string;
  };
  _count?: {
    tasks: number;
  };
  progress?: number;
}

interface Props {
  studies?: StudyData[];
}

const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    'PLANNING': 'bg-indigo-500',
    'IRB_SUBMISSION': 'bg-amber-500',
    'IRB_APPROVED': 'bg-green-500',
    'DATA_COLLECTION': 'bg-blue-500',
    'ANALYSIS': 'bg-green-500',
    'MANUSCRIPT': 'bg-purple-500',
    'UNDER_REVIEW': 'bg-amber-500',
    'PUBLISHED': 'bg-emerald-500',
    'ON_HOLD': 'bg-gray-500',
    'CANCELLED': 'bg-red-500'
  };
  return statusColors[status] || 'bg-gray-500';
};

const formatStatus = (status: string): string => {
  return status.replace(/_/g, ' ').toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase());
};

export function RecentStudies({ studies = [] }: Props) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Studies
        </h2>
        <Link
          href="/studies"
          className="flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View all
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>

      <div className="space-y-4">
        {studies.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No studies yet
          </div>
        ) : (
          studies.slice(0, 3).map((study) => {
            const bucketColor = study.bucket?.color || '#00BCD4';
            const bgColorClass = `bg-[${bucketColor}]`;
            
            return (
              <div
                key={study.id}
                className="group relative rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer dark:border-gray-700 dark:hover:border-gray-600"
              >
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg" 
                  style={{ backgroundColor: bucketColor }}
                />
                
                <div className="ml-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {study.title}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                        <div className="flex items-center">
                          <div className={cn("h-2 w-2 rounded-full mr-1.5", getStatusColor(study.status))} />
                          <span className="text-gray-600 dark:text-gray-400">{formatStatus(study.status)}</span>
                        </div>
                        {study.studyType && (
                          <>
                            <span className="text-gray-500 dark:text-gray-400">•</span>
                            <span className="text-gray-600 dark:text-gray-400">{study.studyType}</span>
                          </>
                        )}
                        {study.createdBy?.name && (
                          <>
                            <span className="text-gray-500 dark:text-gray-400">•</span>
                            <span className="text-gray-600 dark:text-gray-400">{study.createdBy.name}</span>
                          </>
                        )}
                      </div>
                      {study._count && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <span>Tasks</span>
                            <span>{study._count.tasks} total</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                      <MoreHorizontal className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}