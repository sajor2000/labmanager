'use client';

import { useState } from 'react';
import { X, Plus, Trash2, Zap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { showToast } from '@/components/ui/toast';
import type { Bucket } from './bucket-card';

export interface BucketRule {
  id: string;
  field: 'status' | 'funding' | 'title' | 'type' | 'createdDate';
  operator: 'equals' | 'contains' | 'startsWith' | 'after' | 'before';
  value: string;
  isActive: boolean;
}

interface BucketRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  bucket: Bucket;
  onSaveRules: (bucketId: string, rules: BucketRule[]) => void;
}

const FIELD_OPTIONS = [
  { value: 'status', label: 'Project Status' },
  { value: 'funding', label: 'Funding Source' },
  { value: 'title', label: 'Project Title' },
  { value: 'type', label: 'Project Type' },
  { value: 'createdDate', label: 'Created Date' },
];

const OPERATOR_OPTIONS: Record<string, Array<{ value: string; label: string }>> = {
  status: [
    { value: 'equals', label: 'Equals' },
  ],
  funding: [
    { value: 'equals', label: 'Equals' },
  ],
  title: [
    { value: 'contains', label: 'Contains' },
    { value: 'startsWith', label: 'Starts with' },
  ],
  type: [
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
  ],
  createdDate: [
    { value: 'after', label: 'After' },
    { value: 'before', label: 'Before' },
  ],
};

const STATUS_OPTIONS = [
  'PLANNING',
  'IRB_SUBMISSION',
  'IRB_APPROVED',
  'DATA_COLLECTION',
  'ANALYSIS',
  'MANUSCRIPT',
  'UNDER_REVIEW',
  'PUBLISHED',
  'ON_HOLD',
  'CANCELLED',
];

const FUNDING_OPTIONS = [
  'NIH',
  'NSF',
  'INDUSTRY_SPONSORED',
  'INTERNAL',
  'FOUNDATION',
  'OTHER',
];

export function BucketRulesModal({
  isOpen,
  onClose,
  bucket,
  onSaveRules,
}: BucketRulesModalProps) {
  const [rules, setRules] = useState<BucketRule[]>([]);
  const [isTestMode, setIsTestMode] = useState(false);
  
  const addRule = () => {
    const newRule: BucketRule = {
      id: Date.now().toString(),
      field: 'status',
      operator: 'equals',
      value: '',
      isActive: true,
    };
    setRules([...rules, newRule]);
  };
  
  const updateRule = (ruleId: string, updates: Partial<BucketRule>) => {
    setRules(rules.map(rule => 
      rule.id === ruleId 
        ? { ...rule, ...updates }
        : rule
    ));
  };
  
  const deleteRule = (ruleId: string) => {
    setRules(rules.filter(rule => rule.id !== ruleId));
  };
  
  const handleSave = () => {
    // Validate rules
    const invalidRules = rules.filter(rule => !rule.value);
    if (invalidRules.length > 0) {
      showToast({
        type: 'error',
        title: 'Invalid rules',
        message: 'Please fill in all rule values',
      });
      return;
    }
    
    onSaveRules(bucket.id, rules);
    showToast({
      type: 'success',
      title: 'Rules saved',
      message: `Auto-assignment rules for "${bucket.name}" have been updated`,
    });
    onClose();
  };
  
  const testRules = () => {
    setIsTestMode(true);
    // Simulate testing
    setTimeout(() => {
      showToast({
        type: 'info',
        title: 'Test completed',
        message: '5 projects would be assigned to this bucket',
      });
      setIsTestMode(false);
    }, 2000);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg bg-white dark:bg-gray-900 shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Auto-Assignment Rules
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Configure rules to automatically assign projects to "{bucket.name}"
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Rules List */}
          <div className="space-y-4">
            {rules.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed dark:border-gray-700 rounded-lg">
                <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">
                  No rules configured yet
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Add rules to automatically assign projects to this bucket
                </p>
              </div>
            ) : (
              rules.map((rule, index) => (
                <div key={rule.id} className="flex items-end gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    {/* Field Selection */}
                    <div>
                      <Label className="text-xs">Field</Label>
                      <Select
                        value={rule.field}
                        onValueChange={(value) => updateRule(rule.id, { 
                          field: value as BucketRule['field'],
                          operator: OPERATOR_OPTIONS[value][0].value as BucketRule['operator'],
                          value: ''
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Operator Selection */}
                    <div>
                      <Label className="text-xs">Condition</Label>
                      <Select
                        value={rule.operator}
                        onValueChange={(value) => updateRule(rule.id, { 
                          operator: value as BucketRule['operator'] 
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(OPERATOR_OPTIONS[rule.field] || []).map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Value Input */}
                    <div>
                      <Label className="text-xs">Value</Label>
                      {rule.field === 'status' ? (
                        <Select
                          value={rule.value}
                          onValueChange={(value) => updateRule(rule.id, { value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status..." />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map(status => (
                              <SelectItem key={status} value={status}>
                                {status.replace(/_/g, ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : rule.field === 'funding' ? (
                        <Select
                          value={rule.value}
                          onValueChange={(value) => updateRule(rule.id, { value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select funding..." />
                          </SelectTrigger>
                          <SelectContent>
                            {FUNDING_OPTIONS.map(funding => (
                              <SelectItem key={funding} value={funding}>
                                {funding.replace(/_/g, ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : rule.field === 'createdDate' ? (
                        <Input
                          type="date"
                          value={rule.value}
                          onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                        />
                      ) : (
                        <Input
                          value={rule.value}
                          onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                          placeholder={rule.field === 'title' ? 'Enter text...' : 'Enter value...'}
                        />
                      )}
                    </div>
                  </div>
                  
                  {/* Active Toggle */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.isActive}
                      onCheckedChange={(checked) => updateRule(rule.id, { isActive: checked })}
                    />
                    <Label className="text-xs">Active</Label>
                  </div>
                  
                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteRule(rule.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  
                  {/* Rule Number */}
                  <Badge variant="outline" className="text-xs">
                    Rule {index + 1}
                  </Badge>
                </div>
              ))
            )}
          </div>
          
          {/* Add Rule Button */}
          <Button
            variant="outline"
            onClick={addRule}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Rule
          </Button>
          
          {/* Rule Logic Info */}
          {rules.length > 1 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Note:</strong> Projects will be assigned to this bucket if they match <strong>ALL</strong> active rules (AND logic).
              </p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between border-t dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <Button
            variant="outline"
            onClick={testRules}
            disabled={rules.length === 0 || isTestMode}
          >
            {isTestMode ? 'Testing...' : 'Test Rules'}
          </Button>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={rules.length === 0}>
              Save Rules
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}