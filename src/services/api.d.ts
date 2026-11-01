import { StudyPathTopic, LearningNode } from '@/lib/data/studyPath';
import { AxiosInstance } from 'axios';

export declare const apiClient: AxiosInstance;

export interface UploadStudyMaterialOptions {
  title?: string;
  text?: string;
  userId?: string;
}

export declare function uploadStudyMaterial(
  fileOrFormData: File | Blob | FormData,
  options?: UploadStudyMaterialOptions
): Promise<StudyPathTopic>;

export declare const generatePath: typeof uploadStudyMaterial;

export declare function getActiveStudyPath(): Promise<StudyPathTopic | null>;

export declare function getUserStudyPaths(): Promise<StudyPathTopic[]>;

export declare function getStudyPath(topicId: string): Promise<StudyPathTopic | null>;

export declare function updateStudyPathNode(
  topicId: string,
  nodeId: number | string,
  status: 'active' | 'completed' | 'locked'
): Promise<StudyPathTopic | null>;

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
  getFlashcards: typeof getFlashcards;
  getFlashcardDecks: typeof getFlashcardDecks;
  generateFlashcards: typeof generateFlashcards;
  reviewFlashcard: typeof reviewFlashcard;
};

export default api;
