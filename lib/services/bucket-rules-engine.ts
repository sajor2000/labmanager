import { Project, ProjectStatus, Priority } from '@prisma/client';

export interface BucketRule {
  id: string;
  bucketId: string;
  field: 'status' | 'priority' | 'fundingSource' | 'projectType' | 'keyword';
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than';
  value: string;
  enabled: boolean;
}

export interface BucketWithRules {
  id: string;
  name: string;
  rules: BucketRule[];
}

export class BucketRulesEngine {
  private buckets: BucketWithRules[];
  
  constructor(buckets: BucketWithRules[]) {
    this.buckets = buckets;
  }
  
  /**
   * Determine which bucket a project should be assigned to based on configured rules
   */
  assignProjectToBucket(project: Partial<Project>): string | null {
    // Check each bucket's rules in order
    for (const bucket of this.buckets) {
      if (this.evaluateBucketRules(project, bucket.rules)) {
        return bucket.id;
      }
    }
    
    return null; // No matching bucket
  }
  
  /**
   * Evaluate all rules for a bucket against a project
   * All rules must match (AND logic)
   */
  private evaluateBucketRules(project: Partial<Project>, rules: BucketRule[]): boolean {
    if (!rules || rules.length === 0) return false;
    
    const enabledRules = rules.filter(rule => rule.enabled);
    if (enabledRules.length === 0) return false;
    
    return enabledRules.every(rule => this.evaluateRule(project, rule));
  }
  
  /**
   * Evaluate a single rule against a project
   */
  private evaluateRule(project: Partial<Project>, rule: BucketRule): boolean {
    const fieldValue = this.getFieldValue(project, rule.field);
    if (fieldValue === null || fieldValue === undefined) return false;
    
    const ruleValue = rule.value.toLowerCase();
    const fieldValueStr = String(fieldValue).toLowerCase();
    
    switch (rule.operator) {
      case 'equals':
        return fieldValueStr === ruleValue;
        
      case 'contains':
        return fieldValueStr.includes(ruleValue);
        
      case 'starts_with':
        return fieldValueStr.startsWith(ruleValue);
        
      case 'ends_with':
        return fieldValueStr.endsWith(ruleValue);
        
      case 'greater_than':
        return this.compareNumeric(fieldValue, rule.value) > 0;
        
      case 'less_than':
        return this.compareNumeric(fieldValue, rule.value) < 0;
        
      default:
        return false;
    }
  }
  
  /**
   * Get the value of a field from a project
   */
  private getFieldValue(project: Partial<Project>, field: string): any {
    switch (field) {
      case 'status':
        return project.status;
      case 'priority':
        return project.priority;
      case 'fundingSource':
        return project.fundingSource;
      case 'projectType':
        return project.projectType;
      case 'keyword':
        // Check in name and description
        const searchText = `${project.name || ''} ${project.description || ''}`.toLowerCase();
        return searchText;
      default:
        return null;
    }
  }
  
  /**
   * Compare numeric values (for priority levels)
   */
  private compareNumeric(fieldValue: any, ruleValue: string): number {
    // Map priority values to numbers for comparison
    const priorityMap: Record<string, number> = {
      [Priority.LOW]: 1,
      [Priority.MEDIUM]: 2,
      [Priority.HIGH]: 3,
      [Priority.CRITICAL]: 4,
    };
    
    if (typeof fieldValue === 'string' && fieldValue in priorityMap) {
      const fieldNum = priorityMap[fieldValue];
      const ruleNum = priorityMap[ruleValue.toUpperCase()] || parseInt(ruleValue);
      return fieldNum - ruleNum;
    }
    
    // Direct numeric comparison
    const fieldNum = parseFloat(String(fieldValue));
    const ruleNum = parseFloat(ruleValue);
    
    if (isNaN(fieldNum) || isNaN(ruleNum)) return 0;
    return fieldNum - ruleNum;
  }
  
  /**
   * Get suggested bucket for a project based on rules
   * Returns bucket info with confidence score
   */
  suggestBucket(project: Partial<Project>): { bucketId: string; bucketName: string; confidence: number } | null {
    for (const bucket of this.buckets) {
      const enabledRules = bucket.rules.filter(rule => rule.enabled);
      if (enabledRules.length === 0) continue;
      
      const matchingRules = enabledRules.filter(rule => this.evaluateRule(project, rule));
      const confidence = (matchingRules.length / enabledRules.length) * 100;
      
      if (matchingRules.length === enabledRules.length) {
        return {
          bucketId: bucket.id,
          bucketName: bucket.name,
          confidence,
        };
      }
    }
    
    return null;
  }
  
  /**
   * Batch assign multiple projects to buckets
   */
  batchAssignProjects(projects: Partial<Project>[]): Map<string, string[]> {
    const assignments = new Map<string, string[]>();
    
    for (const project of projects) {
      const bucketId = this.assignProjectToBucket(project);
      if (bucketId && project.id) {
        if (!assignments.has(bucketId)) {
          assignments.set(bucketId, []);
        }
        assignments.get(bucketId)!.push(project.id);
      }
    }
    
    return assignments;
  }
}

// Example usage in a server action:
export async function applyBucketRules(projectId: string, bucketRules: BucketWithRules[]) {
  // This would be called from a server action when a project is created or updated
  // The actual implementation would fetch the project and update it with the assigned bucket
}