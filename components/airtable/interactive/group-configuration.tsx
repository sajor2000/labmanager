'use client';

import React, { useState } from 'react';
import { 
  Layers, Plus, X, ChevronDown, ChevronRight,
  Eye, EyeOff, Maximize2, Minimize2, Hash
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { FieldType } from '../fields/field-types';
import { getFieldIcon } from '../fields/field-types';

export interface GroupConfig {
  fieldId: string;
  fieldName: string;
  fieldType: FieldType;
  sortDirection: 'asc' | 'desc';
  showEmptyGroups: boolean;
  collapsedGroups: string[];
}

export interface GroupSettings {
  enabled: boolean;
  config?: GroupConfig;
  subGroupConfig?: GroupConfig;
  hideUngrouped: boolean;
  groupLayout: 'vertical' | 'horizontal' | 'grid';
  summaryFields: string[];
}

interface GroupConfigurationProps {
  fields: Array<{
    id: string;
    name: string;
    type: FieldType;
    groupable?: boolean;
  }>;
  groupSettings: GroupSettings;
  onGroupSettingsChange: (settings: GroupSettings) => void;
  onApply?: () => void;
  allowSubgroups?: boolean;
  className?: string;
}

const GROUPABLE_FIELD_TYPES: FieldType[] = [
  'SINGLE_SELECT',
  'MULTI_SELECT',
  'SINGLE_USER',
  'CHECKBOX',
  'DATE',
  'TEXT',
  'NUMBER',
  'RATING',
];

const GROUP_LAYOUTS = [
  { id: 'vertical', label: 'Vertical', icon: '▦', description: 'Stack groups vertically' },
  { id: 'horizontal', label: 'Horizontal', icon: '▤', description: 'Arrange groups side by side' },
  { id: 'grid', label: 'Grid', icon: '▦▦', description: 'Grid layout for groups' },
];

export function GroupConfiguration({
  fields,
  groupSettings,
  onGroupSettingsChange,
  onApply,
  allowSubgroups = true,
  className,
}: GroupConfigurationProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const groupableFields = fields.filter(f => 
    f.groupable !== false && 
    GROUPABLE_FIELD_TYPES.includes(f.type)
  );
  
  const summaryCapableFields = fields.filter(f => 
    ['NUMBER', 'CURRENCY', 'PERCENT', 'RATING', 'DURATION'].includes(f.type)
  );
  
  const handleToggleGroup = () => {
    onGroupSettingsChange({
      ...groupSettings,
      enabled: !groupSettings.enabled,
    });
  };
  
  const handleFieldChange = (fieldId: string, isSubgroup = false) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    
    const config: GroupConfig = {
      fieldId: field.id,
      fieldName: field.name,
      fieldType: field.type,
      sortDirection: 'asc',
      showEmptyGroups: true,
      collapsedGroups: [],
    };
    
    if (isSubgroup) {
      onGroupSettingsChange({
        ...groupSettings,
        subGroupConfig: config,
      });
    } else {
      onGroupSettingsChange({
        ...groupSettings,
        enabled: true,
        config,
      });
    }
  };
  
  const handleConfigUpdate = (updates: Partial<GroupConfig>, isSubgroup = false) => {
    if (isSubgroup && groupSettings.subGroupConfig) {
      onGroupSettingsChange({
        ...groupSettings,
        subGroupConfig: { ...groupSettings.subGroupConfig, ...updates },
      });
    } else if (groupSettings.config) {
      onGroupSettingsChange({
        ...groupSettings,
        config: { ...groupSettings.config, ...updates },
      });
    }
  };
  
  const handleLayoutChange = (layout: 'vertical' | 'horizontal' | 'grid') => {
    onGroupSettingsChange({
      ...groupSettings,
      groupLayout: layout,
    });
  };
  
  const handleSummaryFieldToggle = (fieldId: string) => {
    const currentFields = groupSettings.summaryFields || [];
    const updated = currentFields.includes(fieldId)
      ? currentFields.filter(f => f !== fieldId)
      : [...currentFields, fieldId];
    
    onGroupSettingsChange({
      ...groupSettings,
      summaryFields: updated,
    });
  };
  
  const clearGrouping = () => {
    onGroupSettingsChange({
      enabled: false,
      hideUngrouped: false,
      groupLayout: 'vertical',
      summaryFields: [],
    });
  };
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("gap-2", className)}
        >
          <Layers className="h-4 w-4" />
          Group
          {groupSettings.enabled && (
            <Badge variant="secondary" className="h-5 px-1">
              {groupSettings.subGroupConfig ? '2' : '1'}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[450px] p-0" align="start">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch
                checked={groupSettings.enabled}
                onCheckedChange={handleToggleGroup}
              />
              <div>
                <h3 className="font-semibold">Group By</h3>
                <p className="text-xs text-muted-foreground">
                  Organize records into groups
                </p>
              </div>
            </div>
            {groupSettings.enabled && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearGrouping}
                className="text-xs"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
        
        {groupSettings.enabled && (
          <ScrollArea className="h-[400px]">
            <div className="p-4 space-y-4">
              {/* Primary Group */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Group by field</Label>
                <Select
                  value={groupSettings.config?.fieldId}
                  onValueChange={(fieldId) => handleFieldChange(fieldId, false)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a field to group by" />
                  </SelectTrigger>
                  <SelectContent>
                    {groupableFields.map((field) => (
                      <SelectItem key={field.id} value={field.id}>
                        <div className="flex items-center gap-2">
                          {getFieldIcon(field.type, "h-4 w-4")}
                          {field.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {groupSettings.config && (
                  <div className="space-y-3 pl-4 border-l-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Sort groups</Label>
                      <RadioGroup
                        value={groupSettings.config.sortDirection}
                        onValueChange={(value) => 
                          handleConfigUpdate({ sortDirection: value as 'asc' | 'desc' })
                        }
                        className="flex items-center gap-4"
                      >
                        <div className="flex items-center gap-1">
                          <RadioGroupItem value="asc" id="asc" />
                          <Label htmlFor="asc" className="text-xs cursor-pointer">
                            A → Z
                          </Label>
                        </div>
                        <div className="flex items-center gap-1">
                          <RadioGroupItem value="desc" id="desc" />
                          <Label htmlFor="desc" className="text-xs cursor-pointer">
                            Z → A
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Show empty groups</Label>
                      <Switch
                        checked={groupSettings.config.showEmptyGroups}
                        onCheckedChange={(checked) =>
                          handleConfigUpdate({ showEmptyGroups: checked })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Sub-group */}
              {allowSubgroups && groupSettings.config && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Then group by</Label>
                    <Select
                      value={groupSettings.subGroupConfig?.fieldId || ''}
                      onValueChange={(fieldId) => 
                        fieldId ? handleFieldChange(fieldId, true) : 
                        onGroupSettingsChange({ ...groupSettings, subGroupConfig: undefined })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a field for sub-grouping" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {groupableFields
                          .filter(f => f.id !== groupSettings.config?.fieldId)
                          .map((field) => (
                            <SelectItem key={field.id} value={field.id}>
                              <div className="flex items-center gap-2">
                                {getFieldIcon(field.type, "h-4 w-4")}
                                {field.name}
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    
                    {groupSettings.subGroupConfig && (
                      <div className="space-y-3 pl-4 border-l-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Sort sub-groups</Label>
                          <RadioGroup
                            value={groupSettings.subGroupConfig.sortDirection}
                            onValueChange={(value) => 
                              handleConfigUpdate({ sortDirection: value as 'asc' | 'desc' }, true)
                            }
                            className="flex items-center gap-4"
                          >
                            <div className="flex items-center gap-1">
                              <RadioGroupItem value="asc" id="sub-asc" />
                              <Label htmlFor="sub-asc" className="text-xs cursor-pointer">
                                A → Z
                              </Label>
                            </div>
                            <div className="flex items-center gap-1">
                              <RadioGroupItem value="desc" id="sub-desc" />
                              <Label htmlFor="sub-desc" className="text-xs cursor-pointer">
                                Z → A
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {/* Layout Options */}
              <Separator />
              <div className="space-y-3">
                <Label className="text-sm font-medium">Layout</Label>
                <div className="grid grid-cols-3 gap-2">
                  {GROUP_LAYOUTS.map((layout) => (
                    <button
                      key={layout.id}
                      onClick={() => handleLayoutChange(layout.id as any)}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-colors text-center",
                        groupSettings.groupLayout === layout.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                          : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                    >
                      <div className="text-2xl mb-1">{layout.icon}</div>
                      <p className="text-xs font-medium">{layout.label}</p>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Summary Fields */}
              {summaryCapableFields.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Summary fields</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Show aggregated values for each group
                      </p>
                    </div>
                    <div className="space-y-2">
                      {summaryCapableFields.map((field) => (
                        <label
                          key={field.id}
                          className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={(groupSettings.summaryFields || []).includes(field.id)}
                            onChange={() => handleSummaryFieldToggle(field.id)}
                            className="rounded"
                          />
                          <div className="flex items-center gap-2 flex-1">
                            {getFieldIcon(field.type, "h-4 w-4")}
                            <span className="text-sm">{field.name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Sum
                          </Badge>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              {/* Additional Options */}
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs">Hide ungrouped records</Label>
                    <p className="text-xs text-muted-foreground">
                      Don't show records without a group value
                    </p>
                  </div>
                  <Switch
                    checked={groupSettings.hideUngrouped}
                    onCheckedChange={(checked) =>
                      onGroupSettingsChange({ ...groupSettings, hideUngrouped: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
        )}
        
        {onApply && groupSettings.enabled && (
          <div className="p-4 border-t">
            <Button
              className="w-full"
              onClick={() => {
                onApply();
                setIsOpen(false);
              }}
            >
              Apply Grouping
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}