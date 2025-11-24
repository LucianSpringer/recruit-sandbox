export interface InterviewQuestion {
  question: string;
  focusArea: string;
  rationale: string;
}

export interface GeneratedContent {
  jobTitle: string;
  jobDescription: string;
  interviewGuide: InterviewQuestion[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export type ViewMode = 'JD' | 'GUIDE';

export type ExperienceLevel = 'Entry-Level' | 'Mid-Level' | 'Senior-Level' | 'Lead/Executive';

export interface CompanyContext {
  mission: string;
  values: string;
  culture: string;
  jobTitle?: string;
}