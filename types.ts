
export interface DiagramTemplate {
  id: string;
  name: string;
  icon: string;
  code: string;
}

export interface SavedDiagram {
  id: string;
  name: string;
  code: string;
  updatedAt: number;
}

export enum TabType {
  EDITOR = 'EDITOR',
  AI = 'AI',
  FILES = 'FILES',
  TEMPLATES = 'TEMPLATES',
  SETTINGS = 'SETTINGS'
}

export enum Language {
  KO = 'KO',
  EN = 'EN'
}

export type AiProvider = 'GEMINI' | 'OPENAI_COMPATIBLE';

export interface AiConfig {
  provider: AiProvider;
  geminiKey: string;
  openaiKey: string;
  openaiEndpoint: string;
  openaiModel: string;
}

export interface TestStatus {
  success: boolean;
  message: string;
  loading: boolean;
}
