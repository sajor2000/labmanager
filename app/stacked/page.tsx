import { getBuckets } from '@/app/actions/bucket-actions';
import { getStudies } from '@/app/actions/project-actions-v2';
import { StackedBucketBoardClient } from '@/components/studies/stacked-bucket-board-client';
import type { BucketWithRelations, ProjectWithRelations } from '@/lib/types/dto';

export default async function StackedPage() {
  // Fetch real data from database
  const [bucketsResult, studiesResult] = await Promise.all([
    getBuckets(),
    getStudies()
  ]);

  if (!bucketsResult.success || !studiesResult.success) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Unable to load data
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {!bucketsResult.success ? bucketsResult.error : !studiesResult.success ? studiesResult.error : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  // Map the data to include title field for backward compatibility
  const bucketsWithTitle = bucketsResult.data.map((bucket: BucketWithRelations) => ({
    ...bucket,
    title: bucket.name, // Map name to title for UI components
  }));
  
  const studiesWithTitle = studiesResult.data.map((project: ProjectWithRelations) => ({
    ...project,
    title: project.name, // Map name to title for UI components
  }));

  return (
    <div className="h-full flex flex-col">
      <StackedBucketBoardClient 
        initialBuckets={bucketsWithTitle}
        initialStudies={studiesWithTitle}
      />
    </div>
  );
}