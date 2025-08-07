# LabSync

A world-class research management platform for Rush University Medical Center's research labs, featuring a sophisticated dual-theme system and real-time collaboration tools.

Built specifically for:
- **RHEDAS**: Rush Health Equity Data Analytics Studio
- **RICCC**: Rush Interdisciplinary Consortium for Critical Care Trials and Data Science

This platform combines Monday.com's visual workflows with Airtable's flexible data management, enhanced with Rush University branding and Slack-style dark mode.

## Features

### ✅ Completed
- **Dual-Theme System** - Rush University light mode & Slack-style dark mode
- **Dashboard Overview** - Animated metrics with Framer Motion
- **Navigation System** - 10 core features with active states
- **Study Management** - Full CRUD with status tracking
- **Kanban Board** - Drag-and-drop with color-coded buckets
- **Team Management** - Real-time backend integration
- **Avatar System** - Upload, display, and optimize profile images
- **Ideas Board** - Interactive voting and collaboration
- **AI Standups** - Meeting transcription and action extraction
- **Responsive Layout** - Mobile-optimized with touch gestures
- **E2E Testing** - Playwright test suite

### 🚧 In Progress
- Deadlines & Calendar View
- Real-time WebSocket updates
- Advanced analytics dashboard

## Tech Stack

- **Framework**: Next.js 15.4.5 with App Router
- **Language**: TypeScript 5
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS with CSS Variables
- **UI Components**: shadcn/ui + Custom components
- **State Management**: Zustand
- **Data Fetching**: React Query + SWR
- **Drag & Drop**: @dnd-kit
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod
- **Image Processing**: Sharp
- **AI Integration**: OpenAI GPT-4
- **Testing**: Playwright + Vitest
- **Deployment**: Vercel + Prisma Accelerate

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/sajor2000/labmanager.git
cd labmanager
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your database and API keys
```

4. Set up the database:
```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

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

## Theme System

### Rush University Theme (Light Mode)
- **Primary**: Rush Green (#2C5234)
- **Secondary**: Rush Gold (#CFB991)
- **Accent**: Rush Blue (#1A5F7A)

### Slack-Style Dark Mode
- **Background**: Dark Gray (#1A1D21)
- **Sidebar**: Darker Gray (#222529)
- **Cards**: Elevated Gray (#2C2F33)

### Status Colors

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