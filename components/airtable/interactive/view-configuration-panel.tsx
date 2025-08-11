'use client';

import React, { useState } from 'react';
import { 
  Settings2, Save, Copy, Trash2, Lock, 
  Globe, Eye, EyeOff, Grid3x3, List,
  Palette, Type, Hash, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ViewType, ViewConfiguration } from '@/types';
import type { FilterGroup } from '../panels/filter-panel';
import type { SortRule } from './sort-configuration';
import type { GroupSettings } from './group-configuration';

interface ViewConfig extends ViewConfiguration {
  filters?: FilterGroup[];
  sortRules?: SortRule[];
  groupSettings?: GroupSettings;
  visibleFields?: string[];
  fieldWidths?: Record<string, number>;
  rowHeight?: 'compact' | 'normal' | 'comfortable';
  showGridLines?: boolean;
  alternateRowColors?: boolean;
  wrapText?: boolean;
  cardSize?: 'small' | 'medium' | 'large';
  coverField?: string;
  colorField?: string;
  permissions?: {
    canEdit: boolean;
    canDelete: boolean;
    canShare: boolean;
    canDuplicate: boolean;
  };
}

interface ViewConfigurationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: ViewConfig;
  availableFields: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  onSave: (config: ViewConfig) => void;
  onDelete?: (viewId: string) => void;
  onDuplicate?: (config: ViewConfig) => void;
  className?: string;
}

const VIEW_PRESETS = [
  { id: 'default', name: 'Default', icon: <Grid3x3 className="h-4 w-4" /> },
  { id: 'compact', name: 'Compact', icon: <List className="h-4 w-4" /> },
  { id: 'cards', name: 'Cards', icon: <Grid3x3 className="h-4 w-4" /> },
  { id: 'timeline', name: 'Timeline', icon: <Hash className="h-4 w-4" /> },
];

const ROW_HEIGHTS = [
  { value: 'compact', label: 'Compact', height: 32 },
  { value: 'normal', label: 'Normal', height: 48 },
  { value: 'comfortable', label: 'Comfortable', height: 64 },
];

const CARD_SIZES = [
  { value: 'small', label: 'Small', width: 200 },
  { value: 'medium', label: 'Medium', width: 300 },
  { value: 'large', label: 'Large', width: 400 },
];

