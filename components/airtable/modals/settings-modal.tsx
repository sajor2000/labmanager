'use client';

import React, { useState } from 'react';
import { 
  Settings, User, Bell, Shield, Database, 
  Palette, Globe, Key, Users, Activity,
  CreditCard, HelpCircle, ChevronRight, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SettingsSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection?: string;
  onSave?: (settings: any) => void;
  className?: string;
}

const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: 'profile',
    label: 'Profile',
    icon: <User className="h-4 w-4" />,
    description: 'Manage your personal information',
  },
  {
    id: 'workspace',
    label: 'Workspace',
    icon: <Globe className="h-4 w-4" />,
    description: 'Configure workspace settings',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: <Bell className="h-4 w-4" />,
    description: 'Control your notification preferences',
  },
  {
    id: 'security',
    label: 'Security',
    icon: <Shield className="h-4 w-4" />,
    description: 'Manage security and privacy settings',
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: <Palette className="h-4 w-4" />,
    description: 'Customize the look and feel',
  },
  {
    id: 'data',
    label: 'Data & Storage',
    icon: <Database className="h-4 w-4" />,
    description: 'Manage data and storage settings',
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: <CreditCard className="h-4 w-4" />,
    description: 'Manage subscription and payments',
  },
  {
    id: 'team',
    label: 'Team',
    icon: <Users className="h-4 w-4" />,
    description: 'Manage team members and permissions',
  },
];

const THEMES = [
  { id: 'light', label: 'Light', color: 'bg-white' },
  { id: 'dark', label: 'Dark', color: 'bg-gray-900' },
  { id: 'system', label: 'System', color: 'bg-gradient-to-r from-white to-gray-900' },
];

const ACCENT_COLORS = [
  { id: 'blue', label: 'Blue', color: 'bg-blue-500' },
  { id: 'green', label: 'Green', color: 'bg-green-500' },
  { id: 'purple', label: 'Purple', color: 'bg-purple-500' },
  { id: 'pink', label: 'Pink', color: 'bg-pink-500' },
  { id: 'yellow', label: 'Yellow', color: 'bg-yellow-500' },
  { id: 'red', label: 'Red', color: 'bg-red-500' },
];

