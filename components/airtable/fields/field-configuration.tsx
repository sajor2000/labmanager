'use client';

import React, { useState } from 'react';
import { 
  Settings, Plus, Trash2, GripVertical, 
  Lock, Eye, EyeOff, Copy, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FIELD_DEFINITIONS, 
  FieldType, 
  getFieldIcon,
  getFieldsByCategory 
} from './field-types';

interface FieldConfig {
  id: string;
  name: string;
  type: FieldType;
  description?: string;
  required: boolean;
  unique: boolean;
  hidden: boolean;
  readonly: boolean;
  defaultValue?: any;
  options?: any;
  validation?: any;
  position: number;
}

interface FieldConfigurationProps {
  fields: FieldConfig[];
  onFieldsChange: (fields: FieldConfig[]) => void;
  allowedTypes?: FieldType[];
  maxFields?: number;
  className?: string;
}

export function FieldConfiguration({
  fields,
  onFieldsChange,
  allowedTypes,
  maxFields = 50,
  className,
}: FieldConfigurationProps) {
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const [editingField, setEditingField] = useState<FieldConfig | null>(null);
  const [selectedType, setSelectedType] = useState<FieldType | null>(null);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldDescription, setNewFieldDescription] = useState('');
  
  const handleAddField = () => {
    if (!selectedType || !newFieldName.trim()) return;
    
    const newField: FieldConfig = {
      id: `field_${Date.now()}`,
      name: newFieldName,
      type: selectedType,
      description: newFieldDescription,
      required: false,
      unique: false,
      hidden: false,
      readonly: false,
      position: fields.length,
      options: getDefaultOptions(selectedType),
    };
    
    onFieldsChange([...fields, newField]);
    setIsAddFieldOpen(false);
    setSelectedType(null);
    setNewFieldName('');
    setNewFieldDescription('');
  };
  
  const handleUpdateField = (fieldId: string, updates: Partial<FieldConfig>) => {
    onFieldsChange(
      fields.map(f => f.id === fieldId ? { ...f, ...updates } : f)
    );
  };
  
  const handleDeleteField = (fieldId: string) => {
    onFieldsChange(fields.filter(f => f.id !== fieldId));
  };
  
  const handleDuplicateField = (field: FieldConfig) => {
    const duplicatedField: FieldConfig = {
      ...field,
      id: `field_${Date.now()}`,
      name: `${field.name} (Copy)`,
      position: fields.length,
    };
    onFieldsChange([...fields, duplicatedField]);
  };
  
  const handleReorderFields = (fromIndex: number, toIndex: number) => {
    const reorderedFields = [...fields];
    const [movedField] = reorderedFields.splice(fromIndex, 1);
    reorderedFields.splice(toIndex, 0, movedField);
    
    // Update positions
    const updatedFields = reorderedFields.map((f, i) => ({ ...f, position: i }));
    onFieldsChange(updatedFields);
  };
  
  const getDefaultOptions = (type: FieldType): any => {
    switch (type) {
      case 'CURRENCY':
        return { currency: 'USD', precision: 2 };
      case 'PERCENT':
        return { precision: 0 };
      case 'DATE':
      case 'DATE_TIME':
        return { format: 'MMM d, yyyy', includeTime: type === 'DATE_TIME' };
      case 'SINGLE_SELECT':
      case 'MULTI_SELECT':
        return { 
          choices: [
            { id: '1', name: 'Option 1', color: '#3B82F6' },
            { id: '2', name: 'Option 2', color: '#10B981' },
            { id: '3', name: 'Option 3', color: '#F59E0B' },
          ]
        };
      case 'RATING':
        return { max: 5, icon: 'star' };
      case 'AUTO_NUMBER':
        return { prefix: '', suffix: '', startFrom: 1 };
      default:
        return {};
    }
  };
  
  const availableTypes = allowedTypes || Object.keys(FIELD_DEFINITIONS) as FieldType[];
  const canAddMore = fields.length < maxFields;
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Fields</h3>
          <p className="text-sm text-muted-foreground">
            Configure fields for your table ({fields.length}/{maxFields})
          </p>
        </div>
        <Dialog open={isAddFieldOpen} onOpenChange={setIsAddFieldOpen}>
          <DialogTrigger asChild>
            <Button disabled={!canAddMore}>
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Field</DialogTitle>
              <DialogDescription>
                Choose a field type and configure its properties
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                <TabsTrigger value="computed">Computed</TabsTrigger>
                <TabsTrigger value="system">System</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <ScrollArea className="h-[200px] border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-2">
                    {getFieldsByCategory('basic')
                      .filter(f => availableTypes.includes(f.type))
                      .map((field) => (
                        <button
                          key={field.type}
                          onClick={() => setSelectedType(field.type)}
                          className={cn(
                            "flex items-center gap-2 p-3 rounded-lg border text-left transition-colors",
                            selectedType === field.type
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                              : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                          )}
                        >
                          <span className={field.color}>{field.icon}</span>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{field.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {field.description}
                            </p>
                          </div>
                        </button>
                      ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-4">
                <ScrollArea className="h-[200px] border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-2">
                    {getFieldsByCategory('advanced')
                      .filter(f => availableTypes.includes(f.type))
                      .map((field) => (
                        <button
                          key={field.type}
                          onClick={() => setSelectedType(field.type)}
                          className={cn(
                            "flex items-center gap-2 p-3 rounded-lg border text-left transition-colors relative",
                            selectedType === field.type
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                              : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                          )}
                        >
                          <span className={field.color}>{field.icon}</span>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{field.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {field.description}
                            </p>
                          </div>
                          {field.isNew && (
                            <Badge className="absolute top-1 right-1 text-[10px]" variant="default">
                              NEW
                            </Badge>
                          )}
                        </button>
                      ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="computed" className="space-y-4">
                <ScrollArea className="h-[200px] border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-2">
                    {getFieldsByCategory('computed')
                      .filter(f => availableTypes.includes(f.type))
                      .map((field) => (
                        <button
                          key={field.type}
                          onClick={() => setSelectedType(field.type)}
                          className={cn(
                            "flex items-center gap-2 p-3 rounded-lg border text-left transition-colors relative",
                            selectedType === field.type
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                              : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                          )}
                        >
                          <span className={field.color}>{field.icon}</span>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{field.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {field.description}
                            </p>
                          </div>
                          {field.isPremium && (
                            <Badge className="absolute top-1 right-1 text-[10px]" variant="secondary">
                              PRO
                            </Badge>
                          )}
                        </button>
                      ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="system" className="space-y-4">
                <ScrollArea className="h-[200px] border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-2">
                    {getFieldsByCategory('system')
                      .filter(f => availableTypes.includes(f.type))
                      .map((field) => (
                        <button
                          key={field.type}
                          onClick={() => setSelectedType(field.type)}
                          className={cn(
                            "flex items-center gap-2 p-3 rounded-lg border text-left transition-colors",
                            selectedType === field.type
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                              : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                          )}
                        >
                          <span className={field.color}>{field.icon}</span>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{field.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {field.description}
                            </p>
                          </div>
                        </button>
                      ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
            
            {selectedType && (
              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="field-name">Field Name</Label>
                  <Input
                    id="field-name"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    placeholder="Enter field name..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="field-description">Description (Optional)</Label>
                  <Textarea
                    id="field-description"
                    value={newFieldDescription}
                    onChange={(e) => setNewFieldDescription(e.target.value)}
                    placeholder="Describe what this field is for..."
                    rows={2}
                  />
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddFieldOpen(false);
                  setSelectedType(null);
                  setNewFieldName('');
                  setNewFieldDescription('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddField}
                disabled={!selectedType || !newFieldName.trim()}
              >
                Add Field
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Fields List */}
      <div className="space-y-2">
        {fields.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">No fields configured</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add fields to define your data structure
            </p>
          </div>
        ) : (
          fields
            .sort((a, b) => a.position - b.position)
            .map((field, index) => (
              <div
                key={field.id}
                className="flex items-center gap-2 p-3 border rounded-lg bg-white dark:bg-gray-800"
              >
                <button className="cursor-move">
                  <GripVertical className="h-4 w-4 text-gray-400" />
                </button>
                
                <div className="flex items-center gap-2 flex-1">
                  {getFieldIcon(field.type, "h-4 w-4")}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{field.name}</p>
                    {field.description && (
                      <p className="text-xs text-muted-foreground">
                        {field.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {field.required && (
                      <Badge variant="secondary" className="text-xs">
                        Required
                      </Badge>
                    )}
                    {field.unique && (
                      <Badge variant="secondary" className="text-xs">
                        Unique
                      </Badge>
                    )}
                    {field.readonly && (
                      <Lock className="h-3 w-3 text-gray-400" />
                    )}
                    {field.hidden && (
                      <EyeOff className="h-3 w-3 text-gray-400" />
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingField(field)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDuplicateField(field)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteField(field.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}