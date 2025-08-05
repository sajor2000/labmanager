"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const DashboardOverview = dynamic(
  () => import("@/components/dashboard/overview").then(mod => mod.DashboardOverview),
  {
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    ),
  }
);

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <DashboardOverview />
    </Suspense>
  );
}