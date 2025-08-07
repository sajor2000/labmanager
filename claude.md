# Scientific Lab Project Management Platform - Technical Specification

## Executive Summary
A modern research management platform combining Monday.com's visual workflows with Airtable's flexible data management, specifically designed for scientific research labs. The platform emphasizes intuitive UI/UX, real-time collaboration, and AI-powered insights.

## Core Navigation & Layout

### Sidebar Navigation Structure
Based on the LabSync Research Platform interface:

```typescript
interface SidebarNavigation {
  // Top Section - Branding
  logo: {
    icon: 'Flask/Beaker icon';
    title: 'LabSync';
    subtitle: 'Research Platform';
  };
  
  // Primary Navigation Items (as shown in screenshots)
  primaryItems: [
    { icon: 'Chart', label: 'Overview', path: '/overview' },
    { icon: 'Flask', label: 'Labs', path: '/labs' },
    { icon: 'Folder', label: 'Buckets', path: '/buckets' },
    { icon: 'Beaker', label: 'Studies', path: '/studies' },
    { icon: 'Grid3x3', label: 'Stacked by Bucket', path: '/stacked' },
    { icon: 'Kanban', label: 'Task Board', path: '/tasks' },
    { icon: 'Lightbulb', label: 'Ideas Board', path: '/ideas' },
    { icon: 'Clock', label: 'Deadlines', path: '/deadlines' },
    { icon: 'Users', label: 'Team Members', path: '/team' },
    { icon: 'Mic', label: 'Standups', path: '/standups' }
  ];
  
  // User Profile Section (bottom)
  userProfile: {
    avatar: 'User initial in circle';
    name: 'User full name';
    role: 'Research Member/PI/Admin';
  };
}
```

### Top Navigation Bar
```typescript
interface TopNavigation {
  search: {
    placeholder: 'Search studies, tasks, or documents';
    shortcuts: ['⌘K'];
    autocomplete: true;
  };
  
  labSelector: {
    icon: 'Building';
    currentLab: 'Health Equity Labs';
    dropdown: true;
  };
  
  actions: {
    theme: 'Dark/Light toggle';
    notifications: 'Bell with badge';
    userMenu: 'Avatar dropdown';
  };
}
```

## Dashboard Overview Screen

### Welcome Section
```typescript
interface DashboardWelcome {
  greeting: `Welcome back, ${firstName}!`;
  subtitle: `Here's an overview of ${labName} activities`;
}
```

### Metrics Cards
Four primary metric cards as shown:

1. **Total Labs**
   - Icon: Building/Flask
   - Count: Number
   - Subtitle: "Research laboratories"

2. **Active Studies**
   - Icon: User/Flask
   - Count: "X out of Y total"
   - Progress indicator

3. **Project Buckets**
   - Icon: Folder
   - Count: Number
   - Subtitle: "Organized collections"

4. **Tasks Progress**
   - Icon: Checkmark
   - Count: "X/Y"
   - Subtitle: "Completed tasks"

### Recent Studies Section
- Header with "View All" link
- Study cards with key metadata
- Quick actions on hover

## Study Management Views

### 1. Stacked by Bucket View (Primary Board View)
As shown in the screenshots:

```typescript
interface StackedBucketView {
  header: {
    viewTitle: 'Stacked by Bucket';
    actions: [
      'Customize cards',
      'Filter',
      'Sort',
      'Color',
      'Share view'
    ];
  };
  
  buckets: {
    // Each bucket column shows:
    title: string; // e.g., "Abbott", "Wisconsin R01"
    count: number; // Number of studies
    color: string; // Unique bucket color
    studies: StudyCard[];
  };
}

interface StudyCard {
  title: string;
  colorBar: string; // Left border color
  fields: {
    status: {
      label: 'Status';
      value: string;
      color: 'status-specific'; // Green for Analysis phase, etc.
    };
    studyType: {
      label: 'study type';
      value: string;
    };
    assignee: {
      label: 'Assignee';
      value: string[]; // Multiple team members
    };
    funding: {
      label: 'Funding';
      value: string;
    };
    collaborators: {
      label: 'External Collaborators';
      value: string;
    };
  };
}
```

### 2. Study Creation Form
Modern form with smart inputs as shown:

```typescript
interface StudyCreationForm {
  title: 'Add a new research study to your lab';
  
