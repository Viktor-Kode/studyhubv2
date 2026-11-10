import { StudyPathTopic, LearningNode } from '@/lib/data/studyPath';
import { AxiosInstance } from 'axios';

export declare const apiClient: AxiosInstance;

export interface UploadStudyMaterialOptions {
  title?: string;
  text?: string;
  userId?: string;
  onProgress?: (progress: { status?: string; stage?: string; done?: number; total?: number }) => void;
}

export declare function uploadStudyMaterial(
  fileOrFormData: File | Blob | FormData,
  options?: UploadStudyMaterialOptions
): Promise<StudyPathTopic>;

export declare const generatePath: typeof uploadStudyMaterial;

export declare function getActiveStudyPath(): Promise<StudyPathTopic | null>;

export declare function getUserStudyPaths(): Promise<StudyPathTopic[]>;

export declare function getStudyMapCount(userId?: string | null): Promise<{ count: number; hasStudyMaps: boolean }>;

export declare function getStudyPath(topicId: string): Promise<StudyPathTopic | null>;

export declare function getNodeStatuses(topicId: string): Promise<{
  topicId: string;
  nodes: { id: number; title: string; unit?: string; status: string; contentStatus: 'pending' | 'generating' | 'ready' | 'failed'; generationError?: string | null }[];
  allReady: boolean;
  challengeReady: boolean;
  challengeStatus: string;
} | null>;

export declare function prepareStudyPathNode(
  topicId: string,
  nodeId: number | string,
  options?: { bufferNext?: boolean }
): Promise<LearningNode | null>;

export declare function retryStudyPathNode(
  topicId: string,
  nodeId: number | string
): Promise<LearningNode | null>;

export declare function updateStudyPathNode(
  topicId: string,
  nodeId: number | string,
  status: 'active' | 'completed' | 'locked'
): Promise<StudyPathTopic | null>;

export declare function analyzeStudyPathNodeSummary(
  topicId: string,
  nodeId: number | string,
  summary: string
): Promise<{ success: boolean; analysis: { covered: string[]; missing: string[]; feedback: string } }>;

export declare function deleteStudyPath(topicId: string): Promise<void>;

export declare function getStudyPathChallenge(topicId: string): Promise<any>;

export declare function submitStudyPathChallenge(topicId: string, answers: (number | null)[]): Promise<any>;

export declare function retryStudyPathChallenge(topicId: string): Promise<any>;

export declare function getFlashcards(params?: {
  category?: string;
  deckId?: string;
  favorite?: boolean;
  search?: string;
}): Promise<any[]>;

export declare function getFlashcardDecks(): Promise<any[]>;

export declare function generateFlashcards(payload: any): Promise<any>;

export declare function reviewFlashcard(payload: {
  cardId: string;
  rating: number | 'hard' | 'good' | 'easy';
  deckId?: string;
  subject?: string;
  topic?: string;
}): Promise<any>;

declare const api: {
  uploadStudyMaterial: typeof uploadStudyMaterial;
  generatePath: typeof generatePath;
  getActiveStudyPath: typeof getActiveStudyPath;
  getUserStudyPaths: typeof getUserStudyPaths;
  getStudyPath: typeof getStudyPath;
  updateStudyPathNode: typeof updateStudyPathNode;
  deleteStudyPath: typeof deleteStudyPath;
  getStudyPathChallenge: typeof getStudyPathChallenge;
  submitStudyPathChallenge: typeof submitStudyPathChallenge;
  retryStudyPathChallenge: typeof retryStudyPathChallenge;
  getFlashcards: typeof getFlashcards;
  getFlashcardDecks: typeof getFlashcardDecks;
  generateFlashcards: typeof generateFlashcards;
  reviewFlashcard: typeof reviewFlashcard;
};

export default api;
