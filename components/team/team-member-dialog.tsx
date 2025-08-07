'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TeamMemberForm } from './team-member-form';
import { showToast } from '@/components/ui/toast';

interface TeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: any; // Existing member for editing
  onSuccess?: () => void; // Callback after successful save
}

export function TeamMemberDialog({ 
  open, 
  onOpenChange, 
  member,
  onSuccess 
}: TeamMemberDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const url = member 
        ? `/api/users/${member.id}`
        : '/api/users';
      
      const method = member ? 'PUT' : 'POST';
      
      // Prepare the data
      const requestData = {
        ...data,
        name: `${data.firstName} ${data.lastName}`.trim(),
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save team member');
      }

      const savedMember = await response.json();
      
      showToast({
        type: 'success',
        title: member ? 'Member Updated' : 'Member Added',
        message: `${savedMember.name} has been ${member ? 'updated' : 'added to the team'} successfully.`,
      });

      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to save team member',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {member ? 'Edit Team Member' : 'Add New Team Member'}
          </DialogTitle>
          <DialogDescription>
            {member 
              ? 'Update the team member\'s information below.'
              : 'Fill in the information for the new team member.'}
          </DialogDescription>
        </DialogHeader>
        
        <TeamMemberForm
          member={member}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}