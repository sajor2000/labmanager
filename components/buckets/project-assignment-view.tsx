'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Search, Filter, FileText, Calendar, User, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/ui/toast';
import type { Bucket } from './bucket-card';
import type { Project } from '@prisma/client';

interface ProjectWithBucket extends Project {
  bucket?: Bucket;
}

interface ProjectAssignmentViewProps {
  buckets: Bucket[];
  projects: ProjectWithBucket[];
  onAssignProject: (projectId: string, bucketId: string) => void;
  onUnassignProject: (projectId: string) => void;
}

export function ProjectAssignmentView({
  buckets,
  projects,
  onAssignProject,
  onUnassignProject,
}: ProjectAssignmentViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBuckets, setExpandedBuckets] = useState<Set<string>>(new Set(buckets.map(b => b.id)));
  
  // Filter projects
  const filteredProjects = projects.filter(project => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      project.name.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query) ||
      project.projectType?.toLowerCase().includes(query)
    );
  });
  
  // Group projects by bucket
  const unassignedProjects = filteredProjects.filter(p => !p.bucket);
  const projectsByBucket = new Map<string, ProjectWithBucket[]>();
  
  buckets.forEach(bucket => {
    projectsByBucket.set(
      bucket.id, 
      filteredProjects.filter(p => p.bucket?.id === bucket.id)
    );
  });
  
  // Handle drag end
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const projectId = result.draggableId;
    const destinationBucketId = result.destination.droppableId;
    
    if (destinationBucketId === 'unassigned') {
      onUnassignProject(projectId);
      showToast({
        type: 'info',
        title: 'Project unassigned',
        message: 'Project removed from bucket',
      });
    } else {
      onAssignProject(projectId, destinationBucketId);
      const bucket = buckets.find(b => b.id === destinationBucketId);
      showToast({
        type: 'success',
        title: 'Project assigned',
        message: `Project moved to "${bucket?.name}"`,
      });
    }
  };
  
  // Toggle bucket expansion
  const toggleBucketExpansion = (bucketId: string) => {
    const newExpanded = new Set(expandedBuckets);
    if (newExpanded.has(bucketId)) {
      newExpanded.delete(bucketId);
    } else {
      newExpanded.add(bucketId);
    }
    setExpandedBuckets(newExpanded);
  };
  
  // Project card component
  const ProjectCard = ({ project, index }: { project: ProjectWithBucket; index: number }) => (
    <Draggable draggableId={project.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-3 mb-2",
            "hover:shadow-md transition-all cursor-move",
            snapshot.isDragging && "shadow-lg opacity-90 rotate-2"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-1">
                {project.name}
              </h4>
              {project.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">
                  {project.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  {project.projectType}
                </Badge>
                {project.dueDate && (
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(project.dueDate).toLocaleDateString()}
                  </Badge>
                )}
              </div>
            </div>
            <Badge 
              className="text-xs"
              variant={
                project.status === 'PLANNING' ? 'secondary' :
                project.status === 'DATA_COLLECTION' ? 'default' :
                project.status === 'PUBLISHED' ? 'success' :
                'destructive'
              }
            >
              {project.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      )}
    </Draggable>
  );
  
  // Bucket column component
  const BucketColumn = ({ bucket }: { bucket: Bucket }) => {
    const bucketProjects = projectsByBucket.get(bucket.id) || [];
    const isExpanded = expandedBuckets.has(bucket.id);
    
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <div 
          className="flex items-center justify-between mb-3 cursor-pointer"
          onClick={() => toggleBucketExpansion(bucket.id)}
        >
          <div className="flex items-center gap-2">
            <ChevronRight 
              className={cn(
                "h-4 w-4 transition-transform",
                isExpanded && "rotate-90"
              )}
            />
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: bucket.color }}
            />
            <h3 className="font-medium text-gray-900 dark:text-white">
              {bucket.name}
            </h3>
            <Badge variant="secondary" className="text-xs">
              {bucketProjects.length}
            </Badge>
          </div>
        </div>
        
        {isExpanded && (
          <Droppable droppableId={bucket.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "min-h-[100px] rounded-lg p-2 transition-colors",
                  snapshot.isDraggingOver && "bg-blue-50 dark:bg-blue-950 border-2 border-dashed border-blue-300 dark:border-blue-700"
                )}
              >
                {bucketProjects.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
                    Drop projects here to assign them to this bucket
                  </p>
                ) : (
                  bucketProjects.map((project, index) => (
                    <ProjectCard key={project.id} project={project} index={index} />
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        )}
      </div>
    );
  };
  
  return (
    <div className="p-6">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Unassigned Projects Column */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Unassigned Projects ({unassignedProjects.length})
            </h2>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <Droppable droppableId="unassigned">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "min-h-[200px] rounded-lg p-2",
                      snapshot.isDraggingOver && "bg-blue-50 dark:bg-blue-950 border-2 border-dashed border-blue-300 dark:border-blue-700"
                    )}
                  >
                    {unassignedProjects.length === 0 ? (
                      <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
                        {searchQuery ? 'No unassigned projects match your search' : 'All projects are assigned to buckets'}
                      </p>
                    ) : (
                      unassignedProjects.map((project, index) => (
                        <ProjectCard key={project.id} project={project} index={index} />
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
          
          {/* Buckets Column */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Buckets ({buckets.length})
            </h2>
            <div className="space-y-4">
              {buckets.map(bucket => (
                <BucketColumn key={bucket.id} bucket={bucket} />
              ))}
            </div>
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}