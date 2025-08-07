'use client';

import { useEffect, useState } from 'react';
import { useLab } from '@/lib/contexts/lab-context';
import { StudiesPageEnhanced } from '@/components/studies/studies-page-enhanced';
import { showToast } from '@/components/ui/toast';

export default function StudiesPageClient() {
  const { currentLab, isLoading: labLoading } = useLab();
  const [studies, setStudies] = useState<any[]>([]);
  const [buckets, setBuckets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentLab || labLoading) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch studies, buckets, and users in parallel
        const [studiesRes, bucketsRes, usersRes] = await Promise.all([
          fetch(`/api/projects?labId=${currentLab.id}`),
          fetch(`/api/buckets?labId=${currentLab.id}`),
          fetch('/api/users'),
        ]);

        if (!studiesRes.ok || !bucketsRes.ok || !usersRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [studiesData, bucketsData, usersData] = await Promise.all([
          studiesRes.json(),
          bucketsRes.json(),
          usersRes.json(),
        ]);

        // Map the data to include title field for backward compatibility
        const studiesWithTitle = studiesData.map((project: any) => ({
          ...project,
          title: project.name, // Map name to title for UI components
        }));
        
        const bucketsWithTitle = bucketsData.map((bucket: any) => ({
          ...bucket,
          title: bucket.name, // Map name to title for UI components
        }));

        setStudies(studiesWithTitle);
        setBuckets(bucketsWithTitle);
        setUsers(usersData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Unable to load studies. Please try refreshing the page.');
        showToast({
          type: 'error',
          title: 'Failed to load studies',
          message: 'Please try refreshing the page',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Listen for lab changes
    const handleLabChange = () => {
      fetchData();
    };

    window.addEventListener('labChanged', handleLabChange);
    return () => {
      window.removeEventListener('labChanged', handleLabChange);
    };
  }, [currentLab, labLoading]);

  if (labLoading || isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <span className="text-lg font-medium text-gray-900 dark:text-white">
              Loading studies...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Unable to load studies
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!currentLab) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            No lab selected
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Please select a lab from the top navigation
          </p>
        </div>
      </div>
    );
  }

  return (
    <StudiesPageEnhanced
      studies={studies}
      buckets={buckets}
      users={users}
    />
  );
}