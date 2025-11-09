/**
 * Core TypeScript types for the portfolio application
 */

export type PaperStatus = 'to_read' | 'reading' | 'completed' | 'archived';
export type Priority = 'HIGH' | 'MED' | 'LOW';

export interface Paper {
  id: string;
  title: string;
  authors: string;
  year: number;
  url?: string;
  description?: string;
  status: PaperStatus;
  priority: Priority;
  dependencies: string[]; // IDs of papers that should be read first
  topicId?: string;
  dagPosition?: { x: number; y: number };
  tags?: string[];
  venue?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Topic {
  id: string;
  name: string;
  color: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NavigationState {
  currentTopicId: string | null;
  expandedTopicIds: string[];
}

export interface AppData {
  papers: Paper[];
  topics: Topic[];
  navigation: NavigationState;
}
