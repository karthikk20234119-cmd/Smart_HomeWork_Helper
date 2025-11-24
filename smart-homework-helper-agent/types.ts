export type AgentStep = 'idle' | 'classifying' | 'assessing' | 'solving' | 'generating_practice' | 'updating_memory' | 'complete';

export interface AgentLog {
  id: string;
  agentName: string;
  emoji: string;
  timestamp: number;
  status: 'pending' | 'running' | 'success' | 'error';
  input?: string;
  output?: string; // JSON string or raw text
  metadata?: Record<string, any>;
  durationMs?: number;
  tokensUsed?: number;
  confidence?: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  relatedLogs?: AgentLog[]; // Connects the final answer to the traces
}

export interface StudentProfile {
  id: string;
  name: string;
  subjects: Record<string, SubjectStats>;
  totalQuestions: number;
  learningStyle: string;
}

export interface SubjectStats {
  questionsAsked: number;
  masteryLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  lastDifficulty: 'Easy' | 'Medium' | 'Hard';
}

// Responses from Agents (Structured)
export interface ClassifierResponse {
  subject: string;
  topic: string;
  subtopic: string;
  confidence: number;
  reasoning: string[];
}

export interface AssessorResponse {
  intrinsicDifficulty: string;
  gradeLevel: string;
  adjustedDifficulty: string;
  reasoning: string;
  complexityFactors: string[];
}

export interface SolutionResponse {
  markdown: string;
  steps: number;
}

export interface PracticeResponse {
  markdown: string;
  problemsGenerated: number;
}