export function ViewConfigurationPanel({
  isOpen,
  onClose,
  currentView,
  availableFields,
  onSave,
  onDelete,
  onDuplicate,
  className,
}: ViewConfigurationPanelProps) {
  const [config, setConfig] = useState<ViewConfig>(currentView);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const updateConfig = (updates: Partial<ViewConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };
  
  const handleFieldVisibilityToggle = (fieldId: string) => {
    const visibleFields = config.visibleFields || availableFields.map(f => f.id);
    const updated = visibleFields.includes(fieldId)
      ? visibleFields.filter(f => f !== fieldId)
      : [...visibleFields, fieldId];
    
    updateConfig({ visibleFields: updated });
  };
  
  const handleFieldWidthChange = (fieldId: string, width: number) => {
    updateConfig({
      fieldWidths: {
        ...config.fieldWidths,
        [fieldId]: width,
      },
    });
  };
  
  const handleSave = () => {
    onSave(config);
    setHasChanges(false);
    onClose();
  };
  
  const handleDelete = () => {
    if (config.id) {
      onDelete?.(config.id);
      onClose();
    }
  };
  
  const handleDuplicate = () => {
    const duplicatedConfig = {
      ...config,
      id: `view_${Date.now()}`,
      name: `${config.name} (Copy)`,
      isDefault: false,
    };
    onDuplicate?.(duplicatedConfig);
    setConfig(duplicatedConfig);
  };
  
  const handlePresetApply = (presetId: string) => {
    switch (presetId) {
      case 'compact':
        updateConfig({
          rowHeight: 'compact',
          showGridLines: false,
          alternateRowColors: false,
          wrapText: false,
        });
        break;
      case 'cards':
        updateConfig({
          viewType: 'GALLERY',
          cardSize: 'medium',
          showGridLines: false,
        });
        break;
      case 'timeline':
        updateConfig({
          viewType: 'TIMELINE',
          groupSettings: {
            enabled: true,
            groupLayout: 'horizontal',
            hideUngrouped: false,
            summaryFields: [],
          },
        });
        break;
      default:
        // Reset to defaults
        updateConfig({
          rowHeight: 'normal',
          showGridLines: true,
          alternateRowColors: true,
          wrapText: true,
        });
    }
  };
  
  const visibleFieldCount = (config.visibleFields || availableFields.map(f => f.id)).length;
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={cn("max-w-3xl max-h-[80vh]", className)}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>View Configuration</DialogTitle>
                <DialogDescription>
                  Customize how your data is displayed
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                {config.isShared && (
                  <Badge variant="secondary">
                    <Globe className="h-3 w-3 mr-1" />
                    Shared
                  </Badge>
                )}
                {config.isDefault && (
                  <Badge variant="secondary">
                    Default
                  </Badge>
                )}
              </div>
            </div>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="fields">Fields</TabsTrigger>
              <TabsTrigger value="display">Display</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
            </TabsList>
            
            <ScrollArea className="h-[400px] mt-4">
              <TabsContent value="general" className="space-y-4 px-1">
                <div className="space-y-2">
                  <Label htmlFor="view-name">View Name</Label>
                  <Input
                    id="view-name"
                    value={config.name}
                    onChange={(e) => updateConfig({ name: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="view-type">View Type</Label>
                  <Select
                    value={config.viewType}
                    onValueChange={(value) => updateConfig({ viewType: value as ViewType })}
                  >
                    <SelectTrigger id="view-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TABLE">Table</SelectItem>
                      <SelectItem value="KANBAN">Kanban</SelectItem>
                      <SelectItem value="CALENDAR">Calendar</SelectItem>
                      <SelectItem value="GALLERY">Gallery</SelectItem>
                      <SelectItem value="TIMELINE">Timeline</SelectItem>
                      <SelectItem value="GANTT">Gantt</SelectItem>
                      <SelectItem value="FORM">Form</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Set as Default View</Label>
                    <p className="text-xs text-muted-foreground">
                      This view will load by default
                    </p>
                  </div>
                  <Switch
                    checked={config.isDefault}
                    onCheckedChange={(checked) => updateConfig({ isDefault: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Share with Team</Label>
                    <p className="text-xs text-muted-foreground">
                      Make this view available to all team members
                    </p>
                  </div>
                  <Switch
                    checked={config.isShared}
                    onCheckedChange={(checked) => updateConfig({ isShared: checked })}
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Apply Preset</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {VIEW_PRESETS.map((preset) => (
                      <Button
                        key={preset.id}
                        variant="outline"
                        onClick={() => handlePresetApply(preset.id)}
                        className="justify-start"
                      >
                        {preset.icon}
                        {preset.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="fields" className="space-y-4 px-1">
                <div className="flex items-center justify-between mb-2">
                  <Label>Visible Fields ({visibleFieldCount}/{availableFields.length})</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateConfig({ 
                        visibleFields: availableFields.map(f => f.id) 
                      })}
                    >
                      Show all
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateConfig({ visibleFields: [] })}
                    >
                      Hide all
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {availableFields.map((field) => {
                    const isVisible = (config.visibleFields || availableFields.map(f => f.id))
                      .includes(field.id);
                    const width = config.fieldWidths?.[field.id] || 150;
                    
                    return (
                      <div
                        key={field.id}
                        className="flex items-center gap-3 p-2 rounded-lg border"
                      >
                        <Switch
                          checked={isVisible}
                          onCheckedChange={() => handleFieldVisibilityToggle(field.id)}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{field.name}</p>
                          <p className="text-xs text-muted-foreground">{field.type}</p>
                        </div>
                        {isVisible && (
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Width:</Label>
                            <Slider
                              value={[width]}
                              onValueChange={([value]) => 
                                handleFieldWidthChange(field.id, value)
                              }
                              min={50}
                              max={400}
                              step={10}
                              className="w-24"
                            />
                            <span className="text-xs w-12">{width}px</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
              
              <TabsContent value="display" className="space-y-4 px-1">
                {config.viewType === 'TABLE' && (
                  <>
                    <div className="space-y-2">
                      <Label>Row Height</Label>
                      <RadioGroup
                        value={config.rowHeight || 'normal'}
                        onValueChange={(value) => updateConfig({ rowHeight: value as any })}
                      >
                        {ROW_HEIGHTS.map((height) => (
                          <div key={height.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={height.value} id={height.value} />
                            <Label htmlFor={height.value} className="flex items-center gap-2">
                              {height.label}
                              <span className="text-xs text-muted-foreground">
                                ({height.height}px)
                              </span>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Show Grid Lines</Label>
                        <Switch
                          checked={config.showGridLines ?? true}
                          onCheckedChange={(checked) => 
                            updateConfig({ showGridLines: checked })
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label>Alternate Row Colors</Label>
                        <Switch
                          checked={config.alternateRowColors ?? true}
                          onCheckedChange={(checked) => 
                            updateConfig({ alternateRowColors: checked })
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label>Wrap Text</Label>
                        <Switch
                          checked={config.wrapText ?? true}
                          onCheckedChange={(checked) => 
                            updateConfig({ wrapText: checked })
                          }
                        />
                      </div>
                    </div>
                  </>
                )}
                
                {(config.viewType === 'KANBAN' || config.viewType === 'GALLERY') && (
                  <>
                    <div className="space-y-2">
                      <Label>Card Size</Label>
                      <RadioGroup
                        value={config.cardSize || 'medium'}
                        onValueChange={(value) => updateConfig({ cardSize: value as any })}
                      >
                        {CARD_SIZES.map((size) => (
                          <div key={size.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={size.value} id={`card-${size.value}`} />
                            <Label htmlFor={`card-${size.value}`} className="flex items-center gap-2">
                              {size.label}
                              <span className="text-xs text-muted-foreground">
                                ({size.width}px wide)
                              </span>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <Label>Cover Image Field</Label>
                      <Select
                        value={config.coverField || ''}
                        onValueChange={(value) => updateConfig({ coverField: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {availableFields
                            .filter(f => f.type === 'ATTACHMENT' || f.type === 'URL')
                            .map((field) => (
                              <SelectItem key={field.id} value={field.id}>
                                {field.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Color By Field</Label>
                      <Select
                        value={config.colorField || ''}
                        onValueChange={(value) => updateConfig({ colorField: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {availableFields
                            .filter(f => ['SINGLE_SELECT', 'STATUS', 'PRIORITY'].includes(f.type))
                            .map((field) => (
                              <SelectItem key={field.id} value={field.id}>
                                {field.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="permissions" className="space-y-4 px-1">
                <Alert>
                  <AlertDescription>
                    Control who can interact with this view
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Can Edit</Label>
                      <p className="text-xs text-muted-foreground">
                        Allow users to modify this view
                      </p>
                    </div>
                    <Switch
                      checked={config.permissions?.canEdit ?? true}
                      onCheckedChange={(checked) => 
                        updateConfig({ 
                          permissions: { ...config.permissions, canEdit: checked } 
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Can Delete</Label>
                      <p className="text-xs text-muted-foreground">
                        Allow users to delete this view
                      </p>
                    </div>
                    <Switch
                      checked={config.permissions?.canDelete ?? false}
                      onCheckedChange={(checked) => 
                        updateConfig({ 
                          permissions: { ...config.permissions, canDelete: checked } 
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Can Share</Label>
                      <p className="text-xs text-muted-foreground">
                        Allow users to share this view
                      </p>
                    </div>
                    <Switch
                      checked={config.permissions?.canShare ?? true}
                      onCheckedChange={(checked) => 
                        updateConfig({ 
                          permissions: { ...config.permissions, canShare: checked } 
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Can Duplicate</Label>
                      <p className="text-xs text-muted-foreground">
                        Allow users to duplicate this view
                      </p>
                    </div>
                    <Switch
                      checked={config.permissions?.canDuplicate ?? true}
                      onCheckedChange={(checked) => 
                        updateConfig({ 
                          permissions: { ...config.permissions, canDuplicate: checked } 
                        })
                      }
                    />
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
          
          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              <div className="flex gap-2">
                {onDelete && (
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
                {onDuplicate && (
                  <Button
                    variant="outline"
                    onClick={handleDuplicate}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={!hasChanges}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete View?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{config.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Delete View
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}