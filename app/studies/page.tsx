import { getStudies } from '@/app/actions/project-actions-v2';
import { getBuckets } from '@/app/actions/bucket-actions';
import { prisma } from '@/lib/prisma';
import { StudiesPageEnhanced } from '@/components/studies/studies-page-enhanced';

export default async function StudiesPage() {
  // Fetch all data needed for the page
  const [studiesResult, bucketsResult, users] = await Promise.all([
    getStudies(),
    getBuckets(),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        initials: true,
      },
    }),
  ]);

  if (!studiesResult.success) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Unable to load studies
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {studiesResult.error}
          </p>
        </div>
      </div>
    );
  }

  // Map the data to include title field for backward compatibility
  const studiesWithTitle = studiesResult.data.map((project: any) => ({
    ...project,
    title: project.name, // Map name to title for UI components
  }));
  
  const bucketsWithTitle = bucketsResult.success 
    ? bucketsResult.data.map((bucket: any) => ({
        ...bucket,
        title: bucket.name, // Map name to title for UI components
      }))
    : [];

  return (
    <StudiesPageEnhanced 
      studies={studiesWithTitle}
      buckets={bucketsWithTitle}
      users={users}
    />
  );
}