  fields: {
    // Row 1
    studyName: {
      type: 'text';
      placeholder: 'Enter study name...';
      validation: 'required';
    };
    oraNumber: {
      type: 'text';
      placeholder: 'e.g., ORA-2024-001';
      format: 'ORA-YYYY-NNN';
    };
    
    // Row 2
    status: {
      type: 'dropdown';
      options: [
        'Planning',
        'IRB Submission',
        'IRB Approved',
        'Data Collection',
        'Analysis',
        'Manuscript',
        'Under Review',
        'Published',
        'On Hold',
        'Cancelled'
      ];
      default: 'Planning';
    };
    priority: {
      type: 'dropdown';
      options: ['Low', 'Medium', 'High', 'Critical'];
      default: 'Medium';
    };
    
    // Row 3
    bucket: {
      type: 'dropdown';
      placeholder: 'Select bucket';
      allowCreate: true;
    };
    fundingSource: {
      type: 'dropdown';
      options: [
        'NIH',
        'NSF',
        'Industry Sponsored',
        'Internal',
        'Foundation',
        'Other'
      ];
    };
    
    // Row 4
    studyType: {
      type: 'text';
      placeholder: 'e.g., Retrospective, Prospective...';
      suggestions: true;
    };
    dueDate: {
      type: 'datepicker';
      format: 'mm/dd/yyyy';
      minDate: 'today';
    };
    
    // Row 5
    externalCollaborators: {
      type: 'textarea';
      placeholder: 'List external collaborators...';
      rows: 2;
    };
    
    // Row 6
    notes: {
      type: 'textarea';
      placeholder: 'Add any additional notes about the study...';
      rows: 3;
      markdown: true;
    };
  };
}
```

## Color System & Status Indicators

### Study Status Colors (from screenshots)
```scss
$status-colors: (
  'planning': #6366F1,        // Indigo
  'irb-submission': #F59E0B,  // Amber
  'irb-approved': #10B981,    // Green
  'data-collection': #3B82F6, // Blue
  'analysis': #10B981,        // Green (Analysis phase)
  'manuscript': #8B5CF6,      // Purple (Manuscript phase)
  'under-review': #F59E0B,    // Amber
  'published': #059669,       // Emerald
  'on-hold': #6B7280,        // Gray
  'cancelled': #EF4444        // Red
);
```

### Bucket Colors (from screenshots)
```scss
$bucket-colors: (
  'abbott': #00BCD4,      // Cyan
  'wisconsin-r01': #E91E63, // Pink/Red
  // Additional dynamic colors...
);
```

## Detailed Navigation Features & UI/UX Requirements

### 1. **Overview** - Dashboard Home
**Purpose**: Dashboard home providing at-a-glance lab metrics and activity

**UI/UX Needs**:
- **Metric Cards**: 4-6 key performance indicators with icons, numbers, and trend indicators
- **Activity Feed**: Recent updates across all studies with timestamps
- **Quick Actions**: Floating action button for common tasks (new study, quick note)
- **Customizable Widgets**: Drag-and-drop dashboard customization
- **Data Visualization**: Mini charts showing trends (study progress, publication pipeline)
- **Smart Insights**: AI-generated insights about lab productivity patterns

### 2. **Labs** - Multi-Lab Management
**Purpose**: Multi-lab management for PIs overseeing multiple research groups

**UI/UX Needs**:
- **Lab Cards**: Visual cards with lab logo, member count, active studies
- **Lab Switcher**: Quick toggle between labs with keyboard shortcut (⌘+L)
- **Lab Settings**: Access controls, branding, custom fields per lab
- **Lab Analytics**: Comparative metrics across labs
- **Invitation Flow**: Simple interface to add members with role assignment
- **Lab Templates**: Pre-configured setups for different research types

### 3. **Buckets** - Project Organization
**Purpose**: Project categorization and organization containers

**UI/UX Needs**:
- **Visual Buckets**: Color-coded containers with drag-and-drop
- **Bucket Templates**: Pre-defined buckets (Grant-funded, Pilot Studies, Industry)
- **Nested Buckets**: Hierarchical organization with collapsible trees
- **Bucket Rules**: Automation for auto-assigning studies based on criteria
- **Archive Function**: Hide inactive buckets while preserving data
- **Bucket Analytics**: Study distribution and progress per bucket

### 4. **Studies** - Research Repository
**Purpose**: Central repository of all research studies

**UI/UX Needs**:
- **Multiple Views**: List, Grid, Table, Timeline views with view persistence
- **Advanced Filters**: Multi-criteria filtering with saved filter sets
- **Bulk Actions**: Multi-select with action toolbar
- **Study Templates**: Common study types with pre-filled fields
- **Quick Preview**: Hover cards showing key study details
- **Export Options**: PDF, Excel, CSV with formatting preserved

### 5. **Stacked by Bucket** - Visual Workflow
**Purpose**: Kanban-style visual workflow management

**UI/UX Needs**:
- **Drag-and-Drop**: Smooth animations between buckets with ghost previews
- **Card Customization**: Choose which fields appear on cards
- **Swimlanes**: Secondary grouping by team member or priority
- **WIP Limits**: Optional limits per bucket with visual warnings
- **Card Actions**: Right-click context menu for quick actions
- **Zoom Controls**: Adjust card size for overview vs. detail viewing

### 6. **Task Board** - Task Management
**Purpose**: Granular task management across all studies

**UI/UX Needs**:
- **Sprint Planning**: Time-boxed task groups with burndown charts
- **Task Dependencies**: Visual linking between related tasks
- **Assignment**: Drag team member avatars onto tasks
- **Time Tracking**: Built-in timer with Pomodoro option
- **Recurring Tasks**: Templates for regular activities (weekly meetings)
- **Integration**: Auto-create tasks from standup transcripts

### 7. **Ideas Board** - Research Ideation
**Purpose**: Research idea incubation and evaluation

**UI/UX Needs**:
- **Idea Cards**: Rich media support (images, links, attachments)
- **Voting System**: Team voting with comments
- **Idea Stages**: Pipeline from concept to approved study
- **AI Scoring**: Feasibility and impact analysis
- **Collaboration**: Real-time co-editing on idea documents
- **Conversion Flow**: One-click to convert idea to formal study

### 8. **Deadlines** - Timeline Management
**Purpose**: Centralized deadline and milestone tracking

**UI/UX Needs**:
- **Calendar View**: Month/Week/Day with color coding by urgency
- **Timeline View**: Gantt chart showing all deadlines
- **Smart Reminders**: Customizable notification rules
- **Deadline Types**: IRB renewals, grant submissions, paper deadlines
- **Integration**: Sync with external calendars (Google, Outlook)
- **Conflict Detection**: Highlight overlapping deadlines

### 9. **Team Members** - Team Management
**Purpose**: Team roster and workload management

**UI/UX Needs**:
- **Member Profiles**: Photos, expertise, contact info, availability
- **Workload View**: Visual capacity and assignment distribution
- **Skills Matrix**: Searchable expertise database
- **Org Chart**: Visual hierarchy with reporting lines
- **Activity Tracking**: Member contribution metrics
- **Collaboration Graph**: Network view of who works together

### 10. **Standups** - AI Meeting Capture
**Purpose**: AI-powered meeting capture and action extraction

**UI/UX Needs**:
- **Recording Interface**: 
  - Large record button with visual feedback
  - Waveform visualization during recording
  - Pause/resume capabilities
  - Background noise indicator
  
- **Transcription View**:
  - Real-time text appearing as speaking
  - Speaker identification
  - Inline editing post-recording
  - Timestamp navigation
  
- **AI Analysis Panel**:
  - Extracted action items with confidence scores
  - Identified blockers highlighted in red
  - Key decisions in green
  - Auto-suggested study/task assignments
  
- **Quick Actions**:
  - "Create tasks from actions" button
  - "Email summary to team"
  - "Add to study notes"
  
- **History View**:
  - Searchable standup archive
  - Trend analysis (recurring blockers)
  - Team participation metrics

### Common UI/UX Patterns Across All Views
- **Breadcrumbs**: Clear navigation path
- **Search**: Contextual search within each section
- **Keyboard Shortcuts**: Power user efficiency
- **Mobile Responsive**: Touch-optimized versions
- **Dark Mode**: Consistent theme application
- **Loading States**: Skeleton screens and progress indicators
- **Empty States**: Helpful guidance when no data exists
- **Error Handling**: Clear error messages with recovery options

## Key UI Components

### 1. Dropdown Components
All dropdowns should include:
- Search functionality
- Checkmark for selected item
- Hover states
- Keyboard navigation
- Create new option (where applicable)

### 2. Form Inputs
- Floating labels that move on focus
- Clear placeholder text
- Validation states (error, success)
- Character/word counts where relevant
- Auto-save indicators

### 3. Card Components
Study cards should include:
- Colored left border (bucket color)
- Structured field layout
- Hover actions (edit, delete, duplicate)
- Drag handle for reordering
- Click to expand details

### 4. Navigation States
- Active item: White text with left border indicator
- Hover: Subtle background highlight
- Icons: Consistent size and style (Lucide)
- Collapsible sections with smooth animations

## AI Features Integration

### Standups Feature (from sidebar)
```typescript
interface StandupFeature {
  recording: {
    interface: 'Modal or slide-out panel';
    controls: ['Record', 'Pause', 'Stop'];
    transcription: 'Real-time display';
  };
  
