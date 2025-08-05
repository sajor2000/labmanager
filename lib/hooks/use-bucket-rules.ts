import { useState, useCallback } from 'react';
import { showToast } from '@/components/ui/toast';
import { BucketRulesEngine, BucketWithRules } from '@/lib/services/bucket-rules-engine';
import { Project } from '@prisma/client';

export function useBucketRules() {
  const [isApplyingRules, setIsApplyingRules] = useState(false);
  
  const applyRulesToProject = useCallback(async (
    project: Partial<Project>,
    buckets: BucketWithRules[]
  ): Promise<string | null> => {
    setIsApplyingRules(true);
    
    try {
      const engine = new BucketRulesEngine(buckets);
      const bucketId = engine.assignProjectToBucket(project);
      
      if (bucketId) {
        const bucket = buckets.find(b => b.id === bucketId);
        showToast({
          type: 'info',
          title: 'Auto-assigned to bucket',
          message: `Project assigned to "${bucket?.name}" based on matching rules`,
        });
      }
      
      return bucketId;
    } catch (error) {
      console.error('Error applying bucket rules:', error);
      showToast({
        type: 'error',
        title: 'Rule application failed',
        message: 'Could not apply bucket rules to the project',
      });
      return null;
    } finally {
      setIsApplyingRules(false);
    }
  }, []);
  
  const suggestBucketForProject = useCallback((
    project: Partial<Project>,
    buckets: BucketWithRules[]
  ) => {
    const engine = new BucketRulesEngine(buckets);
    return engine.suggestBucket(project);
  }, []);
  
  const batchApplyRules = useCallback(async (
    projects: Partial<Project>[],
    buckets: BucketWithRules[]
  ) => {
    setIsApplyingRules(true);
    
    try {
      const engine = new BucketRulesEngine(buckets);
      const assignments = engine.batchAssignProjects(projects);
      
      let totalAssigned = 0;
      assignments.forEach(projectIds => {
        totalAssigned += projectIds.length;
      });
      
      if (totalAssigned > 0) {
        showToast({
          type: 'success',
          title: 'Batch assignment complete',
          message: `${totalAssigned} projects assigned to buckets based on rules`,
        });
      }
      
      return assignments;
    } catch (error) {
      console.error('Error batch applying rules:', error);
      showToast({
        type: 'error',
        title: 'Batch assignment failed',
        message: 'Could not apply bucket rules to projects',
      });
      return new Map();
    } finally {
      setIsApplyingRules(false);
    }
  }, []);
  
  return {
    applyRulesToProject,
    suggestBucketForProject,
    batchApplyRules,
    isApplyingRules,
  };
}