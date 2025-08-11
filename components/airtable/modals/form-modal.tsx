'use client';

import React, { useState } from 'react';
import { 
  X, Save, Send, Eye, Copy, Settings, 
  Share2, Lock, Globe, ChevronRight, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FieldEditor } from '../fields/field-editor';
import { FieldRenderer } from '../fields/field-renderer';
import type { FieldType } from '../fields/field-types';
import { validateField, type FieldValidationConfig } from '../fields/field-validation';

interface FormField {
  id: string;
  name: string;
  type: FieldType;
  description?: string;
  required: boolean;
  options?: any;
  validation?: FieldValidationConfig;
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
  position: number;
  width: 'full' | 'half';
  section?: string;
}

interface FormSection {
  id: string;
  name: string;
  description?: string;
  position: number;
}

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  fields: FormField[];
  sections?: FormSection[];
  onSubmit: (data: any) => void;
  submitLabel?: string;
  mode?: 'create' | 'edit' | 'view';
  initialValues?: any;
  showPreview?: boolean;
  publicAccess?: boolean;
  className?: string;
}

export function FormModal({
  isOpen,
  onClose,
  title = 'New Record',
  description,
  fields,
  sections = [],
  onSubmit,
  submitLabel = 'Submit',
  mode = 'create',
  initialValues = {},
  showPreview = false,
  publicAccess = false,
  className,
}: FormModalProps) {
  const [activeTab, setActiveTab] = useState<'form' | 'preview' | 'settings'>('form');
  const [formData, setFormData] = useState<any>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Form settings
  const [formSettings, setFormSettings] = useState({
    title,
    description,
    submitLabel,
    successMessage: 'Thank you for your submission!',
    redirectUrl: '',
    allowMultipleSubmissions: false,
    requireAuthentication: false,
    collectEmail: true,
    sendConfirmationEmail: false,
    limitSubmissions: false,
    maxSubmissions: 100,
    closeDate: null as Date | null,
  });
  
  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [fieldId]: value }));
    
    // Clear error for this field
    if (errors[fieldId]) {
      setErrors((prev) => {
        const { [fieldId]: _, ...rest } = prev;
        return rest;
      });
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    fields.forEach((field) => {
      // Check required fields
      if (field.required && !formData[field.id]) {
        newErrors[field.id] = `${field.name} is required`;
        return;
      }
      
      // Validate field value
      if (formData[field.id] && field.validation) {
        const result = validateField(field.type, formData[field.id], field.validation);
        if (!result.success) {
          newErrors[field.id] = result.error || 'Invalid value';
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      const element = document.getElementById(`field-${firstErrorField}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getFieldsBySection = (sectionId?: string) => {
    return fields
      .filter(f => f.section === sectionId)
      .sort((a, b) => a.position - b.position);
  };
  
  const shareUrl = `${window.location.origin}/form/${Date.now()}`;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("max-w-4xl max-h-[90vh]", className)}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle>{formSettings.title}</DialogTitle>
              {formSettings.description && (
                <DialogDescription className="mt-1">
                  {formSettings.description}
                </DialogDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              {publicAccess && (
                <Badge variant="secondary">
                  <Globe className="h-3 w-3 mr-1" />
                  Public
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShareModal(true)}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="form">Form</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="form" className="mt-4">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-6">
                {sections.length > 0 ? (
                  // Render with sections
                  <>
                    {sections.sort((a, b) => a.position - b.position).map((section) => (
                      <div key={section.id} className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold">{section.name}</h3>
                          {section.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {section.description}
                            </p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {getFieldsBySection(section.id).map((field) => (
                            <div
                              key={field.id}
                              id={`field-${field.id}`}
                              className={cn(
                                "space-y-2",
                                field.width === 'full' && "col-span-2"
                              )}
                            >
                              <Label htmlFor={field.id}>
                                {field.name}
                                {field.required && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                              </Label>
                              {field.description && (
                                <p className="text-xs text-muted-foreground">
                                  {field.description}
                                </p>
                              )}
                              <FieldEditor
                                type={field.type}
                                value={formData[field.id]}
                                options={field.options}
                                onSave={(value) => handleFieldChange(field.id, value)}
                                onCancel={() => {}}
                                autoFocus={false}
                              />
                              {errors[field.id] && (
                                <p className="text-xs text-red-500">
                                  {errors[field.id]}
                                </p>
                              )}
                              {field.helpText && (
                                <p className="text-xs text-muted-foreground">
                                  {field.helpText}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                        <Separator />
                      </div>
                    ))}
                    
                    {/* Fields without section */}
                    {getFieldsBySection(undefined).length > 0 && (
                      <div className="grid grid-cols-2 gap-4">
                        {getFieldsBySection(undefined).map((field) => (
                          <div
                            key={field.id}
                            id={`field-${field.id}`}
                            className={cn(
                              "space-y-2",
                              field.width === 'full' && "col-span-2"
                            )}
                          >
                            <Label htmlFor={field.id}>
                              {field.name}
                              {field.required && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </Label>
                            {field.description && (
                              <p className="text-xs text-muted-foreground">
                                {field.description}
                              </p>
                            )}
                            <FieldEditor
                              type={field.type}
                              value={formData[field.id]}
                              options={field.options}
                              onSave={(value) => handleFieldChange(field.id, value)}
                              onCancel={() => {}}
                              autoFocus={false}
                            />
                            {errors[field.id] && (
                              <p className="text-xs text-red-500">
                                {errors[field.id]}
                              </p>
                            )}
                            {field.helpText && (
                              <p className="text-xs text-muted-foreground">
                                {field.helpText}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  // Render without sections
                  <div className="grid grid-cols-2 gap-4">
                    {fields.sort((a, b) => a.position - b.position).map((field) => (
                      <div
                        key={field.id}
                        id={`field-${field.id}`}
                        className={cn(
                          "space-y-2",
                          field.width === 'full' && "col-span-2"
                        )}
                      >
                        <Label htmlFor={field.id}>
                          {field.name}
                          {field.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </Label>
                        {field.description && (
                          <p className="text-xs text-muted-foreground">
                            {field.description}
                          </p>
                        )}
                        <FieldEditor
                          type={field.type}
                          value={formData[field.id]}
                          options={field.options}
                          onSave={(value) => handleFieldChange(field.id, value)}
                          onCancel={() => {}}
                          autoFocus={false}
                        />
                        {errors[field.id] && (
                          <p className="text-xs text-red-500">
                            {errors[field.id]}
                          </p>
                        )}
                        {field.helpText && (
                          <p className="text-xs text-muted-foreground">
                            {field.helpText}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="preview" className="mt-4">
            <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-900">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold mb-2">{formSettings.title}</h2>
                {formSettings.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {formSettings.description}
                  </p>
                )}
                
                <Alert className="mb-6">
                  <AlertDescription>
                    This is how your form will appear to users
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4">
                  {fields.slice(0, 3).map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label>
                        {field.name}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <div className="p-2 border rounded-md bg-white dark:bg-gray-800">
                        <FieldRenderer
                          type={field.type}
                          value={formData[field.id] || field.defaultValue}
                          options={field.options}
                        />
                      </div>
                    </div>
                  ))}
                  
                  {fields.length > 3 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      + {fields.length - 3} more fields
                    </p>
                  )}
                </div>
                
                <Button className="w-full mt-6">
                  {formSettings.submitLabel}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="mt-4">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-6">
                {/* Basic Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Settings</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="form-title">Form Title</Label>
                    <Input
                      id="form-title"
                      value={formSettings.title}
                      onChange={(e) => setFormSettings(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="form-description">Description</Label>
                    <Textarea
                      id="form-description"
                      value={formSettings.description || ''}
                      onChange={(e) => setFormSettings(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="submit-label">Submit Button Text</Label>
                    <Input
                      id="submit-label"
                      value={formSettings.submitLabel}
                      onChange={(e) => setFormSettings(prev => ({ ...prev, submitLabel: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="success-message">Success Message</Label>
                    <Textarea
                      id="success-message"
                      value={formSettings.successMessage}
                      onChange={(e) => setFormSettings(prev => ({ ...prev, successMessage: e.target.value }))}
                      rows={2}
                    />
                  </div>
                </div>
                
                <Separator />
                
                {/* Access Control */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Access Control</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Authentication</Label>
                      <p className="text-xs text-muted-foreground">
                        Users must sign in to submit
                      </p>
                    </div>
                    <Switch
                      checked={formSettings.requireAuthentication}
                      onCheckedChange={(checked) =>
                        setFormSettings(prev => ({ ...prev, requireAuthentication: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow Multiple Submissions</Label>
                      <p className="text-xs text-muted-foreground">
                        Users can submit more than once
                      </p>
                    </div>
                    <Switch
                      checked={formSettings.allowMultipleSubmissions}
                      onCheckedChange={(checked) =>
                        setFormSettings(prev => ({ ...prev, allowMultipleSubmissions: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Limit Submissions</Label>
                      <p className="text-xs text-muted-foreground">
                        Set a maximum number of submissions
                      </p>
                    </div>
                    <Switch
                      checked={formSettings.limitSubmissions}
                      onCheckedChange={(checked) =>
                        setFormSettings(prev => ({ ...prev, limitSubmissions: checked }))
                      }
                    />
                  </div>
                  
                  {formSettings.limitSubmissions && (
                    <div className="space-y-2 ml-6">
                      <Label htmlFor="max-submissions">Maximum Submissions</Label>
                      <Input
                        id="max-submissions"
                        type="number"
                        value={formSettings.maxSubmissions}
                        onChange={(e) =>
                          setFormSettings(prev => ({ ...prev, maxSubmissions: parseInt(e.target.value) }))
                        }
                      />
                    </div>
                  )}
                </div>
                
                <Separator />
                
                {/* Notifications */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Notifications</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Collect Email Address</Label>
                      <p className="text-xs text-muted-foreground">
                        Ask for user's email
                      </p>
                    </div>
                    <Switch
                      checked={formSettings.collectEmail}
                      onCheckedChange={(checked) =>
                        setFormSettings(prev => ({ ...prev, collectEmail: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Send Confirmation Email</Label>
                      <p className="text-xs text-muted-foreground">
                        Email users after submission
                      </p>
                    </div>
                    <Switch
                      checked={formSettings.sendConfirmationEmail}
                      onCheckedChange={(checked) =>
                        setFormSettings(prev => ({ ...prev, sendConfirmationEmail: checked }))
                      }
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
      
      {/* Share Modal */}
      {showShareModal && (
        <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share Form</DialogTitle>
              <DialogDescription>
                Share this form with others using the link below
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Input value={shareUrl} readOnly />
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              <Alert>
                <AlertDescription>
                  Anyone with this link can access and submit this form
                </AlertDescription>
              </Alert>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}