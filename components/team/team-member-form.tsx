'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/user-avatar';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { showToast } from '@/components/ui/toast';

const userRoles = [
  { value: 'PRINCIPAL_INVESTIGATOR', label: 'Principal Investigator' },
  { value: 'CO_PRINCIPAL_INVESTIGATOR', label: 'Co-Principal Investigator' },
  { value: 'RESEARCH_MEMBER', label: 'Research Member' },
  { value: 'LAB_ADMINISTRATOR', label: 'Lab Administrator' },
  { value: 'EXTERNAL_COLLABORATOR', label: 'External Collaborator' },
];

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  role: z.string().min(1, 'Role is required'),
  expertise: z.array(z.string()).optional(),
  avatarUrl: z.string().nullable().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface TeamMemberFormProps {
  member?: any; // Existing member for editing
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
}

export function TeamMemberForm({ member, onSubmit, onCancel }: TeamMemberFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expertiseInput, setExpertiseInput] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(member?.avatarUrl || null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: member?.firstName || '',
      lastName: member?.lastName || '',
      email: member?.email || '',
      role: member?.role || 'RESEARCH_MEMBER',
      expertise: member?.expertise || [],
      avatarUrl: member?.avatarUrl || null,
    },
  });

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...data,
        avatarUrl,
      });
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddExpertise = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && expertiseInput.trim()) {
      e.preventDefault();
      const currentExpertise = form.getValues('expertise') || [];
      if (!currentExpertise.includes(expertiseInput.trim())) {
        form.setValue('expertise', [...currentExpertise, expertiseInput.trim()]);
      }
      setExpertiseInput('');
    }
  };

  const handleRemoveExpertise = (skill: string) => {
    const currentExpertise = form.getValues('expertise') || [];
    form.setValue('expertise', currentExpertise.filter(s => s !== skill));
  };

  const handleAvatarChange = (newAvatarUrl: string | null) => {
    setAvatarUrl(newAvatarUrl);
    form.setValue('avatarUrl', newAvatarUrl);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Avatar Upload */}
        <div className="flex justify-center mb-6">
          {member ? (
            <AvatarUpload
              userId={member.id}
              currentAvatarUrl={avatarUrl}
              userInitials={`${form.watch('firstName').charAt(0)}${form.watch('lastName').charAt(0)}`.toUpperCase() || member.initials}
              userName={`${form.watch('firstName')} ${form.watch('lastName')}`.trim() || member.name}
              onAvatarChange={handleAvatarChange}
              size="xl"
              allowDelete={true}
              storageType="file"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-medium">
              {form.watch('firstName').charAt(0)}{form.watch('lastName').charAt(0)}
            </div>
          )}
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="john.doe@example.com" 
                  {...field} 
                  disabled={!!member} // Disable email editing for existing members
                />
              </FormControl>
              <FormDescription>
                {member ? 'Email cannot be changed after creation' : 'This will be the user\'s login email'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Role */}
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {userRoles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Expertise */}
        <FormField
          control={form.control}
          name="expertise"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expertise</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <Input
                    placeholder="Add expertise (press Enter)"
                    value={expertiseInput}
                    onChange={(e) => setExpertiseInput(e.target.value)}
                    onKeyDown={handleAddExpertise}
                  />
                  <div className="flex flex-wrap gap-2">
                    {(field.value || []).map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="px-2 py-1"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveExpertise(skill)}
                          className="ml-2 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </FormControl>
              <FormDescription>
                Press Enter to add expertise areas
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {member ? 'Update Member' : 'Add Member'}
          </Button>
        </div>
      </form>
    </Form>
  );
}