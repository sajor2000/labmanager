// Standup related types
export interface Standup {
  id: string;
  date: string;
  labId: string;
  participants: string[];
  participantCount?: number;
  duration?: number;
  recordingUrl: string | null;
  transcription: string | null;
  summary: string | null;
  actionItems: string[];
  blockers: string[];
  achievements: string[];
  status: StandupStatus;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  lab?: {
    id: string;
    name: string;
    shortName: string;
  };
  createdBy?: {
    id: string;
    name: string | null;
    email: string;
  };
}

export type StandupStatus = 
  | 'Scheduled'
  | 'In Progress'
  | 'Processing'
  | 'Completed'
  | 'Cancelled';

export interface CreateStandupPayload {
  date?: string;
  labId: string;
  participants?: string[];
  duration?: number;
  recordingUrl?: string;
  transcription?: string;
  summary?: string;
  actionItems?: string[];
  blockers?: string[];
  achievements?: string[];
}

export interface UpdateStandupPayload extends Partial<CreateStandupPayload> {
  status?: StandupStatus;
  isActive?: boolean;
}

export interface StandupFilters {
  labId?: string;
  status?: StandupStatus;
  dateFrom?: string;
  dateTo?: string;
  hasActionItems?: boolean;
  hasBlockers?: boolean;
}

export interface StandupStatistics {
  total: number;
  thisWeek: number;
  thisMonth: number;
  averageDuration: number;
  averageParticipants: number;
  totalActionItems: number;
  totalBlockers: number;
  completionRate: number;
}

export interface TranscriptionPayload {
  standupId: string;
  audioFile?: File;
  recordingUrl?: string;
}

export interface ProcessStandupPayload {
  standupId: string;
  extractActionItems?: boolean;
  extractBlockers?: boolean;
  generateSummary?: boolean;
  sendEmail?: boolean;
}