export function SettingsModal({
  isOpen,
  onClose,
  activeSection: initialSection = 'profile',
  onSave,
  className,
}: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState(initialSection);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState({
    // Profile
    profile: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1 234 567 8900',
      bio: 'Research scientist focused on health equity',
      avatar: '/avatar.jpg',
    },
    // Workspace
    workspace: {
      name: 'LabSync Research',
      url: 'labsync-research',
      description: 'Scientific research management platform',
      timezone: 'America/Chicago',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      weekStart: 'sunday',
    },
    // Notifications
    notifications: {
      email: {
        mentions: true,
        assignments: true,
        comments: true,
        updates: true,
        newsletter: false,
      },
      push: {
        mentions: true,
        assignments: true,
        comments: false,
        updates: false,
      },
      frequency: 'instant', // instant, hourly, daily, weekly
    },
    // Security
    security: {
      twoFactor: false,
      sessionTimeout: '30',
      apiAccess: true,
      publicProfile: false,
    },
    // Appearance
    appearance: {
      theme: 'system',
      accentColor: 'blue',
      fontSize: 'medium',
      compactMode: false,
      animations: true,
    },
    // Data
    data: {
      storageUsed: 2.5, // GB
      storageLimit: 10, // GB
      autoBackup: true,
      backupFrequency: 'daily',
      exportFormat: 'csv',
    },
  });
  
  const updateSettings = (section: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };
  
  const handleSave = () => {
    onSave?.(settings);
    setHasChanges(false);
    onClose();
  };
  
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={settings.profile.avatar} />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline" size="sm">
                  Change Avatar
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG or GIF, max 2MB
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={settings.profile.name}
                  onChange={(e) => updateSettings('profile', 'name', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.profile.email}
                  onChange={(e) => updateSettings('profile', 'email', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={settings.profile.phone}
                  onChange={(e) => updateSettings('profile', 'phone', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={settings.workspace.timezone}
                  onValueChange={(value) => updateSettings('workspace', 'timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Chicago">America/Chicago</SelectItem>
                    <SelectItem value="America/New_York">America/New York</SelectItem>
                    <SelectItem value="America/Los_Angeles">America/Los Angeles</SelectItem>
                    <SelectItem value="Europe/London">Europe/London</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={settings.profile.bio}
                onChange={(e) => updateSettings('profile', 'bio', e.target.value)}
                rows={3}
              />
            </div>
          </div>
        );
        
      case 'workspace':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <Input
                id="workspace-name"
                value={settings.workspace.name}
                onChange={(e) => updateSettings('workspace', 'name', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="workspace-url">Workspace URL</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">app.labsync.com/</span>
                <Input
                  id="workspace-url"
                  value={settings.workspace.url}
                  onChange={(e) => updateSettings('workspace', 'url', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="workspace-desc">Description</Label>
              <Textarea
                id="workspace-desc"
                value={settings.workspace.description}
                onChange={(e) => updateSettings('workspace', 'description', e.target.value)}
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date-format">Date Format</Label>
                <Select
                  value={settings.workspace.dateFormat}
                  onValueChange={(value) => updateSettings('workspace', 'dateFormat', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time-format">Time Format</Label>
                <Select
                  value={settings.workspace.timeFormat}
                  onValueChange={(value) => updateSettings('workspace', 'timeFormat', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12 hour</SelectItem>
                    <SelectItem value="24h">24 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="week-start">Week Starts On</Label>
                <Select
                  value={settings.workspace.weekStart}
                  onValueChange={(value) => updateSettings('workspace', 'weekStart', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sunday">Sunday</SelectItem>
                    <SelectItem value="monday">Monday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
        
      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Email Notifications</h3>
              
              {Object.entries(settings.notifications.email).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="capitalize">{key.replace('_', ' ')}</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive email when {key.replace('_', ' ')}
                    </p>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) =>
                      updateSettings('notifications', 'email', {
                        ...settings.notifications.email,
                        [key]: checked,
                      })
                    }
                  />
                </div>
              ))}
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Push Notifications</h3>
              
              {Object.entries(settings.notifications.push).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="capitalize">{key.replace('_', ' ')}</Label>
                    <p className="text-xs text-muted-foreground">
                      Browser push for {key.replace('_', ' ')}
                    </p>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) =>
                      updateSettings('notifications', 'push', {
                        ...settings.notifications.push,
                        [key]: checked,
                      })
                    }
                  />
                </div>
              ))}
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label>Notification Frequency</Label>
              <RadioGroup
                value={settings.notifications.frequency}
                onValueChange={(value) => updateSettings('notifications', 'frequency', value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="instant" id="instant" />
                  <Label htmlFor="instant">Instant</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hourly" id="hourly" />
                  <Label htmlFor="hourly">Hourly digest</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="daily" id="daily" />
                  <Label htmlFor="daily">Daily digest</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="weekly" id="weekly" />
                  <Label htmlFor="weekly">Weekly digest</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );
        
      case 'security':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-xs text-muted-foreground">
                  Add an extra layer of security
                </p>
              </div>
              <Switch
                checked={settings.security.twoFactor}
                onCheckedChange={(checked) => updateSettings('security', 'twoFactor', checked)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Session Timeout</Label>
              <Select
                value={settings.security.sessionTimeout}
                onValueChange={(value) => updateSettings('security', 'sessionTimeout', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="240">4 hours</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>API Access</Label>
                <p className="text-xs text-muted-foreground">
                  Allow third-party integrations
                </p>
              </div>
              <Switch
                checked={settings.security.apiAccess}
                onCheckedChange={(checked) => updateSettings('security', 'apiAccess', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Public Profile</Label>
                <p className="text-xs text-muted-foreground">
                  Make your profile visible to everyone
                </p>
              </div>
              <Switch
                checked={settings.security.publicProfile}
                onCheckedChange={(checked) => updateSettings('security', 'publicProfile', checked)}
              />
            </div>
            
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Your account is protected with enterprise-grade security
              </AlertDescription>
            </Alert>
          </div>
        );
        
      case 'appearance':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="grid grid-cols-3 gap-2">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => updateSettings('appearance', 'theme', theme.id)}
                    className={cn(
                      "p-4 rounded-lg border-2 transition-colors",
                      settings.appearance.theme === theme.id
                        ? "border-blue-500"
                        : "border-gray-200 dark:border-gray-700"
                    )}
                  >
                    <div className={cn("h-8 w-full rounded mb-2", theme.color)} />
                    <p className="text-sm font-medium">{theme.label}</p>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Accent Color</Label>
              <div className="flex gap-2">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => updateSettings('appearance', 'accentColor', color.id)}
                    className={cn(
                      "h-10 w-10 rounded-lg transition-all",
                      color.color,
                      settings.appearance.accentColor === color.id
                        ? "ring-2 ring-offset-2 ring-blue-500"
                        : ""
                    )}
                  />
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Font Size</Label>
              <RadioGroup
                value={settings.appearance.fontSize}
                onValueChange={(value) => updateSettings('appearance', 'fontSize', value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="small" id="small" />
                  <Label htmlFor="small">Small</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="medium" />
                  <Label htmlFor="medium">Medium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="large" id="large" />
                  <Label htmlFor="large">Large</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Compact Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Reduce spacing between elements
                </p>
              </div>
              <Switch
                checked={settings.appearance.compactMode}
                onCheckedChange={(checked) => updateSettings('appearance', 'compactMode', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Animations</Label>
                <p className="text-xs text-muted-foreground">
                  Enable smooth transitions
                </p>
              </div>
              <Switch
                checked={settings.appearance.animations}
                onCheckedChange={(checked) => updateSettings('appearance', 'animations', checked)}
              />
            </div>
          </div>
        );
        
      case 'data':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Storage Usage</Label>
              <div className="space-y-2">
                <Progress 
                  value={(settings.data.storageUsed / settings.data.storageLimit) * 100} 
                />
                <p className="text-xs text-muted-foreground">
                  {settings.data.storageUsed} GB of {settings.data.storageLimit} GB used
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Automatic Backup</Label>
                <p className="text-xs text-muted-foreground">
                  Backup your data automatically
                </p>
              </div>
              <Switch
                checked={settings.data.autoBackup}
                onCheckedChange={(checked) => updateSettings('data', 'autoBackup', checked)}
              />
            </div>
            
            {settings.data.autoBackup && (
              <div className="space-y-2">
                <Label>Backup Frequency</Label>
                <Select
                  value={settings.data.backupFrequency}
                  onValueChange={(value) => updateSettings('data', 'backupFrequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select
                value={settings.data.exportFormat}
                onValueChange={(value) => updateSettings('data', 'exportFormat', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Button variant="outline" className="w-full">
                <Database className="h-4 w-4 mr-2" />
                Export All Data
              </Button>
              <Button variant="outline" className="w-full">
                <Activity className="h-4 w-4 mr-2" />
                View Activity Log
              </Button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("max-w-4xl max-h-[80vh]", className)}>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your account settings and preferences
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex gap-6 mt-6">
          {/* Sidebar */}
          <div className="w-64 space-y-1">
            {SETTINGS_SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                  activeSection === section.id
                    ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                {section.icon}
                <div className="flex-1">
                  <p className="font-medium text-sm">{section.label}</p>
                  {section.description && (
                    <p className="text-xs text-muted-foreground">
                      {section.description}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 opacity-50" />
              </button>
            ))}
          </div>
          
          {/* Content */}
          <div className="flex-1">
            <ScrollArea className="h-[500px] pr-4">
              {renderSectionContent()}
            </ScrollArea>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}