'use client';

import React, { useState } from 'react';
import { 
  Filter, Plus, Trash2, X, ChevronDown, 
  Search, Calendar, User, Tag, DollarSign,
  Hash, Type, CheckSquare, Link2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { FieldType } from '../fields/field-types';
import { FIELD_DEFINITIONS, getFieldIcon } from '../fields/field-types';
import { format } from 'date-fns';

export interface FilterCondition {
  id: string;
  fieldId: string;
  fieldType: FieldType;
  operator: string;
  value: any;
  isEnabled: boolean;
}

export interface FilterGroup {
  id: string;
  name?: string;
  logic: 'AND' | 'OR';
  conditions: FilterCondition[];
}

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  fields: Array<{
    id: string;
    name: string;
    type: FieldType;
    options?: any;
  }>;
  filters: FilterGroup[];
  onFiltersChange: (filters: FilterGroup[]) => void;
  onApply: () => void;
  className?: string;
}

const OPERATORS_BY_TYPE: Record<string, Array<{ value: string; label: string }>> = {
  TEXT: [
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'equals', label: 'Is' },
    { value: 'not_equals', label: 'Is not' },
    { value: 'starts_with', label: 'Starts with' },
    { value: 'ends_with', label: 'Ends with' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
  ],
  NUMBER: [
    { value: 'equals', label: '=' },
    { value: 'not_equals', label: '≠' },
    { value: 'greater_than', label: '>' },
    { value: 'greater_equal', label: '≥' },
    { value: 'less_than', label: '<' },
    { value: 'less_equal', label: '≤' },
    { value: 'between', label: 'Between' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
  ],
  DATE: [
    { value: 'equals', label: 'Is' },
    { value: 'not_equals', label: 'Is not' },
    { value: 'before', label: 'Is before' },
    { value: 'after', label: 'Is after' },
    { value: 'between', label: 'Is between' },
    { value: 'today', label: 'Is today' },
    { value: 'tomorrow', label: 'Is tomorrow' },
    { value: 'yesterday', label: 'Is yesterday' },
    { value: 'this_week', label: 'Is this week' },
    { value: 'this_month', label: 'Is this month' },
    { value: 'this_year', label: 'Is this year' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
  ],
  SELECT: [
    { value: 'is', label: 'Is' },
    { value: 'is_not', label: 'Is not' },
    { value: 'is_any_of', label: 'Is any of' },
    { value: 'is_none_of', label: 'Is none of' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
  ],
  CHECKBOX: [
    { value: 'is_checked', label: 'Is checked' },
    { value: 'is_not_checked', label: 'Is not checked' },
  ],
  USER: [
    { value: 'is', label: 'Is' },
    { value: 'is_not', label: 'Is not' },
    { value: 'is_me', label: 'Is me' },
    { value: 'is_not_me', label: 'Is not me' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
  ],
};

export function FilterPanel({
  isOpen,
  onClose,
  fields,
  filters,
  onFiltersChange,
  onApply,
  className,
}: FilterPanelProps) {
  const [activeGroup, setActiveGroup] = useState<string>(
    filters[0]?.id || 'default'
  );
  const [isAddingCondition, setIsAddingCondition] = useState(false);
  
  // Initialize with default group if none exist
  React.useEffect(() => {
    if (filters.length === 0) {
      onFiltersChange([{
        id: 'default',
        name: 'All Conditions',
        logic: 'AND',
        conditions: [],
      }]);
    }
  }, [filters, onFiltersChange]);
  
  const currentGroup = filters.find(g => g.id === activeGroup) || filters[0];
  
  const getOperatorsForField = (fieldType: FieldType) => {
    const typeKey = fieldType.includes('TEXT') ? 'TEXT' :
                   fieldType.includes('NUMBER') || fieldType.includes('CURRENCY') || fieldType.includes('PERCENT') ? 'NUMBER' :
                   fieldType.includes('DATE') || fieldType.includes('TIME') ? 'DATE' :
                   fieldType.includes('SELECT') ? 'SELECT' :
                   fieldType.includes('CHECKBOX') ? 'CHECKBOX' :
                   fieldType.includes('USER') || fieldType.includes('COLLABORATOR') ? 'USER' :
                   'TEXT';
    return OPERATORS_BY_TYPE[typeKey] || OPERATORS_BY_TYPE.TEXT;
  };
  
  const addCondition = () => {
    const newCondition: FilterCondition = {
      id: Date.now().toString(),
      fieldId: fields[0]?.id || '',
      fieldType: fields[0]?.type || 'TEXT',
      operator: 'contains',
      value: '',
      isEnabled: true,
    };
    
    const updatedGroups = filters.map(g => 
      g.id === activeGroup
        ? { ...g, conditions: [...g.conditions, newCondition] }
        : g
    );
    
    onFiltersChange(updatedGroups);
    setIsAddingCondition(false);
  };
  
  const updateCondition = (conditionId: string, updates: Partial<FilterCondition>) => {
    const updatedGroups = filters.map(g => 
      g.id === activeGroup
        ? {
            ...g,
            conditions: g.conditions.map(c =>
              c.id === conditionId ? { ...c, ...updates } : c
            ),
          }
        : g
    );
    
    onFiltersChange(updatedGroups);
  };
  
  const removeCondition = (conditionId: string) => {
    const updatedGroups = filters.map(g => 
      g.id === activeGroup
        ? {
            ...g,
            conditions: g.conditions.filter(c => c.id !== conditionId),
          }
        : g
    );
    
    onFiltersChange(updatedGroups);
  };
  
  const toggleGroupLogic = () => {
    const updatedGroups = filters.map(g => 
      g.id === activeGroup
        ? { ...g, logic: g.logic === 'AND' ? 'OR' : 'AND' }
        : g
    );
    
    onFiltersChange(updatedGroups);
  };
  
  const clearAllFilters = () => {
    onFiltersChange([{
      id: 'default',
      name: 'All Conditions',
      logic: 'AND',
      conditions: [],
    }]);
  };
  
  const activeConditionsCount = currentGroup?.conditions.filter(c => c.isEnabled).length || 0;
  
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className={cn("w-full sm:max-w-md", className)}>
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
              {activeConditionsCount > 0 && (
                <Badge variant="secondary">
                  {activeConditionsCount} active
                </Badge>
              )}
            </div>
            {currentGroup?.conditions.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs"
              >
                Clear all
              </Button>
            )}
          </SheetTitle>
          <SheetDescription>
            Filter your data by setting conditions on fields
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {/* Logic Toggle */}
          {currentGroup?.conditions.length > 1 && (
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-sm font-medium">
                Where {currentGroup.logic === 'AND' ? 'all' : 'any'} conditions match
              </span>
              <RadioGroup
                value={currentGroup.logic}
                onValueChange={(value) => toggleGroupLogic()}
                className="flex items-center gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="AND" id="and" />
                  <Label htmlFor="and" className="text-sm">
                    All (AND)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="OR" id="or" />
                  <Label htmlFor="or" className="text-sm">
                    Any (OR)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}
          
          {/* Conditions */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {currentGroup?.conditions.map((condition, index) => (
                <div
                  key={condition.id}
                  className={cn(
                    "p-3 border rounded-lg space-y-3",
                    !condition.isEnabled && "opacity-50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={condition.isEnabled}
                        onCheckedChange={(checked) =>
                          updateCondition(condition.id, { isEnabled: checked })
                        }
                      />
                      {index > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {currentGroup.logic}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCondition(condition.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Field Selection */}
                  <Select
                    value={condition.fieldId}
                    onValueChange={(fieldId) => {
                      const field = fields.find(f => f.id === fieldId);
                      if (field) {
                        updateCondition(condition.id, {
                          fieldId,
                          fieldType: field.type,
                          operator: getOperatorsForField(field.type)[0].value,
                          value: '',
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fields.map((field) => (
                        <SelectItem key={field.id} value={field.id}>
                          <div className="flex items-center gap-2">
                            {getFieldIcon(field.type, "h-4 w-4")}
                            {field.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Operator Selection */}
                  <Select
                    value={condition.operator}
                    onValueChange={(operator) =>
                      updateCondition(condition.id, { operator })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getOperatorsForField(condition.fieldType).map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Value Input */}
                  {!['is_empty', 'is_not_empty', 'is_checked', 'is_not_checked', 'is_me', 'is_not_me', 
                     'today', 'tomorrow', 'yesterday', 'this_week', 'this_month', 'this_year'].includes(condition.operator) && (
                    <div>
                      {condition.fieldType.includes('DATE') ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {condition.value ? format(new Date(condition.value), "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={condition.value ? new Date(condition.value) : undefined}
                              onSelect={(date) =>
                                updateCondition(condition.id, { value: date?.toISOString() })
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      ) : condition.fieldType.includes('NUMBER') || 
                         condition.fieldType.includes('CURRENCY') || 
                         condition.fieldType.includes('PERCENT') ? (
                        <Input
                          type="number"
                          value={condition.value || ''}
                          onChange={(e) =>
                            updateCondition(condition.id, { value: parseFloat(e.target.value) })
                          }
                          placeholder="Enter value..."
                        />
                      ) : (
                        <Input
                          value={condition.value || ''}
                          onChange={(e) =>
                            updateCondition(condition.id, { value: e.target.value })
                          }
                          placeholder="Enter value..."
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Add Condition Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={addCondition}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add condition
              </Button>
            </div>
          </ScrollArea>
          
          {/* Footer */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                onApply();
                onClose();
              }}
              disabled={activeConditionsCount === 0}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}