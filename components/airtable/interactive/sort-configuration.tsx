'use client';

import React, { useState } from 'react';
import { 
  ArrowUpDown, ArrowUp, ArrowDown, Plus, 
  Trash2, GripVertical, X, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Switch } from '@/components/ui/switch';
import type { FieldType } from '../fields/field-types';
import { getFieldIcon } from '../fields/field-types';

export interface SortRule {
  id: string;
  fieldId: string;
  fieldName: string;
  fieldType: FieldType;
  direction: 'asc' | 'desc';
  isEnabled: boolean;
  priority: number;
}

interface SortConfigurationProps {
  fields: Array<{
    id: string;
    name: string;
    type: FieldType;
    sortable?: boolean;
  }>;
  sortRules: SortRule[];
  onSortRulesChange: (rules: SortRule[]) => void;
  onApply?: () => void;
  maxRules?: number;
  className?: string;
}

interface SortableItemProps {
  rule: SortRule;
  onUpdate: (updates: Partial<SortRule>) => void;
  onRemove: () => void;
}

function SortableItem({ rule, onUpdate, onRemove }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rule.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg border",
        isDragging && "opacity-50",
        !rule.isEnabled && "opacity-60"
      )}
    >
      <button
        className="cursor-move touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </button>
      
      <Switch
        checked={rule.isEnabled}
        onCheckedChange={(checked) => onUpdate({ isEnabled: checked })}
      />
      
      <div className="flex items-center gap-2 flex-1">
        {getFieldIcon(rule.fieldType, "h-4 w-4")}
        <span className="font-medium text-sm">{rule.fieldName}</span>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onUpdate({ 
          direction: rule.direction === 'asc' ? 'desc' : 'asc' 
        })}
        className="gap-1"
      >
        {rule.direction === 'asc' ? (
          <>
            <ArrowUp className="h-3 w-3" />
            <span className="text-xs">A → Z</span>
          </>
        ) : (
          <>
            <ArrowDown className="h-3 w-3" />
            <span className="text-xs">Z → A</span>
          </>
        )}
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-8 w-8 p-0"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function SortConfiguration({
  fields,
  sortRules,
  onSortRulesChange,
  onApply,
  maxRules = 5,
  className,
}: SortConfigurationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  
  const sortableFields = fields.filter(f => f.sortable !== false);
  const availableFields = sortableFields.filter(
    f => !sortRules.find(r => r.fieldId === f.id)
  );
  
  const activeSortCount = sortRules.filter(r => r.isEnabled).length;
  
  const handleAddRule = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    
    const newRule: SortRule = {
      id: `sort_${Date.now()}`,
      fieldId: field.id,
      fieldName: field.name,
      fieldType: field.type,
      direction: 'asc',
      isEnabled: true,
      priority: sortRules.length,
    };
    
    onSortRulesChange([...sortRules, newRule]);
  };
  
  const handleUpdateRule = (ruleId: string, updates: Partial<SortRule>) => {
    onSortRulesChange(
      sortRules.map(r => r.id === ruleId ? { ...r, ...updates } : r)
    );
  };
  
  const handleRemoveRule = (ruleId: string) => {
    const updatedRules = sortRules
      .filter(r => r.id !== ruleId)
      .map((r, index) => ({ ...r, priority: index }));
    onSortRulesChange(updatedRules);
  };
  
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = sortRules.findIndex(r => r.id === active.id);
      const newIndex = sortRules.findIndex(r => r.id === over.id);
      
      const reorderedRules = [...sortRules];
      const [movedRule] = reorderedRules.splice(oldIndex, 1);
      reorderedRules.splice(newIndex, 0, movedRule);
      
      // Update priorities
      const updatedRules = reorderedRules.map((r, index) => ({
        ...r,
        priority: index,
      }));
      
      onSortRulesChange(updatedRules);
    }
    
    setActiveId(null);
  };
  
  const clearAllRules = () => {
    onSortRulesChange([]);
  };
  
  const getDirectionLabel = (direction: 'asc' | 'desc', fieldType: FieldType) => {
    if (fieldType.includes('NUMBER') || fieldType.includes('CURRENCY')) {
      return direction === 'asc' ? '1 → 9' : '9 → 1';
    }
    if (fieldType.includes('DATE')) {
      return direction === 'asc' ? 'Oldest first' : 'Newest first';
    }
    return direction === 'asc' ? 'A → Z' : 'Z → A';
  };
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("gap-2", className)}
        >
          <ArrowUpDown className="h-4 w-4" />
          Sort
          {activeSortCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1">
              {activeSortCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Sort</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sort records by one or more fields
              </p>
            </div>
            {sortRules.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllRules}
                className="text-xs"
              >
                Clear all
              </Button>
            )}
          </div>
        </div>
        
        <ScrollArea className="h-[350px]">
          <div className="p-4 space-y-3">
            {sortRules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ArrowUpDown className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No sort rules configured</p>
                <p className="text-xs mt-1">Add a field below to start sorting</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortRules.map(r => r.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {sortRules.map((rule, index) => (
                      <div key={rule.id}>
                        {index > 0 && (
                          <div className="flex items-center gap-2 py-1">
                            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                            <span className="text-xs text-muted-foreground px-2">
                              then by
                            </span>
                            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                          </div>
                        )}
                        <SortableItem
                          rule={rule}
                          onUpdate={(updates) => handleUpdateRule(rule.id, updates)}
                          onRemove={() => handleRemoveRule(rule.id)}
                        />
                      </div>
                    ))}
                  </div>
                </SortableContext>
                
                <DragOverlay>
                  {activeId && (() => {
                    const rule = sortRules.find(r => r.id === activeId);
                    if (!rule) return null;
                    return (
                      <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg border shadow-lg">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <div className="flex items-center gap-2">
                          {getFieldIcon(rule.fieldType, "h-4 w-4")}
                          <span className="font-medium text-sm">{rule.fieldName}</span>
                        </div>
                      </div>
                    );
                  })()}
                </DragOverlay>
              </DndContext>
            )}
            
            {/* Add Sort Rule */}
            {sortRules.length < maxRules && availableFields.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Add sort rule</Label>
                  <Select onValueChange={handleAddRule}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a field to sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields.map((field) => (
                        <SelectItem key={field.id} value={field.id}>
                          <div className="flex items-center gap-2">
                            {getFieldIcon(field.type, "h-4 w-4")}
                            {field.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            
            {sortRules.length >= maxRules && (
              <div className="text-center py-2">
                <p className="text-xs text-muted-foreground">
                  Maximum of {maxRules} sort rules reached
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {onApply && sortRules.length > 0 && (
          <div className="p-4 border-t">
            <Button
              className="w-full"
              onClick={() => {
                onApply();
                setIsOpen(false);
              }}
              disabled={activeSortCount === 0}
            >
              Apply Sort
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}