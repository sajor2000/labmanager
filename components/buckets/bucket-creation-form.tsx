'use client';

import { useState } from 'react';
import { X, Folder, Palette, FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { showToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface BucketCreationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (bucket: BucketFormData) => void;
  editingBucket?: BucketFormData;
}

export interface BucketFormData {
  id?: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  template?: string;
}

const colorOptions = [
  { value: '#8B5CF6', label: 'Purple', className: 'bg-purple-500' },
  { value: '#3B82F6', label: 'Blue', className: 'bg-blue-500' },
  { value: '#10B981', label: 'Green', className: 'bg-green-500' },
  { value: '#F59E0B', label: 'Yellow', className: 'bg-yellow-500' },
  { value: '#EF4444', label: 'Red', className: 'bg-red-500' },
  { value: '#EC4899', label: 'Pink', className: 'bg-pink-500' },
  { value: '#6366F1', label: 'Indigo', className: 'bg-indigo-500' },
  { value: '#14B8A6', label: 'Teal', className: 'bg-teal-500' },
];

const iconOptions = [
  { value: 'folder', label: 'Folder', icon: Folder },
  { value: 'archive', label: 'Archive', icon: FileText },
  { value: 'trending', label: 'Trending', icon: Sparkles },
];

const templateOptions = [
  { value: 'none', label: 'No Template', description: 'Start with an empty bucket' },
  { value: 'grant-funded', label: 'Grant-Funded Research', description: 'NIH, NSF, and other grants' },
  { value: 'pilot-studies', label: 'Pilot Studies', description: 'Small-scale preliminary research' },
  { value: 'industry', label: 'Industry Sponsored', description: 'Corporate partnerships' },
  { value: 'clinical-trials', label: 'Clinical Trials', description: 'Human subject research' },
  { value: 'manuscripts', label: 'Manuscripts', description: 'Papers in preparation' },
];

export function BucketCreationForm({ 
  isOpen, 
  onClose, 
  onSubmit,
  editingBucket 
}: BucketCreationFormProps) {
  const [formData, setFormData] = useState<BucketFormData>({
    name: editingBucket?.name || '',
    description: editingBucket?.description || '',
    color: editingBucket?.color || '#8B5CF6',
    icon: editingBucket?.icon || 'folder',
    template: 'none',
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof BucketFormData, string>>>({});
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const newErrors: Partial<Record<keyof BucketFormData, string>> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Bucket name is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Submit
    onSubmit?.(formData);
    
    showToast({
      type: 'success',
      title: editingBucket ? 'Bucket updated' : 'Bucket created',
      message: `"${formData.name}" has been ${editingBucket ? 'updated' : 'created'} successfully`,
    });
    
    // Reset form
    setFormData({
      name: '',
      description: '',
      color: '#8B5CF6',
      icon: 'folder',
      template: 'none',
    });
    setErrors({});
    onClose();
  };
  
  const handleTemplateChange = (template: string) => {
    setFormData(prev => ({ ...prev, template }));
    
    // Apply template defaults
    switch (template) {
      case 'grant-funded':
        setFormData(prev => ({
          ...prev,
          name: 'Grant-Funded Projects',
          description: 'Research projects funded by federal grants',
          color: '#3B82F6',
          icon: 'trending',
        }));
        break;
      case 'pilot-studies':
        setFormData(prev => ({
          ...prev,
          name: 'Pilot Studies',
          description: 'Small-scale preliminary research projects',
          color: '#10B981',
          icon: 'folder',
        }));
        break;
      case 'industry':
        setFormData(prev => ({
          ...prev,
          name: 'Industry Partnerships',
          description: 'Corporate-sponsored research collaborations',
          color: '#F59E0B',
          icon: 'trending',
        }));
        break;
      case 'clinical-trials':
        setFormData(prev => ({
          ...prev,
          name: 'Clinical Trials',
          description: 'Human subject research studies',
          color: '#EF4444',
          icon: 'archive',
        }));
        break;
      case 'manuscripts':
        setFormData(prev => ({
          ...prev,
          name: 'Manuscripts',
          description: 'Papers in various stages of preparation',
          color: '#EC4899',
          icon: 'archive',
        }));
        break;
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-2xl rounded-lg bg-white dark:bg-gray-900 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b dark:border-gray-800 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {editingBucket ? 'Edit Bucket' : 'Create New Bucket'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Template Selection (only for new buckets) */}
          {!editingBucket && (
            <div>
              <Label htmlFor="template" className="mb-2">
                Start with a template
              </Label>
              <Select
                value={formData.template}
                onValueChange={handleTemplateChange}
              >
                <SelectTrigger id="template">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templateOptions.map((template) => (
                    <SelectItem key={template.value} value={template.value}>
                      <div>
                        <p className="font-medium">{template.label}</p>
                        <p className="text-xs text-gray-500">{template.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Bucket Name */}
          <div>
            <Label htmlFor="name" className="mb-2">
              Bucket Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, name: e.target.value }));
                setErrors(prev => ({ ...prev, name: undefined }));
              }}
              placeholder="e.g., NIH-Funded Projects"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name}</p>
            )}
          </div>
          
          {/* Description */}
          <div>
            <Label htmlFor="description" className="mb-2">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of what this bucket contains..."
              rows={3}
            />
          </div>
          
          {/* Color and Icon Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Color Selection */}
            <div>
              <Label className="mb-2">Color</Label>
              <div className="grid grid-cols-4 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                    className={cn(
                      "h-10 w-full rounded-lg transition-all",
                      color.className,
                      formData.color === color.value 
                        ? "ring-2 ring-offset-2 ring-gray-900 dark:ring-white" 
                        : "hover:scale-110"
                    )}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
            
            {/* Icon Selection */}
            <div>
              <Label className="mb-2">Icon</Label>
              <div className="grid grid-cols-3 gap-2">
                {iconOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, icon: option.value }))}
                      className={cn(
                        "flex items-center justify-center h-10 rounded-lg border-2 transition-all",
                        formData.icon === option.value
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                          : "border-gray-300 dark:border-gray-700 hover:border-gray-400"
                      )}
                      title={option.label}
                    >
                      <Icon 
                        className="h-5 w-5"
                        style={{ color: formData.color }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Preview */}
          <div>
            <Label className="mb-2">Preview</Label>
            <div className="p-4 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${formData.color}20` }}
                >
                  {iconOptions.find(opt => opt.value === formData.icon)?.icon && (
                    <div style={{ color: formData.color }}>
                      {(() => {
                        const Icon = iconOptions.find(opt => opt.value === formData.icon)?.icon || Folder;
                        return <Icon className="h-5 w-5" />;
                      })()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formData.name || 'Bucket Name'}
                  </p>
                  {formData.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formData.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingBucket ? 'Update Bucket' : 'Create Bucket'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}