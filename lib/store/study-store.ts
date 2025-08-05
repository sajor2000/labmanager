import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Study, StudyFilters, Bucket, StudyStatus, StudyPriority, FundingSource } from "@/types";
import { showToast } from "@/components/ui/toast";
import * as studyActions from '@/app/actions/study-actions';
import * as bucketActions from '@/app/actions/bucket-actions';
import { 
  projectToStudy, 
  projectsToStudies,
  studyToProjectInput,
  bucketToBucketUI,
  bucketsToBucketsUI,
  bucketUIToBucketInput,
  prepareStudyForAction,
  prepareBucketForAction
} from '@/lib/utils/transformers';

interface StudyState {
  // State
  studies: Study[];
  buckets: Bucket[];
  filters: StudyFilters;
  isLoading: boolean;
  error: string | null;
  currentLabId: string;

  // Actions
  setStudies: (studies: Study[]) => void;
  addStudy: (study: Study) => void;
  updateStudy: (id: string, updates: Partial<Study>) => void;
  deleteStudy: (id: string) => void;
  moveStudyToBucket: (studyId: string, targetBucketId: string) => void;
  
  // Bucket actions
  setBuckets: (buckets: Bucket[]) => void;
  addBucket: (bucket: Bucket) => void;
  updateBucket: (id: string, updates: Partial<Bucket>) => void;
  deleteBucket: (id: string) => void;
  
  // Filter actions
  setFilters: (filters: StudyFilters) => void;
  clearFilters: () => void;
  
  // Async actions
  fetchStudies: () => Promise<void>;
  fetchBuckets: () => Promise<void>;
  
  // UI state
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentLabId: (labId: string) => void;
  initializeCurrentLab: () => Promise<void>;
}

