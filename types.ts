export interface InterviewQuestion {
  question: string;
  focusArea: string;
  rationale: string;
}

export interface GeneratedContent {
  jobTitle: string;
  jobDescription: string;
  keyResponsibilities: string[];
  interviewGuide: InterviewQuestion[];
  headerImageUrl?: string;
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

export type JobFamily = 'Engineering' | 'Marketing' | 'Sales' | 'HR' | 'Finance' | 'Product' | 'Design' | 'Operations' | 'Legal' | 'Other';

export interface CompanyContext {
  mission: string;
  values: string;
  culture: string;
  jobTitle?: string;
  jobFamily?: JobFamily;
}