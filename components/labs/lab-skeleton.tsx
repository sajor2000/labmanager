import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton loader for a single lab card
 */
export function LabCardSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      <Skeleton className="absolute top-0 left-0 w-1 h-full" />
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
        <Skeleton className="h-6 w-3/4 mt-4" />
        <div className="flex items-center gap-2 mt-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-12" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-4" />
        
        {/* Member Avatars Skeleton */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-4" />
          </div>
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-8 rounded-full" />
            ))}
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <Skeleton className="h-3 w-3" />
              <div className="flex-1">
                <Skeleton className="h-3 w-12 mb-1" />
                <Skeleton className="h-4 w-6" />
              </div>
            </div>
          ))}
        </div>

        {/* Recent Projects Skeleton */}
        <div className="mt-4 pt-4 border-t">
          <Skeleton className="h-3 w-20 mb-2" />
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loader for statistics cards
 */
export function StatisticsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-20" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Full page skeleton loader for labs
 */
export function LabsPageSkeleton() {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <StatisticsCardsSkeleton />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <LabCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}