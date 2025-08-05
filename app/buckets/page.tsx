'use client';

import { useState } from 'react';
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

// Mock data - replace with API calls
const mockBuckets: Bucket[] = [
  {
    id: '1',
    name: 'NIH-Funded Projects',
    description: 'Research projects funded by National Institutes of Health',
    color: '#3B82F6',
    icon: 'trending',
    position: 0,
    projectCount: 12,
    completedProjects: 3,
    activeMembers: 8,
    progress: 25,
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-02-20'),
    hasActiveRules: true,
    rulesCount: 2,
  },
  {
    id: '2',
    name: 'Pilot Studies',
    description: 'Small-scale preliminary research projects',
    color: '#10B981',
    icon: 'folder',
    position: 1,
    projectCount: 8,
    completedProjects: 5,
    activeMembers: 4,
    progress: 62,
    isActive: true,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-02-18'),
  },
  {
    id: '3',
    name: 'Industry Partnerships',
    description: 'Corporate-sponsored research collaborations',
    color: '#F59E0B',
    icon: 'trending',
    position: 2,
    projectCount: 5,
    completedProjects: 1,
    activeMembers: 6,
    progress: 20,
    isActive: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-19'),
  },
  {
    id: '4',
    name: 'Clinical Trials',
    description: 'Human subject research studies',
    color: '#EF4444',
    icon: 'archive',
    position: 3,
    projectCount: 3,
    completedProjects: 0,
    activeMembers: 10,
    progress: 15,
    isActive: true,
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-15'),
  },
  {
    id: '5',
    name: 'Manuscripts',
    description: 'Papers in various stages of preparation',
    color: '#EC4899',
    icon: 'archive',
    position: 4,
    projectCount: 15,
    completedProjects: 8,
    activeMembers: 12,
    progress: 53,
    isActive: true,
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2024-02-21'),
    hasActiveRules: true,
    rulesCount: 3,
  },
  {
    id: '6',
    name: 'Archived Projects',
    description: 'Completed or discontinued projects',
    color: '#6B7280',
    icon: 'archive',
    position: 5,
    projectCount: 20,
    completedProjects: 20,
    activeMembers: 0,
    progress: 100,
    isActive: false,
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

export default function BucketsPage() {
  const [buckets, setBuckets] = useState(mockBuckets);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'analytics'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showCreationForm, setShowCreationForm] = useState(false);
  const [editingBucket, setEditingBucket] = useState<Bucket | null>(null);
  const [isLoading] = useState(false);
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
  
  const handleCreateBucket = (formData: BucketFormData) => {
    const newBucket: Bucket = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      color: formData.color,
      icon: formData.icon,
      position: buckets.length,
      projectCount: 0,
      completedProjects: 0,
      activeMembers: 0,
      progress: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      parentBucketId: parentBucketId,
    };
    
    setBuckets([...buckets, newBucket]);
    setShowCreationForm(false);
    setParentBucketId(undefined);
  };
  
  const handleEditBucket = (formData: BucketFormData) => {
    if (!editingBucket) return;
    
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
  };
  
  const handleArchiveBucket = (bucketId: string) => {
    setBuckets(buckets.map(bucket => 
      bucket.id === bucketId
        ? { ...bucket, isActive: false, updatedAt: new Date() }
        : bucket
    ));
  };
  
  const handleDeleteBucket = (bucketId: string) => {
    setBuckets(buckets.filter(bucket => bucket.id !== bucketId));
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
  
  const handleBulkDelete = () => {
    setBuckets(buckets.filter(bucket => !selectedBuckets.has(bucket.id)));
    setSelectedBuckets(new Set());
    setSelectionMode(false);
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
          showToast({
            type: 'info',
            title: 'Change Color',
            message: 'Color change for multiple buckets coming soon',
          });
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