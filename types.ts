
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  lastModified: Date;
}

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface GenerationState {
  isGenerating: boolean;
  progress: number;
  status: string;
}
