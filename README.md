# Rush Labs Research Management Platform

A modern research management platform for Rush University Medical Center's research labs, specifically designed for:
- **RHEDAS**: Rush Health Equity Data Analytics Studio
- **RICCC**: Rush Interdisciplinary Consortium for Critical Care Trials and Data Science

This platform combines Monday.com's visual workflows with Airtable's flexible data management tailored for health equity research and critical care trials.

## Features

### ✅ Completed
- **Dashboard Overview** - Comprehensive metrics and activity tracking
- **Navigation System** - 10 core features accessible via sidebar
- **Study Management** - Create and organize research studies
- **Kanban Board** - Drag-and-drop study organization by buckets
- **Dark Mode** - Full theme support
- **Responsive Layout** - Adaptive design for different screen sizes

### 🚧 In Progress
- Task Management System
- Ideas Board with voting
- Team Member Management
- Deadlines & Calendar View
- AI-powered Standups
- Real-time Collaboration

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: React Query
- **Drag & Drop**: @dnd-kit
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/labmanage-research-hub.git
cd labmanage-research-hub
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
├── app/                  # Next.js app router pages
│   ├── layout.tsx       # Root layout with sidebar
│   ├── page.tsx         # Dashboard homepage
│   └── [feature]/       # Feature-specific pages
├── components/          
│   ├── dashboard/       # Dashboard components
│   ├── layout/          # Layout components (sidebar, nav)
│   ├── studies/         # Study management components
│   └── providers/       # Context providers
├── lib/                 # Utility functions
├── public/              # Static assets
└── styles/              # Global styles
```

## Key Features

### 1. Dashboard Overview
- Welcome greeting with lab activity summary
- 4 key metric cards (Labs, Studies, Buckets, Tasks)
- Recent studies list with progress tracking
- Activity feed showing recent updates

### 2. Study Management
- Create new studies with comprehensive forms
- Track study status through multiple phases
- Assign team members and collaborators
- Monitor funding sources and deadlines

### 3. Kanban Board (Stacked by Bucket)
- Visual organization of studies by funding buckets
- Drag-and-drop functionality between buckets
- Color-coded status indicators
- Quick actions and filtering options

### 4. Navigation Features
- **Overview** - Dashboard with metrics and insights
- **Labs** - Multi-lab management
- **Buckets** - Project categorization
- **Studies** - Research repository
- **Stacked by Bucket** - Kanban workflow
- **Task Board** - Task management
- **Ideas Board** - Research ideation
- **Deadlines** - Timeline tracking
- **Team Members** - Team management
- **Standups** - AI meeting capture

## Color System

The platform uses a comprehensive color system for status tracking:

- **Planning**: Indigo (#6366F1)
- **IRB Submission**: Amber (#F59E0B)
- **IRB Approved**: Green (#10B981)
- **Data Collection**: Blue (#3B82F6)
- **Analysis**: Green (#10B981)
- **Manuscript**: Purple (#8B5CF6)
- **Published**: Emerald (#059669)
- **On Hold**: Gray (#6B7280)
- **Cancelled**: Red (#EF4444)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Acknowledgments

- Design inspired by Monday.com and Airtable
- Built with Next.js and shadcn/ui
- Icons from Lucide React