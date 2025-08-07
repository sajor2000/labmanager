'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Calendar } from '@/components/ui/calendar';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import {
  X,
  Plus,
  Filter,
  Calendar as CalendarIcon,
  Save,
  RotateCcw,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

export interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: any;
  logic?: 'AND' | 'OR';
}

export interface FilterGroup {
  id: string;
  name: string;
  conditions: FilterCondition[];
  logic: 'AND' | 'OR';
}

export interface AdvancedFilterProps {
  fields: {
    id: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'range';
    options?: { value: string; label: string }[];
  }[];
  onApply: (filters: FilterGroup) => void;
  onReset?: () => void;
  savedFilters?: FilterGroup[];
  onSaveFilter?: (filter: FilterGroup) => void;
  className?: string;
}

const OPERATORS: Record<string, { value: string; label: string; }[]> = {
  text: [
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not equals' },
    { value: 'starts_with', label: 'Starts with' },
    { value: 'ends_with', label: 'Ends with' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
  ],
  number: [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not equals' },
    { value: 'greater_than', label: 'Greater than' },
    { value: 'less_than', label: 'Less than' },
    { value: 'between', label: 'Between' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
  ],
  multiselect: [
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'equals', label: 'Equals all' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
  ],
  date: [
    { value: 'equals', label: 'On' },
    { value: 'before', label: 'Before' },
    { value: 'after', label: 'After' },
    { value: 'between', label: 'Between' },
    { value: 'last_n_days', label: 'Last N days' },
    { value: 'next_n_days', label: 'Next N days' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
  ],
  select: [
    { value: 'is', label: 'Is' },
    { value: 'is_not', label: 'Is not' },
    { value: 'is_any_of', label: 'Is any of' },
    { value: 'is_none_of', label: 'Is none of' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
  ],
  boolean: [
    { value: 'is_true', label: 'Is true' },
    { value: 'is_false', label: 'Is false' },
  ],
  range: [
    { value: 'between', label: 'Between' },
    { value: 'outside', label: 'Outside' },
  ],
};

export function AdvancedFilter({
  fields,
  onApply,
  onReset,
  savedFilters = [],
  onSaveFilter,
  className,
}: AdvancedFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterGroup, setFilterGroup] = useState<FilterGroup>({
    id: Date.now().toString(),
    name: 'Custom Filter',
    conditions: [],
    logic: 'AND',
  });
  const [filterName, setFilterName] = useState('');

  const addCondition = () => {
    const newCondition: FilterCondition = {
      id: Date.now().toString(),
      field: fields[0].id,
      operator: 'contains',
      value: '',
    };
    
    setFilterGroup({
      ...filterGroup,
      conditions: [...filterGroup.conditions, newCondition],
    });
  };

  const removeCondition = (conditionId: string) => {
    setFilterGroup({
      ...filterGroup,
      conditions: filterGroup.conditions.filter(c => c.id !== conditionId),
    });
  };

  const updateCondition = (conditionId: string, updates: Partial<FilterCondition>) => {
    setFilterGroup({
      ...filterGroup,
      conditions: filterGroup.conditions.map(c =>
        c.id === conditionId ? { ...c, ...updates } : c
      ),
    });
  };

  const handleApply = () => {
    onApply(filterGroup);
    setIsOpen(false);
  };

  const handleReset = () => {
    setFilterGroup({
      id: Date.now().toString(),
      name: 'Custom Filter',
      conditions: [],
      logic: 'AND',
    });
    onReset?.();
  };

  const handleSaveFilter = () => {
    if (filterName && onSaveFilter) {
      onSaveFilter({
        ...filterGroup,
        name: filterName,
      });
      setFilterName('');
    }
  };

  const loadSavedFilter = (filter: FilterGroup) => {
    setFilterGroup(filter);
  };

  const getFieldConfig = (fieldId: string) => {
    return fields.find(f => f.id === fieldId);
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className={cn('gap-2', className)}
      >
        <Filter className="h-4 w-4" />
        Advanced Filters
        {filterGroup.conditions.length > 0 && (
          <Badge variant="secondary" className="ml-1">
            {filterGroup.conditions.length}
          </Badge>
        )}
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Advanced Filter Builder
            </SheetTitle>
            <SheetDescription>
              Create complex filters with multiple conditions
            </SheetDescription>
          </SheetHeader>

          <div className="py-6 space-y-6">
            {/* Saved Filters */}
            {savedFilters.length > 0 && (
              <div className="space-y-2">
                <Label>Quick Filters</Label>
                <div className="flex flex-wrap gap-2">
                  {savedFilters.map((filter) => (
                    <Button
                      key={filter.id}
                      variant="outline"
                      size="sm"
                      onClick={() => loadSavedFilter(filter)}
                      className="gap-1"
                    >
                      {filter.name}
                      <Badge variant="secondary" className="ml-1">
                        {filter.conditions.length}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Logic Selector */}
            <div className="space-y-2">
              <Label>Filter Logic</Label>
              <Tabs
                value={filterGroup.logic}
                onValueChange={(value) => 
                  setFilterGroup({ ...filterGroup, logic: value as 'AND' | 'OR' })
                }
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="AND">Match All (AND)</TabsTrigger>
                  <TabsTrigger value="OR">Match Any (OR)</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Filter Conditions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Conditions</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addCondition}
                  className="gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Condition
                </Button>
              </div>

              {filterGroup.conditions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Filter className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No conditions added yet</p>
                  <p className="text-xs mt-1">Click "Add Condition" to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filterGroup.conditions.map((condition, index) => (
                    <FilterConditionRow
                      key={condition.id}
                      condition={condition}
                      fields={fields}
                      index={index}
                      showLogic={index > 0}
                      groupLogic={filterGroup.logic}
                      onChange={(updates) => updateCondition(condition.id, updates)}
                      onRemove={() => removeCondition(condition.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Save Filter */}
            {onSaveFilter && filterGroup.conditions.length > 0 && (
              <div className="space-y-2">
                <Label>Save Filter</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Filter name..."
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    onClick={handleSaveFilter}
                    disabled={!filterName}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <SheetFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button 
              onClick={handleApply}
              disabled={filterGroup.conditions.length === 0}
              className="gradient-primary text-white"
            >
              Apply Filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

interface FilterConditionRowProps {
  condition: FilterCondition;
  fields: AdvancedFilterProps['fields'];
  index: number;
  showLogic: boolean;
  groupLogic: 'AND' | 'OR';
  onChange: (updates: Partial<FilterCondition>) => void;
  onRemove: () => void;
}

function FilterConditionRow({
  condition,
  fields,
  index,
  showLogic,
  groupLogic,
  onChange,
  onRemove,
}: FilterConditionRowProps) {
  const fieldConfig = fields.find(f => f.id === condition.field);
  const operators = fieldConfig ? OPERATORS[fieldConfig.type] || OPERATORS.text : OPERATORS.text;

  return (
    <div className="space-y-2 p-3 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
      {showLogic && (
        <div className="text-center -mt-6 mb-2">
          <Badge variant="secondary" className="text-xs">
            {groupLogic}
          </Badge>
        </div>
      )}
      
      <div className="grid grid-cols-12 gap-2 items-end">
        {/* Field Selection */}
        <div className="col-span-4">
          <Label className="text-xs">Field</Label>
          <Select
            value={condition.field}
            onValueChange={(value) => onChange({ field: value })}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fields.map((field) => (
                <SelectItem key={field.id} value={field.id}>
                  {field.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Operator Selection */}
        <div className="col-span-3">
          <Label className="text-xs">Operator</Label>
          <Select
            value={condition.operator}
            onValueChange={(value) => onChange({ operator: value })}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {operators.map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Value Input */}
        <div className="col-span-4">
          <Label className="text-xs">Value</Label>
          <FilterValueInput
            fieldConfig={fieldConfig!}
            condition={condition}
            onChange={(value) => onChange({ value })}
          />
        </div>

        {/* Remove Button */}
        <div className="col-span-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-9 w-9 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface FilterValueInputProps {
  fieldConfig: AdvancedFilterProps['fields'][0];
  condition: FilterCondition;
  onChange: (value: any) => void;
}

function FilterValueInput({ fieldConfig, condition, onChange }: FilterValueInputProps) {
  // Skip value input for empty/not empty operators
  if (['is_empty', 'is_not_empty'].includes(condition.operator)) {
    return <Input value="N/A" disabled className="h-9" />;
  }

  switch (fieldConfig.type) {
    case 'text':
      return (
        <Input
          value={condition.value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter value..."
          className="h-9"
        />
      );

    case 'number':
      if (condition.operator === 'between') {
        return (
          <div className="flex gap-1 items-center">
            <Input
              type="number"
              value={condition.value?.[0] || ''}
              onChange={(e) => onChange([e.target.value, condition.value?.[1] || ''])}
              placeholder="Min"
              className="h-9"
            />
            <span className="text-xs">to</span>
            <Input
              type="number"
              value={condition.value?.[1] || ''}
              onChange={(e) => onChange([condition.value?.[0] || '', e.target.value])}
              placeholder="Max"
              className="h-9"
            />
          </div>
        );
      }
      return (
        <Input
          type="number"
          value={condition.value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter number..."
          className="h-9"
        />
      );

    case 'date':
      if (condition.operator === 'between') {
        return (
          <div className="flex gap-1 items-center">
            <DatePicker
              date={condition.value?.[0]}
              onSelect={(date) => onChange([date, condition.value?.[1] || null])}
            />
            <span className="text-xs">to</span>
            <DatePicker
              date={condition.value?.[1]}
              onSelect={(date) => onChange([condition.value?.[0] || null, date])}
            />
          </div>
        );
      }
      if (['last_n_days', 'next_n_days'].includes(condition.operator)) {
        return (
          <Input
            type="number"
            value={condition.value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Days"
            className="h-9"
          />
        );
      }
      return (
        <DatePicker
          date={condition.value}
          onSelect={onChange}
        />
      );

    case 'select':
      if (['is_any_of', 'is_none_of'].includes(condition.operator)) {
        // Multi-select
        return (
          <Select
            value={condition.value?.[0] || ''}
            onValueChange={(value) => onChange([value])}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select values..." />
            </SelectTrigger>
            <SelectContent>
              {fieldConfig.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }
      return (
        <Select
          value={condition.value || ''}
          onValueChange={onChange}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {fieldConfig.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'boolean':
      return (
        <div className="flex items-center h-9">
          <Switch
            checked={condition.operator === 'is_true'}
            onCheckedChange={(checked) => 
              onChange({ operator: checked ? 'is_true' : 'is_false' })
            }
          />
        </div>
      );

    case 'range':
      return (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={condition.value?.[0] || 0}
            onChange={(e) => onChange([parseInt(e.target.value), condition.value?.[1] || 100])}
            className="h-9 w-16"
          />
          <Slider
            value={condition.value || [0, 100]}
            onValueChange={onChange}
            max={100}
            step={1}
            className="flex-1"
          />
          <Input
            type="number"
            value={condition.value?.[1] || 100}
            onChange={(e) => onChange([condition.value?.[0] || 0, parseInt(e.target.value)])}
            className="h-9 w-16"
          />
        </div>
      );

    default:
      return (
        <Input
          value={condition.value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter value..."
          className="h-9"
        />
      );
  }
}

function DatePicker({ date, onSelect }: { date: Date | null; onSelect: (date: Date | null) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-9 justify-start text-left font-normal',
            !date && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PP') : 'Pick date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date || undefined}
          onSelect={(d) => onSelect(d || null)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}