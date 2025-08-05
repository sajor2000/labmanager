'use client';

import { useState } from 'react';
import { 
  Bell, Shield, Palette, Globe, Moon, Sun, 
  Monitor, Save 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { showToast } from '@/components/ui/toast';

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [theme, setTheme] = useState('system');
  
  const [settings, setSettings] = useState({
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    taskReminders: true,
    deadlineAlerts: true,
    weeklyDigest: false,
    
    // Privacy
    profileVisibility: 'team',
    activityStatus: true,
    showEmail: false,
    
    // Display
    compactView: false,
    showAvatars: true,
    animationsEnabled: true,
    
    // Locale
    language: 'en',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
  });
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement settings update API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showToast({
        type: 'success',
        title: 'Settings saved',
        message: 'Your preferences have been updated',
      });
    } catch {
      showToast({
        type: 'error',
        title: 'Save failed',
        message: 'Failed to save settings. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm">
        {/* Header */}
        <div className="px-6 py-4 border-b dark:border-gray-800">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your application preferences and account settings
          </p>
        </div>
        
        {/* Settings Sections */}
        <div className="p-6 space-y-8">
          {/* Appearance */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Customize how LabManage looks on your device
              </p>
            </div>
            
            <div className="space-y-4 ml-7">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Choose your preferred color theme
                  </p>
                </div>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        System
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="compact">Compact View</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Show more content with reduced spacing
                  </p>
                </div>
                <Switch
                  id="compact"
                  checked={settings.compactView}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, compactView: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="animations">Enable Animations</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Show smooth transitions and effects
                  </p>
                </div>
                <Switch
                  id="animations"
                  checked={settings.animationsEnabled}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, animationsEnabled: checked })
                  }
                />
              </div>
            </div>
          </div>
          
          {/* Notifications */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Choose what notifications you want to receive
              </p>
            </div>
            
            <div className="space-y-4 ml-7">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notif">Email Notifications</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Receive updates via email
                  </p>
                </div>
                <Switch
                  id="email-notif"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, emailNotifications: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-notif">Push Notifications</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Get instant alerts in your browser
                  </p>
                </div>
                <Switch
                  id="push-notif"
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, pushNotifications: checked })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="deadline-alerts">Deadline Alerts</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Get reminded about upcoming deadlines
                  </p>
                </div>
                <Switch
                  id="deadline-alerts"
                  checked={settings.deadlineAlerts}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, deadlineAlerts: checked })
                  }
                />
              </div>
            </div>
          </div>
          
          {/* Privacy */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Control your privacy and data sharing preferences
              </p>
            </div>
            
            <div className="space-y-4 ml-7">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="profile-visibility">Profile Visibility</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Who can see your profile information
                  </p>
                </div>
                <Select 
                  value={settings.profileVisibility} 
                  onValueChange={(value) => 
                    setSettings({ ...settings, profileVisibility: value })
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Everyone</SelectItem>
                    <SelectItem value="team">Team Only</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="activity-status">Show Activity Status</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Let others see when you&apos;re online
                  </p>
                </div>
                <Switch
                  id="activity-status"
                  checked={settings.activityStatus}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, activityStatus: checked })
                  }
                />
              </div>
            </div>
          </div>
          
          {/* Regional */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Regional
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Language and regional preferences
              </p>
            </div>
            
            <div className="space-y-4 ml-7">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Your local timezone for dates and times
                  </p>
                </div>
                <Select 
                  value={settings.timezone} 
                  onValueChange={(value) => 
                    setSettings({ ...settings, timezone: value })
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Save Button */}
        <div className="px-6 py-4 border-t dark:border-gray-800">
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}