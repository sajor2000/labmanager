'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProjectAssignmentView } from '@/components/buckets/project-assignment-view';
import { showToast } from '@/components/ui/toast';
import type { Bucket } from '@/components/buckets/bucket-card';
import type { Project } from '@prisma/client';

// Mock data - replace with API calls
const mockProjects: (Project & { bucket?: Bucket })[] = [
  {
    id: '1',
    name: 'COVID-19 Vaccine Efficacy Study',
    description: 'Long-term effectiveness of mRNA vaccines',
    notes: null,
    oraNumber: 'ORA-2024-001',
    status: 'DATA_COLLECTION',
    priority: 'HIGH',
    projectType: 'Clinical Trial',
    fundingSource: 'NIH',
    dueDate: new Date('2024-12-31'),
    externalCollaborators: 'CDC, Johns Hopkins',
    labId: 'mock-lab-1',
    createdById: 'mock-user-1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-02-20'),
    bucketId: '1',
    progress: 65,
    position: 0,
    isActive: true,
    parentId: null,
    studyType: null,
    fundingDetails: null,
    startDate: null,
    completedDate: null,
    protocolLink: null,
    dataLink: null,
    metadata: null,
    bucket: {
      id: '1',
      name: 'NIH-Funded Projects',
      description: '',
      color: '#3B82F6',
      icon: 'trending',
      position: 0,
      projectCount: 12,
      completedProjects: 3,
      activeMembers: 8,
      progress: 25,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  {
    id: '2',
    name: 'Mental Health Impact Assessment',
    description: 'Post-pandemic mental health in healthcare workers',
    notes: null,
    oraNumber: 'ORA-2024-002',
    status: 'PLANNING',
    priority: 'MEDIUM',
    projectType: 'Survey Study',
    fundingSource: 'INTERNAL',
    dueDate: new Date('2024-09-30'),
    externalCollaborators: '',
    labId: 'mock-lab-1',
    createdById: 'mock-user-1',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-15'),
    bucketId: '',
    progress: 0,
    position: 1,
    isActive: true,
    parentId: null,
    studyType: null,
    fundingDetails: null,
    startDate: null,
    completedDate: null,
    protocolLink: null,
    dataLink: null,
    metadata: null,
  },
  {
    id: '3',
    name: 'AI-Driven Diagnosis Tool',
    description: 'Machine learning for early cancer detection',
    notes: null,
    oraNumber: 'ORA-2024-003',
    status: 'DATA_COLLECTION',
    priority: 'HIGH',
    projectType: 'Technology Development',
    fundingSource: 'INDUSTRY_SPONSORED',
    dueDate: new Date('2025-03-31'),
    externalCollaborators: 'Google Health, Stanford AI Lab',
    labId: 'mock-lab-1',
    createdById: 'mock-user-1',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-02-18'),
    bucketId: '3',
    progress: 45,
    position: 0,
    isActive: true,
    parentId: null,
    studyType: null,
    fundingDetails: null,
    startDate: null,
    completedDate: null,
    protocolLink: null,
    dataLink: null,
    metadata: null,
    bucket: {
      id: '3',
      name: 'Industry Partnerships',
      description: '',
      color: '#F59E0B',
      icon: 'trending',
      position: 2,
      projectCount: 5,
      completedProjects: 1,
      activeMembers: 6,
      progress: 20,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  {
    id: '4',
    name: 'Pediatric Asthma Intervention',
    description: 'Novel treatment approaches for childhood asthma',
    notes: null,
    oraNumber: 'ORA-2024-004',
    status: 'PLANNING',
    priority: 'HIGH',
    projectType: 'Clinical Trial',
    fundingSource: 'NIH',
    dueDate: new Date('2025-06-30'),
    externalCollaborators: "Children's Hospital",
    labId: 'mock-lab-1',
    createdById: 'mock-user-1',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-20'),
    bucketId: '',
    progress: 0,
    position: 2,
    isActive: true,
    parentId: null,
    studyType: null,
    fundingDetails: null,
    startDate: null,
    completedDate: null,
    protocolLink: null,
    dataLink: null,
    metadata: null,
  },
  {
    id: '5',
    name: 'Community Health Survey',
    description: 'Health disparities in underserved populations',
    notes: null,
    oraNumber: 'ORA-2024-005',
    status: 'PUBLISHED',
    priority: 'MEDIUM',
    projectType: 'Epidemiological Study',
    fundingSource: 'FOUNDATION',
    dueDate: new Date('2024-03-31'),
    externalCollaborators: 'Local Health Department',
    labId: 'mock-lab-1',
    createdById: 'mock-user-1',
    createdAt: new Date('2023-10-01'),
    updatedAt: new Date('2024-02-01'),
    bucketId: '2',
    progress: 100,
    position: 0,
    isActive: true,
    parentId: null,
    studyType: null,
    fundingDetails: null,
    startDate: null,
    completedDate: new Date('2024-02-01'),
    protocolLink: null,
    dataLink: null,
    metadata: null,
    bucket: {
      id: '2',
      name: 'Pilot Studies',
      description: '',
      color: '#10B981',
      icon: 'folder',
      position: 1,
      projectCount: 8,
      completedProjects: 5,
      activeMembers: 4,
      progress: 62,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
];

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
];

export default function BucketAssignPage() {
  const [projects, setProjects] = useState(mockProjects);
  const [isLoading] = useState(false);
  
  const handleAssignProject = (projectId: string, bucketId: string) => {
    const bucket = mockBuckets.find(b => b.id === bucketId);
    if (!bucket) return;
    
    setProjects(prevProjects => 
      prevProjects.map(project => 
        project.id === projectId
          ? { ...project, bucket }
          : project
      )
    );
  };
  
  const handleUnassignProject = (projectId: string) => {
    setProjects(prevProjects => 
      prevProjects.map(project => 
        project.id === projectId
          ? { ...project, bucket: undefined }
          : project
      )
    );
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="px-6 py-4 border-b dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/buckets">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Buckets
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Assign Projects to Buckets
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Drag and drop projects to organize them into buckets
              </p>
            </div>
          </div>
          
          <Button
            onClick={() => {
              showToast({
                type: 'info',
                title: 'Auto-assign feature',
                message: 'Applying bucket rules to unassigned projects...',
              });
            }}
          >
            Auto-Assign by Rules
          </Button>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
        {isLoading ? (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
              <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
            </div>
          </div>
        ) : (
          <ProjectAssignmentView
            buckets={mockBuckets.filter(b => b.isActive)}
            projects={projects}
            onAssignProject={handleAssignProject}
            onUnassignProject={handleUnassignProject}
          />
        )}
      </div>
    </div>
  );
}