'use client';

import { useState, useEffect } from 'react';
import type { Bucket } from '@/components/buckets/bucket-card';
import { BucketHeader } from '@/components/buckets/bucket-header';
import { BucketCreationForm, type BucketFormData } from '@/components/buckets/bucket-creation-form';
import { BucketAnalytics } from '@/components/buckets/bucket-analytics';
import { NestedBucketView } from '@/components/buckets/nested-bucket-view';
import { BucketRulesModal, type BucketRule } from '@/components/buckets/bucket-rules-modal';
import { BulkActionToolbar } from '@/components/buckets/bulk-action-toolbar';
import { BucketImportModal } from '@/components/buckets/bucket-import-modal';
import { BucketFilterPanel, type BucketFilters } from '@/components/buckets/bucket-filter-panel';
import { showToast } from '@/components/ui/toast';
import { useLab } from '@/lib/contexts/lab-context';

export default function BucketsPage() {
  const { currentLab, isLoading: labsLoading } = useLab();
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'analytics'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showCreationForm, setShowCreationForm] = useState(false);
  const [editingBucket, setEditingBucket] = useState<Bucket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedBuckets, setSelectedBuckets] = useState<Set<string>>(new Set());
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [rulesModalBucket, setRulesModalBucket] = useState<Bucket | null>(null);
  const [parentBucketId, setParentBucketId] = useState<string | undefined>(undefined);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filters, setFilters] = useState<BucketFilters>({
    projectCountRange: [0, 100],
    progressRange: [0, 100],
    memberCountRange: [0, 50],
    dateRange: { from: null, to: null },
    hasActiveRules: null,
    isActive: null,
    colors: [],
    icons: [],
  });

  // Fetch buckets when lab changes
  useEffect(() => {
    if (!currentLab || labsLoading) return;
    
    const fetchBuckets = async () => {
      setIsLoading(true);
      try {
        // Fetch buckets filtered by the current lab
        const response = await fetch(`/api/buckets?labId=${currentLab.id}`);
        if (response.ok) {
          const data = await response.json();
          // Transform API response to match our Bucket type
          const transformedBuckets: Bucket[] = data.map((bucket: any) => ({
            id: bucket.id,
            name: bucket.name,
            description: bucket.description,
            color: bucket.color,
            icon: bucket.icon || 'folder',
            position: bucket.position,
            projectCount: bucket._count?.projects || 0,
            completedProjects: 0,
            activeMembers: 0,
            progress: 0,
            isActive: bucket.isActive !== false,
            createdAt: new Date(bucket.createdAt),
            updatedAt: new Date(bucket.updatedAt),
            parentBucketId: undefined,
            hasActiveRules: false,
            rulesCount: 0,
            labId: bucket.labId,
          }));
          setBuckets(transformedBuckets);
        }
      } catch (error) {
        console.error('Failed to fetch buckets:', error);
        showToast({
          type: 'error',
          title: 'Failed to load buckets',
          message: 'Please try refreshing the page',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBuckets();
    
    // Listen for lab changes via custom event
    const handleLabChange = () => {
      fetchBuckets();
    };
    
    window.addEventListener('labChanged', handleLabChange);
    return () => {
      window.removeEventListener('labChanged', handleLabChange);
    };
  }, [currentLab, labsLoading]);
  
  // Filter buckets
  const filteredBuckets = buckets.filter(bucket => {
    // Basic filters
    if (!showArchived && !bucket.isActive) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!bucket.name.toLowerCase().includes(query) &&
          !bucket.description?.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    // Advanced filters
    // Project count range
    if (bucket.projectCount < filters.projectCountRange[0] ||
        bucket.projectCount > filters.projectCountRange[1]) {
      return false;
    }
    
    // Progress range
    if (bucket.progress < filters.progressRange[0] ||
        bucket.progress > filters.progressRange[1]) {
      return false;
    }
    
    // Member count range
    if (bucket.activeMembers < filters.memberCountRange[0] ||
        bucket.activeMembers > filters.memberCountRange[1]) {
      return false;
    }
    
    // Date range
    if (filters.dateRange.from || filters.dateRange.to) {
      const bucketDate = new Date(bucket.createdAt);
      if (filters.dateRange.from && bucketDate < filters.dateRange.from) {
        return false;
      }
      if (filters.dateRange.to && bucketDate > filters.dateRange.to) {
        return false;
      }
    }
    
    // Has active rules
    if (filters.hasActiveRules !== null) {
      if (filters.hasActiveRules && !bucket.hasActiveRules) {
        return false;
      }
      if (!filters.hasActiveRules && bucket.hasActiveRules) {
        return false;
      }
    }
    
    // Status
    if (filters.isActive !== null) {
      if (filters.isActive !== bucket.isActive) {
        return false;
      }
    }
    
    // Colors
    if (filters.colors.length > 0 && !filters.colors.includes(bucket.color)) {
      return false;
    }
    
    // Icons
    if (filters.icons.length > 0 && !filters.icons.includes(bucket.icon)) {
      return false;
    }
    
    return true;
  }).sort((a, b) => a.position - b.position);
  
  // Handle drag and drop (currently unused but may be needed for future drag-and-drop functionality)
  // const handleDragEnd = (result: DropResult) => {
  //   if (!result.destination) return;
  //   
  //   const items = Array.from(filteredBuckets);
  //   const [reorderedItem] = items.splice(result.source.index, 1);
  //   items.splice(result.destination.index, 0, reorderedItem);
  //   
  //   // Update positions
  //   const updatedBuckets = items.map((item, index) => ({
  //     ...item,
  //     position: index,
  //   }));
  //   
  //   setBuckets(prevBuckets => {
  //     const otherBuckets = prevBuckets.filter(b => !filteredBuckets.find(fb => fb.id === b.id));
  //     return [...otherBuckets, ...updatedBuckets];
  //   });
  //   
  //   showToast({
  //     type: 'success',
  //     title: 'Buckets reordered',
  //     message: 'The bucket order has been updated',
  //   });
  // };
  
  const handleCreateBucket = async (formData: BucketFormData) => {
    try {
      // Use the current lab from context
      if (!currentLab) {
        throw new Error('No lab selected');
      }
      
      const response = await fetch('/api/buckets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.name,
          description: formData.description,
          color: formData.color,
          icon: formData.icon,
          labId: currentLab.id,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create bucket');
      }
      
      const createdBucket = await response.json();
      
      // Transform the response to match our Bucket type
      const newBucket: Bucket = {
        id: createdBucket.id,
        name: createdBucket.name,
        description: createdBucket.description,
        color: createdBucket.color,
        icon: createdBucket.icon || 'folder',
        position: createdBucket.position,
        projectCount: createdBucket._count?.projects || 0,
        completedProjects: 0,
        activeMembers: 0,
        progress: 0,
        isActive: createdBucket.isActive !== false,
        createdAt: new Date(createdBucket.createdAt),
        updatedAt: new Date(createdBucket.updatedAt),
        parentBucketId: parentBucketId,
      };
      
      setBuckets([...buckets, newBucket]);
      setShowCreationForm(false);
      setParentBucketId(undefined);
      
      showToast({
        type: 'success',
        title: 'Bucket created',
        message: `${formData.name} has been created successfully`,
      });
    } catch (error: any) {
      console.error('Failed to create bucket:', error);
      showToast({
        type: 'error',
        title: 'Failed to create bucket',
        message: error.message || 'Please try again',
      });
    }
  };
  
  const handleEditBucket = async (formData: BucketFormData) => {
    if (!editingBucket) return;
    
    try {
      const response = await fetch('/api/buckets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingBucket.id,
          title: formData.name,
          description: formData.description,
          color: formData.color,
          icon: formData.icon,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update bucket');
      }
      
      // Update local state only if API call succeeded
      setBuckets(buckets.map(bucket => 
        bucket.id === editingBucket.id
          ? {
              ...bucket,
              name: formData.name,
              description: formData.description,
              color: formData.color,
              icon: formData.icon,
              updatedAt: new Date(),
            }
          : bucket
      ));
      
      setEditingBucket(null);
      
      showToast({
        type: 'success',
        title: 'Bucket updated',
        message: `${formData.name} has been updated successfully`,
      });
    } catch (error: any) {
      console.error('Failed to update bucket:', error);
      showToast({
        type: 'error',
        title: 'Failed to update bucket',
        message: error.message || 'Please try again',
      });
    }
  };
  
  const handleArchiveBucket = async (bucketId: string) => {
    try {
      const response = await fetch('/api/buckets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: bucketId,
          isActive: false,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to archive bucket');
      }
      
      // Update local state only if API call succeeded
      setBuckets(buckets.map(bucket => 
        bucket.id === bucketId
          ? { ...bucket, isActive: false, updatedAt: new Date() }
          : bucket
      ));
      
      showToast({
        type: 'success',
        title: 'Bucket archived',
        message: 'The bucket has been archived',
      });
    } catch (error: any) {
      console.error('Failed to archive bucket:', error);
      showToast({
        type: 'error',
        title: 'Failed to archive bucket',
        message: error.message || 'Please try again',
      });
    }
  };
  
  const handleDeleteBucket = async (bucketId: string) => {
    try {
      const response = await fetch(`/api/buckets?id=${bucketId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete bucket');
      }
      
      // Only remove from state if API call succeeded
      setBuckets(buckets.filter(bucket => bucket.id !== bucketId));
      
      showToast({
        type: 'success',
        title: 'Bucket deleted',
        message: 'The bucket has been permanently deleted',
      });
    } catch (error: any) {
      console.error('Failed to delete bucket:', error);
      showToast({
        type: 'error',
        title: 'Failed to delete bucket',
        message: error.message || 'Please try again',
      });
    }
  };
  
  const handleViewProjects = (_bucketId: string) => {
    // Navigate to projects view filtered by bucket
    showToast({
      type: 'info',
      title: 'View Projects',
      message: 'Navigating to projects view...',
    });
  };
  
  const handleToggleExpand = (bucketId: string) => {
    setBuckets(buckets.map(bucket => 
      bucket.id === bucketId
        ? { ...bucket, isExpanded: !bucket.isExpanded }
        : bucket
    ));
  };
  
  const handleCreateSubBucket = (parentId: string) => {
    setParentBucketId(parentId);
    setShowCreationForm(true);
  };
  
  const handleSelectionChange = (bucketId: string, selected: boolean) => {
    const newSelection = new Set(selectedBuckets);
    if (selected) {
      newSelection.add(bucketId);
    } else {
      newSelection.delete(bucketId);
    }
    setSelectedBuckets(newSelection);
  };
  
  const handleBulkArchive = () => {
    setBuckets(buckets.map(bucket => 
      selectedBuckets.has(bucket.id)
        ? { ...bucket, isActive: false, updatedAt: new Date() }
        : bucket
    ));
    setSelectedBuckets(new Set());
    setSelectionMode(false);
  };
  
  const handleBulkDelete = async () => {
    try {
      // Delete each selected bucket
      const deletePromises = Array.from(selectedBuckets).map(bucketId =>
        fetch(`/api/buckets?id=${bucketId}`, { method: 'DELETE' })
      );
      
      const results = await Promise.allSettled(deletePromises);
      
      const successfulDeletes = results.filter(r => r.status === 'fulfilled' && r.value.ok);
      const failedDeletes = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.ok));
      
      if (failedDeletes.length > 0) {
        showToast({
          type: 'warning',
          title: 'Partial deletion',
          message: `${successfulDeletes.length} buckets deleted, ${failedDeletes.length} failed`,
        });
      } else {
        showToast({
          type: 'success',
          title: 'Buckets deleted',
          message: `${successfulDeletes.length} buckets have been deleted`,
        });
      }
      
      // Remove successfully deleted buckets from state
      const deletedIds = new Set(
        results
          .map((r, i) => r.status === 'fulfilled' && r.value.ok ? Array.from(selectedBuckets)[i] : null)
          .filter(id => id !== null)
      );
      
      setBuckets(buckets.filter(bucket => !deletedIds.has(bucket.id)));
      setSelectedBuckets(new Set());
      setSelectionMode(false);
    } catch (error: any) {
      console.error('Failed to delete buckets:', error);
      showToast({
        type: 'error',
        title: 'Failed to delete buckets',
        message: 'Please try again',
      });
    }
  };
  
  const handleBulkExport = () => {
    const selectedData = buckets.filter(b => selectedBuckets.has(b.id));
    const json = JSON.stringify(selectedData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'buckets-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleShowRules = (bucket: Bucket) => {
    setRulesModalBucket(bucket);
    setShowRulesModal(true);
  };
  
  const handleSaveRules = (bucketId: string, rules: BucketRule[]) => {
    // Save rules logic here
    console.log('Saving rules for bucket', bucketId, rules);
    setShowRulesModal(false);
  };
  
  const handleExportBuckets = () => {
    const exportData = buckets.map(bucket => ({
      name: bucket.name,
      description: bucket.description,
      color: bucket.color,
      icon: bucket.icon,
      position: bucket.position,
      isActive: bucket.isActive,
      hasActiveRules: bucket.hasActiveRules,
      rulesCount: bucket.rulesCount,
    }));
    
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `buckets-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast({
      type: 'success',
      title: 'Export complete',
      message: `Exported ${buckets.length} buckets`,
    });
  };
  
  const handleImportBuckets = (importedBuckets: Partial<Bucket>[]) => {
    const newBuckets = importedBuckets.map((bucket, index) => ({
      id: Date.now().toString() + '-' + index,
      name: bucket.name || 'Imported Bucket',
      description: bucket.description || '',
      color: bucket.color || '#6B7280',
      icon: bucket.icon || 'folder',
      position: buckets.length + index,
      projectCount: 0,
      completedProjects: 0,
      activeMembers: 0,
      progress: 0,
      isActive: bucket.isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date(),
      hasActiveRules: bucket.hasActiveRules || false,
      rulesCount: bucket.rulesCount || 0,
    }));
    
    setBuckets([...buckets, ...newBuckets]);
    setShowImportModal(false);
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="px-6 py-4 border-b dark:border-gray-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Buckets</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Organize projects into categorized collections
        </p>
      </div>
      
      {/* Bucket Header */}
      <BucketHeader
        onCreateBucket={() => setShowCreationForm(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showArchived={showArchived}
        onShowArchivedChange={setShowArchived}
        selectionMode={selectionMode}
        onSelectionModeChange={setSelectionMode}
        selectedCount={selectedBuckets.size}
        onImport={() => setShowImportModal(true)}
        onExport={handleExportBuckets}
        onAdvancedFilter={() => setShowFilterPanel(true)}
        hasActiveFilters={
          filters.projectCountRange[0] > 0 ||
          filters.projectCountRange[1] < 100 ||
          filters.progressRange[0] > 0 ||
          filters.progressRange[1] < 100 ||
          filters.memberCountRange[0] > 0 ||
          filters.memberCountRange[1] < 50 ||
          filters.dateRange.from !== null ||
          filters.dateRange.to !== null ||
          filters.hasActiveRules !== null ||
          filters.isActive !== null ||
          filters.colors.length > 0 ||
          filters.icons.length > 0
        }
      />
      
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
        {isLoading ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-48 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse"
                />
              ))}
            </div>
          </div>
        ) : viewMode === 'analytics' ? (
          <BucketAnalytics buckets={filteredBuckets} />
        ) : viewMode === 'grid' ? (
          <div>
            <NestedBucketView
              buckets={filteredBuckets}
              onEdit={(bucket) => {
                setEditingBucket(bucket);
                setShowCreationForm(true);
              }}
              onArchive={handleArchiveBucket}
              onDelete={handleDeleteBucket}
              onViewProjects={handleViewProjects}
              onCreateSubBucket={handleCreateSubBucket}
              onToggleExpand={handleToggleExpand}
              onConfigureRules={handleShowRules}
              selectionMode={selectionMode}
              selectedBuckets={selectedBuckets}
              onSelectionChange={handleSelectionChange}
            />
          </div>
        ) : (
          // List view
          <div className="p-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
              <table className="w-full">
                <thead className="border-b dark:border-gray-700">
                  <tr className="text-left">
                    <th className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      Bucket
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      Projects
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      Progress
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      Members
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBuckets.map((bucket) => (
                    <tr 
                      key={bucket.id} 
                      className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                      onClick={() => handleViewProjects(bucket.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: bucket.color }}
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {bucket.name}
                            </p>
                            {bucket.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {bucket.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {bucket.projectCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-blue-500"
                              style={{ width: `${bucket.progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {bucket.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {bucket.activeMembers}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm ${bucket.isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                          {bucket.isActive ? 'Active' : 'Archived'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {filteredBuckets.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery 
                ? 'No buckets found matching your search.'
                : 'No buckets created yet. Click "New Bucket" to get started.'}
            </p>
          </div>
        )}
      </div>
      
      {/* Creation/Edit Form */}
      <BucketCreationForm
        isOpen={showCreationForm}
        onClose={() => {
          setShowCreationForm(false);
          setEditingBucket(null);
          setParentBucketId(undefined);
        }}
        onSubmit={editingBucket ? handleEditBucket : handleCreateBucket}
        editingBucket={editingBucket ? {
          id: editingBucket.id,
          name: editingBucket.name,
          description: editingBucket.description || '',
          color: editingBucket.color,
          icon: editingBucket.icon,
        } : undefined}
      />
      
      {/* Bucket Rules Modal */}
      {rulesModalBucket && (
        <BucketRulesModal
          isOpen={showRulesModal}
          onClose={() => {
            setShowRulesModal(false);
            setRulesModalBucket(null);
          }}
          bucket={rulesModalBucket}
          onSaveRules={handleSaveRules}
        />
      )}
      
      {/* Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selectedBuckets.size}
        onArchive={handleBulkArchive}
        onDelete={handleBulkDelete}
        onChangeColor={() => {
          // Open color picker dialog for selected buckets
          if (selectedBuckets.size > 0) {
            const selectedBucketIds = Array.from(selectedBuckets);
            showToast({
              type: 'info',
              title: 'Change Color',
              message: `Updating color for ${selectedBuckets.size} bucket(s)`,
            });
            // TODO: Implement color picker dialog
            // For now, we'll use a default color
            selectedBucketIds.forEach(id => {
              updateBucketMutation.mutate({
                id,
                color: '#' + Math.floor(Math.random()*16777215).toString(16),
              });
            });
            setSelectedBuckets(new Set());
            setSelectionMode(false);
          }
        }}
        onExport={handleBulkExport}
        onClearSelection={() => {
          setSelectedBuckets(new Set());
          setSelectionMode(false);
        }}
      />
      
      {/* Import Modal */}
      <BucketImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportBuckets}
      />
      
      {/* Filter Panel */}
      <BucketFilterPanel
        isOpen={showFilterPanel}
        onClose={() => setShowFilterPanel(false)}
        filters={filters}
        onFiltersChange={setFilters}
        onReset={() => setFilters({
          projectCountRange: [0, 100],
          progressRange: [0, 100],
          memberCountRange: [0, 50],
          dateRange: { from: null, to: null },
          hasActiveRules: null,
          isActive: null,
          colors: [],
          icons: [],
        })}
      />
    </div>
  );
}