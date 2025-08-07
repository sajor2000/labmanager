'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { X, Plus } from 'lucide-react';
import { showToast } from '@/components/ui/toast';

interface IdeaCreationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  labId: string;
  userId: string;
}

export function IdeaCreationForm({ isOpen, onClose, onSubmit, labId, userId }: IdeaCreationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'RESEARCH_QUESTION',
    priority: 'MEDIUM',
    feasibilityScore: 5,
    impactScore: 5,
    resourceRequirement: 'MEDIUM',
    estimatedDuration: '',
    requiredSkills: [] as string[],
    potentialCollaborators: [] as string[],
    tags: [] as string[],
  });
  
  const [newSkill, setNewSkill] = useState('');
  const [newCollaborator, setNewCollaborator] = useState('');
  const [newTag, setNewTag] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    if (!formData.title.trim() || !formData.description.trim()) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Title and description are required',
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        labId,
        createdById: userId,
      });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'RESEARCH_QUESTION',
        priority: 'MEDIUM',
        feasibilityScore: 5,
        impactScore: 5,
        resourceRequirement: 'MEDIUM',
        estimatedDuration: '',
        requiredSkills: [],
        potentialCollaborators: [],
        tags: [],
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to create idea:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const addItem = (field: 'requiredSkills' | 'potentialCollaborators' | 'tags', value: string) => {
    if (value.trim() && !formData[field].includes(value.trim())) {
      setFormData({
        ...formData,
        [field]: [...formData[field], value.trim()],
      });
    }
  };
  
  const removeItem = (field: 'requiredSkills' | 'potentialCollaborators' | 'tags', index: number) => {
    setFormData({
      ...formData,
      [field]: formData[field].filter((_, i) => i !== index),
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Idea</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter a clear, concise title for your idea"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your idea in detail..."
              rows={4}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RESEARCH_QUESTION">Research Question</SelectItem>
                  <SelectItem value="METHOD_IMPROVEMENT">Method Improvement</SelectItem>
                  <SelectItem value="COLLABORATION">Collaboration</SelectItem>
                  <SelectItem value="GRANT_OPPORTUNITY">Grant Opportunity</SelectItem>
                  <SelectItem value="TECHNOLOGY">Technology</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="feasibility">Feasibility Score ({formData.feasibilityScore}/10)</Label>
              <Slider
                id="feasibility"
                min={1}
                max={10}
                step={1}
                value={[formData.feasibilityScore]}
                onValueChange={(value) => setFormData({ ...formData, feasibilityScore: value[0] })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="impact">Impact Score ({formData.impactScore}/10)</Label>
              <Slider
                id="impact"
                min={1}
                max={10}
                step={1}
                value={[formData.impactScore]}
                onValueChange={(value) => setFormData({ ...formData, impactScore: value[0] })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="resources">Resource Requirement</Label>
              <Select
                value={formData.resourceRequirement}
                onValueChange={(value) => setFormData({ ...formData, resourceRequirement: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Estimated Duration</Label>
              <Input
                id="duration"
                value={formData.estimatedDuration}
                onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                placeholder="e.g., 3 months, 1 year"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Required Skills</Label>
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a skill..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('requiredSkills', newSkill);
                    setNewSkill('');
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  addItem('requiredSkills', newSkill);
                  setNewSkill('');
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.requiredSkills.map((skill, index) => (
                <Badge key={index} variant="secondary">
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeItem('requiredSkills', index)}
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Potential Collaborators</Label>
            <div className="flex gap-2">
              <Input
                value={newCollaborator}
                onChange={(e) => setNewCollaborator(e.target.value)}
                placeholder="Add a collaborator..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('potentialCollaborators', newCollaborator);
                    setNewCollaborator('');
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  addItem('potentialCollaborators', newCollaborator);
                  setNewCollaborator('');
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.potentialCollaborators.map((collaborator, index) => (
                <Badge key={index} variant="secondary">
                  {collaborator}
                  <button
                    type="button"
                    onClick={() => removeItem('potentialCollaborators', index)}
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('tags', newTag);
                    setNewTag('');
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  addItem('tags', newTag);
                  setNewTag('');
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeItem('tags', index)}
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Idea'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}