  analysis: {
    automatic: {
      tasks: 'Extract action items';
      blockers: 'Identify impediments';
      updates: 'Summarize progress';
    };
    
    distribution: {
      studies: 'Auto-assign to relevant studies';
      team: 'Tag mentioned team members';
      deadlines: 'Extract and create due dates';
    };
  };
}
```

### Ideas Board (from sidebar)
AI-powered research idea management:
- Automatic categorization
- Feasibility analysis
- Similar study detection
- Resource requirement estimation

## Responsive Behavior

### Mobile Adaptations
- Sidebar becomes bottom navigation
- Cards stack vertically
- Swipe gestures for bucket navigation
- Simplified form layouts
- Touch-optimized controls

### Tablet Optimizations
- Collapsible sidebar (hamburger menu)
- 2-column bucket layout
- Floating action button
- Modal forms instead of inline

## Performance Optimizations

### Frontend
- Virtual scrolling for large study lists
- Lazy loading for bucket contents
- Optimistic UI updates
- Progressive image loading
- Service worker for offline access

### Real-time Features
- WebSocket connections for live updates
- Presence indicators on cards
- Conflict resolution for concurrent edits
- Activity feed updates
- Push notifications

## Accessibility Features

### Navigation
- Skip links
- Keyboard shortcuts for all actions
- Focus indicators matching brand colors
- Screen reader announcements
- Landmark regions

### Forms
- Error messages linked to fields
- Required field indicators
- Help text for complex inputs
- Autocomplete attributes
- Progress indicators

## Security & Permissions

### Role-Based Access
```typescript
enum UserRole {
  PI = 'Principal Investigator',
  CoPI = 'Co-Principal Investigator', 
  ResearchMember = 'Research Member',
  Admin = 'Lab Administrator',
  Guest = 'External Collaborator'
}

interface Permissions {
  studies: {
    create: [PI, CoPI, Admin];
    edit: [PI, CoPI, Admin, ResearchMember];
    delete: [PI, Admin];
    view: [all];
  };
  // ... additional permissions
}
```

This refined specification incorporates all the UI/UX elements from the screenshots while maintaining the comprehensive technical architecture for a modern research management platform.