'use client';

import { useState } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Camera, User, Shield, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { showToast } from '@/components/ui/toast';

export default function ProfilePage() {
  const { user, loading } = useCurrentUser();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: '',
    department: '',
    expertise: '',
    phone: '',
    location: '',
  });
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement profile update API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      showToast({
        type: 'success',
        title: 'Profile updated',
        message: 'Your profile has been updated successfully',
      });
      setIsEditing(false);
    } catch {
      showToast({
        type: 'error',
        title: 'Update failed',
        message: 'Failed to update profile. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm">
        {/* Header */}
        <div className="px-6 py-4 border-b dark:border-gray-800">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your personal information and preferences
          </p>
        </div>
        
        {/* Profile Content */}
        <div className="p-6 space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className={`w-24 h-24 rounded-full ${user?.avatar || 'bg-blue-500'} flex items-center justify-center`}>
                <span className="text-3xl font-bold text-white">
                  {user?.initials || 'GU'}
                </span>
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                <Camera className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {user?.name || 'Guest User'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.role?.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ') || 'Guest'}
              </p>
            </div>
          </div>
          
          {/* Form Fields */}
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
                placeholder="+1 (555) 123-4567"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                disabled={!isEditing}
                placeholder="e.g., Biomedical Research"
                className="mt-1"
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!isEditing}
                placeholder="Tell us about yourself..."
                rows={3}
                className="mt-1"
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="expertise">Areas of Expertise</Label>
              <Input
                id="expertise"
                value={formData.expertise}
                onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                disabled={!isEditing}
                placeholder="e.g., Molecular Biology, Clinical Trials, Data Analysis"
                className="mt-1"
              />
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: user?.name || '',
                      email: user?.email || '',
                      bio: '',
                      department: '',
                      expertise: '',
                      phone: '',
                      location: '',
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </div>
        </div>
        
        {/* Additional Sections */}
        <div className="px-6 py-4 border-t dark:border-gray-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Stats</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Active Projects</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
                </div>
                <Building className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Completed Tasks</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">48</p>
                </div>
                <Shield className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Team Members</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
                </div>
                <User className="h-8 w-8 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}