export const useStudyStore = create<StudyState>()(
  devtools(
    (set, get) => ({
        // Initial state
        studies: [],
        buckets: [],
        filters: {},
        isLoading: false,
        error: null,
        currentLabId: '', // Will be set dynamically

        // Study actions
        setStudies: (studies) => set({ studies }),
        
        addStudy: async (study) => {
          // Get current user from the API
          const userResponse = await fetch('/api/users/current');
          const currentUser = userResponse.ok ? await userResponse.json() : null;
          const userId = currentUser?.id || 'system';
          
          // Prepare the input for the action
          const projectInput = studyToProjectInput(study);
          
          const result = await studyActions.createStudy({
            title: projectInput.name || study.title,
            studyType: projectInput.projectType || study.studyType,
            assigneeIds: projectInput.memberIds || study.assigneeIds || [],
            ...projectInput,
            labId: get().currentLabId,
            createdById: userId,
            dueDate: study.dueDate?.toISOString(),
          } as any);
          
          if (result.success && result.data) {
            // Convert Project to Study format
            const studyData = projectToStudy(result.data);
            
            set((state) => ({
              studies: [...state.studies, studyData],
            }));
            
            showToast({
              type: 'success',
              title: 'Study created',
              message: `"${study.title}" has been created successfully.`,
            });
          } else {
            showToast({
              type: 'error',
              title: 'Failed to create study',
              message: !result.success ? result.error : 'Operation failed',
            });
          }
        },
        
        updateStudy: async (id, updates) => {
          // Prepare the input for the action
          const projectInput = studyToProjectInput(updates);
          
          const result = await studyActions.updateStudy({
            id,
            title: projectInput.name || updates.title,
            studyType: projectInput.projectType || updates.studyType,
            assigneeIds: projectInput.memberIds || updates.assigneeIds,
            ...projectInput,
            dueDate: updates.dueDate?.toISOString(),
          } as any);
          
          if (result.success && result.data) {
            // Convert Project to Study format
            const studyData = projectToStudy(result.data);
            
            set((state) => ({
              studies: state.studies.map((study) =>
                study.id === id ? studyData : study
              ),
            }));
            
            showToast({
              type: 'success',
              title: 'Study updated',
              message: 'The study has been updated successfully.',
            });
          } else {
            showToast({
              type: 'error',
              title: 'Failed to update study',
              message: !result.success ? result.error : 'Operation failed',
            });
          }
        },
        
        deleteStudy: async (id) => {
          const result = await studyActions.deleteStudy(id);
          
          if (result.success) {
            set((state) => ({
              studies: state.studies.filter((study) => study.id !== id),
            }));
            
            showToast({
              type: 'success',
              title: 'Study deleted',
              message: 'The study has been deleted successfully.',
            });
          } else {
            showToast({
              type: 'error',
              title: 'Failed to delete study',
              message: !result.success ? result.error : 'Operation failed',
            });
          }
        },
        
        moveStudyToBucket: async (studyId, targetBucketId) => {
          const result = await studyActions.moveStudyToBucket({ studyId, bucketId: targetBucketId });
          
          if (result.success) {
            set((state) => ({
              studies: state.studies.map((study) =>
                study.id === studyId ? { ...study, bucketId: targetBucketId } : study
              ),
            }));
          } else {
            showToast({
              type: 'error',
              title: 'Failed to move study',
              message: !result.success ? result.error : 'Operation failed',
            });
          }
        },

        // Bucket actions
        setBuckets: (buckets) => set({ buckets }),
        
        addBucket: async (bucket) => {
          // Prepare the input for the action
          const bucketInput = bucketUIToBucketInput(bucket);
          
          const result = await bucketActions.createBucket({
            title: bucketInput.name || bucket.title,
            ...bucketInput,
            labId: bucket.labId || get().currentLabId,
          } as any);
          
          if (result.success && result.data) {
            // Convert database bucket to store format
            const bucketData = bucketToBucketUI(result.data);
            
            set((state) => ({
              buckets: [...state.buckets, bucketData],
            }));
            
            showToast({
              type: 'success',
              title: 'Bucket created',
              message: `"${bucket.title}" has been created successfully.`,
            });
          } else {
            showToast({
              type: 'error',
              title: 'Failed to create bucket',
              message: !result.success ? result.error : 'Operation failed',
            });
          }
        },
        
        updateBucket: (id, updates) =>
          set((state) => ({
            buckets: state.buckets.map((bucket) =>
              bucket.id === id ? { ...bucket, ...updates } : bucket
            ),
          })),
        
        deleteBucket: async (id) => {
          const result = await bucketActions.deleteBucket(id);
          
          if (result.success) {
            set((state) => ({
              buckets: state.buckets.filter((bucket) => bucket.id !== id),
            }));
            
            showToast({
              type: 'success',
              title: 'Bucket deleted',
              message: 'The bucket has been deleted successfully.',
            });
          } else {
            showToast({
              type: 'error',
              title: 'Failed to delete bucket',
              message: !result.success ? result.error : 'Operation failed',
            });
          }
        },

        // Filter actions
        setFilters: (filters) => set({ filters }),
        clearFilters: () => set({ filters: {} }),

        // Async actions
        fetchStudies: async () => {
          set({ isLoading: true, error: null });
          const result = await studyActions.getStudies({ 
            labId: get().currentLabId 
          });
          
          if (result.success && result.data) {
            // Convert Project[] to Study[]
            const studies = projectsToStudies(result.data);
            
            set({ studies, isLoading: false });
          } else {
            set({ 
              error: !result.success ? result.error : 'Failed to fetch studies',
              isLoading: false 
            });
          }
        },
        
        fetchBuckets: async () => {
          set({ isLoading: true, error: null });
          const result = await bucketActions.getBuckets(
            get().currentLabId
          );
          
          if (result.success && result.data) {
            // Convert database buckets to store format
            const buckets = bucketsToBucketsUI(result.data);
            
            set({ buckets, isLoading: false });
          } else {
            set({ 
              error: !result.success ? result.error : 'Failed to fetch buckets',
              isLoading: false 
            });
          }
        },

        // UI state
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        setCurrentLabId: (labId) => set({ currentLabId: labId }),
        
        // Initialize lab from current user
        initializeCurrentLab: async () => {
          try {
            const response = await fetch('/api/users/current');
            if (response.ok) {
              const user = await response.json();
              // Set the first lab the user belongs to as current
              if (user.labs && user.labs.length > 0) {
                set({ currentLabId: user.labs[0].labId });
              }
            }
          } catch (error) {
            // Error initializing current lab
          }
        },
      })
  )
);

// Selector hooks
export const useFilteredStudies = () => {
  const { studies, filters } = useStudyStore();
  
  return studies.filter((study) => {
    if (filters.status?.length && !filters.status.includes(study.status)) {
      return false;
    }
    if (filters.priority?.length && !filters.priority.includes(study.priority)) {
      return false;
    }
    if (filters.bucketIds?.length && !filters.bucketIds.includes(study.bucketId)) {
      return false;
    }
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      return (
        study.title.toLowerCase().includes(query) ||
        study.oraNumber?.toLowerCase().includes(query) ||
        study.studyType.toLowerCase().includes(query)
      );
    }
    return true;
  });
};

export const useStudiesByBucket = (bucketId: string) => {
  const studies = useFilteredStudies();
  return studies.filter((study) => study.bucketId === bucketId);
};