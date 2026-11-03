import axios from 'axios';
import { getFirebaseToken } from '@/lib/store/authStore';

// Base URL configuration:
// In browser: uses internal relative Next.js API or configured backend URL
// In server/SSR: uses direct backend API URL
const getBaseUrl = () => {
  if (typeof window === 'undefined') {
    const raw = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000/api';
    return raw.replace(/\/+$/, '');
  }
  // When running client-side, prefer relative path so Next.js proxies correctly across domains/CORS
  return '';
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 120000 // 2 minutes for AI and PDF parsing
});

// Attach Firebase bearer token dynamically
apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await getFirebaseToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn('[apiClient] Could not attach auth token:', err?.message);
  }

  // Ensure multipart boundary is handled properly by axios/browser
  if (config.data instanceof FormData) {
    if (config.headers && 'Content-Type' in config.headers) {
      delete config.headers['Content-Type'];
    }
  }

  return config;
});

/**
 * 1. Upload function: POST /api/generate-path
 * Sends FormData with user's uploaded PDF file and returns structured JSON study path
 * 
 * @param {File | FormData} fileOrFormData - Uploaded PDF file or existing FormData
 * @param {Object} [options] - Optional additional fields: { title, text, userId, onProgress }
 * @returns {Promise<Object>} Structured JSON study path after the background job completes
 */
export async function uploadStudyMaterial(fileOrFormData, options = {}) {
  let formData;

  if (fileOrFormData instanceof FormData) {
    formData = fileOrFormData;
  } else if (fileOrFormData instanceof Blob || (typeof File !== 'undefined' && fileOrFormData instanceof File)) {
    formData = new FormData();
    formData.append('pdf', fileOrFormData, fileOrFormData.name || 'study-document.pdf');
    if (options.title) formData.append('title', options.title);
    if (options.text) formData.append('text', options.text);
    if (options.userId) formData.append('userId', options.userId);
  } else if (options.text) {
    formData = new FormData();
    formData.append('text', options.text);
    if (options.title) formData.append('title', options.title);
    if (options.userId) formData.append('userId', options.userId);
  } else {
    throw new Error('A PDF file or extracted text must be provided.');
  }

  const response = await apiClient.post('/api/generate-path', formData);
  const jobId = response.data?.jobId;
  if (!jobId) {
    const studyPath = response.data?.studyPath || response.data?.path;
    if (studyPath) return studyPath;
    throw new Error(response.data?.message || 'The server did not return a study-path job ID.');
  }

  options.onProgress?.({ status: 'queued', stage: 'Queued for processing', done: 0, total: 0 });
  const deadline = Date.now() + 55 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    let statusResponse;
    try {
      statusResponse = await apiClient.get(`/api/jobs/${encodeURIComponent(jobId)}`);
    } catch (pollError) {
      const status = pollError?.response?.status;
      if (status === 403 || status === 404) {
        throw new Error(pollError?.response?.data?.message || 'Could not access the study-path job.');
      }
      options.onProgress?.({ status: 'queued', stage: 'Reconnecting to study-path generation...', done: 0, total: 0 });
      continue;
    }
    const job = statusResponse.data;
    options.onProgress?.(job);
    if (job?.status === 'done') {
      if (!job.studyPath) throw new Error('The study map completed, but its data was not returned. Please reopen your dashboard.');
      return job.studyPath;
    }
    if (job?.status === 'error') throw new Error(job.message || 'Study path generation failed.');
  }
  throw new Error('Study path generation is taking longer than expected. Check your dashboard again shortly.');
}

// Alias for convenience
export const generatePath = uploadStudyMaterial;

/**
 * Fetch active study path from the backend
 * 
 * @returns {Promise<Object|null>} Active StudyPathTopic or null
 */
export async function getActiveStudyPath() {
  try {
    const response = await apiClient.get('/api/generate-path/active');
    const path = response.data?.studyPath || null;
    return path;
  } catch (err) {
    console.warn('[api] /api/generate-path/active failed, trying /api/backend/generate-path/active fallback:', err.message);
    try {
      const fb = await apiClient.get('/api/backend/generate-path/active');
      return fb.data?.studyPath || null;
    } catch (fbErr) {
      console.warn('[api] Failed to fetch active study path:', fbErr?.message);
      return null;
    }
  }
}

/**
 * Fetch all study paths for the current user
 * 
 * @returns {Promise<Array>} Array of user StudyPathTopics
 */
export async function getUserStudyPaths() {
  try {
    const res = await apiClient.get('/api/study-path/all');
    return res.data?.studyPaths || [];
  } catch (err) {
    try {
      const fb = await apiClient.get('/api/backend/study-path/all');
      return fb.data?.studyPaths || [];
    } catch {
      return [];
    }
  }
}

/**
 * Fetch a specific study path by its topicId
 * 
 * @param {string} topicId 
 * @returns {Promise<Object|null>}
 */
export async function getStudyPath(topicId) {
  if (!topicId) return null;
  try {
    const response = await apiClient.get(`/api/study-path/${encodeURIComponent(topicId)}`);
    return response.data?.studyPath || null;
  } catch (err) {
    try {
      const fb = await apiClient.get(`/api/backend/study-path/${encodeURIComponent(topicId)}`);
      return fb.data?.studyPath || null;
    } catch {
      return null;
    }
  }
}

/**
 * Fetch progressive generation statuses for all nodes in a topic
 *
 * @param {string} topicId
 * @returns {Promise<{ topicId: string, nodes: Array, allReady: boolean, challengeReady: boolean, challengeStatus: string }|null>}
 */
export async function getNodeStatuses(topicId) {
  if (!topicId) return null;
  try {
    const response = await apiClient.get(`/api/study-path/${encodeURIComponent(topicId)}/nodes/status`);
    return response.data || null;
  } catch (err) {
    try {
      const fb = await apiClient.get(`/api/backend/study-path/${encodeURIComponent(topicId)}/nodes/status`);
      return fb.data || null;
    } catch {
      return null;
    }
  }
}

/**
 * Priority prepare/generate a specific node and trigger rolling buffer
 *
 * @param {string} topicId
 * @param {number|string} nodeId
 * @param {{ bufferNext?: boolean }} options
 * @returns {Promise<Object>}
 */
export async function prepareStudyPathNode(topicId, nodeId, options = { bufferNext: true }) {
  if (!topicId || !nodeId) throw new Error('topicId and nodeId are required');
  try {
    const response = await apiClient.post(`/api/study-path/${encodeURIComponent(topicId)}/nodes/${nodeId}/prepare`, options);
    return response.data?.node || null;
  } catch (err) {
    try {
      const fb = await apiClient.post(`/api/backend/study-path/${encodeURIComponent(topicId)}/nodes/${nodeId}/prepare`, options);
      return fb.data?.node || null;
    } catch (fbErr) {
      console.error('[api] Failed to prepare study path node:', fbErr.message);
      throw fbErr;
    }
  }
}

/**
 * Retry failed node generation
 *
 * @param {string} topicId
 * @param {number|string} nodeId
 * @returns {Promise<Object>}
 */
export async function retryStudyPathNode(topicId, nodeId) {
  if (!topicId || !nodeId) throw new Error('topicId and nodeId are required');
  try {
    const response = await apiClient.post(`/api/study-path/${encodeURIComponent(topicId)}/nodes/${nodeId}/retry`);
    return response.data?.node || null;
  } catch (err) {
    try {
      const fb = await apiClient.post(`/api/backend/study-path/${encodeURIComponent(topicId)}/nodes/${nodeId}/retry`);
      return fb.data?.node || null;
    } catch (fbErr) {
      console.error('[api] Failed to retry study path node:', fbErr.message);
      throw fbErr;
    }
  }
}

/**
 * Update node status on a study path
 * 
 * @param {string} topicId 
 * @param {number|string} nodeId 
 * @param {'active'|'completed'|'locked'} status 
 */
export async function updateStudyPathNode(topicId, nodeId, status) {
  try {
    const response = await apiClient.put(`/api/study-path/${encodeURIComponent(topicId)}/node/${nodeId}`, { status });
    return response.data?.studyPath || null;
  } catch (err) {
    try {
      const fb = await apiClient.put(`/api/backend/study-path/${encodeURIComponent(topicId)}/node/${nodeId}`, { status });
      return fb.data?.studyPath || null;
    } catch (fbErr) {
      console.error('[api] Failed to update node status:', fbErr.message);
      throw fbErr;
    }
  }
}

/** Analyze a learner's typed recall against one lesson's summary and concepts. */
export async function analyzeStudyPathNodeSummary(topicId, nodeId, summary) {
  if (!topicId) throw new Error('topicId is required');
  const path = `/api/study-path/${encodeURIComponent(topicId)}/node/${nodeId}/analyze-summary`;
  try {
    const response = await apiClient.post(path, { summary });
    return response.data;
  } catch (err) {
    try {
      const fallbackPath = `/api/backend/study-path/${encodeURIComponent(topicId)}/node/${nodeId}/analyze-summary`;
      const response = await apiClient.post(fallbackPath, { summary });
      return response.data;
    } catch (fallbackError) {
      const message = fallbackError?.response?.data?.message || err?.response?.data?.message || fallbackError?.message || 'Could not analyze this summary.';
      throw new Error(message);
    }
  }
}

/**
 * Delete a study path by topicId
 *
 * @param {string} topicId
 */
export async function deleteStudyPath(topicId) {
  if (!topicId) throw new Error('topicId is required');
  try {
    await apiClient.delete(`/api/study-path/${encodeURIComponent(topicId)}`);
  } catch (err) {
    try {
      await apiClient.delete(`/api/backend/study-path/${encodeURIComponent(topicId)}`);
    } catch (fbErr) {
      const msg = fbErr?.response?.data?.message || err?.response?.data?.message || fbErr?.message || 'Failed to delete study path.';
      throw new Error(msg);
    }
  }
}

// ─── FLASHCARD API INTEGRATION (Replacing mock demo data) ─────────────────────

/**
 * Fetch flashcards from backend
 * 
 * @param {Object} [params] - { category, deckId, favorite, search }
 */
export async function getFlashcards(params = {}) {
  const query = new URLSearchParams();
  if (params.category) query.append('category', params.category);
  if (params.deckId) query.append('deckId', params.deckId);
  if (params.favorite) query.append('favorite', 'true');
  if (params.search) query.append('search', params.search);

  const qs = query.toString() ? `?${query.toString()}` : '';

  try {
    const res = await apiClient.get(`/api/flashcards/cards${qs}`);
    return res.data?.flashCards || res.data?.cards || res.data || [];
  } catch (err) {
    try {
      const fb = await apiClient.get(`/api/backend/flashcards/cards${qs}`);
      return fb.data?.flashCards || fb.data?.cards || fb.data || [];
    } catch (fbErr) {
      console.error('[api] Failed to fetch flashcards:', fbErr.message);
      return [];
    }
  }
}

/**
 * Fetch flashcard decks
 */
export async function getFlashcardDecks() {
  try {
    const res = await apiClient.get('/api/flashcards/decks');
    return res.data?.decks || [];
  } catch {
    try {
      const fb = await apiClient.get('/api/backend/flashcards/decks');
      return fb.data?.decks || [];
    } catch {
      return [];
    }
  }
}

/**
 * Generate AI flashcards from study material
 */
export async function generateFlashcards(payload) {
  try {
    const res = await apiClient.post('/api/flashcards/generate', payload);
    return res.data;
  } catch (err) {
    const fb = await apiClient.post('/api/backend/flashcards/generate', payload);
    return fb.data;
  }
}

/**
 * Submit flashcard review rating (Spaced Repetition)
 */
export async function reviewFlashcard(payload) {
  const { cardId, rating, deckId, subject, topic } = payload;
  const numRating = typeof rating === 'number' ? rating : (rating === 'easy' ? 4 : rating === 'good' ? 3 : 2);
  const body = {
    rating: numRating,
    deckId,
    subject,
    topic
  };
  try {
    const res = await apiClient.post(`/api/flashcards/cards/${cardId}/review`, body);
    return res.data;
  } catch (err) {
    const fb = await apiClient.post(`/api/backend/flashcards/cards/${cardId}/review`, body);
    return fb.data;
  }
}

/**
 * Get unit challenge questions for topic
 * @param {string} topicId
 */
export async function getStudyPathChallenge(topicId) {
  if (!topicId) throw new Error('topicId is required');
  try {
    const res = await apiClient.get(`/api/study-path/${encodeURIComponent(topicId)}/challenge`);
    return res.data;
  } catch (err) {
    const fb = await apiClient.get(`/api/backend/study-path/${encodeURIComponent(topicId)}/challenge`);
    return fb.data;
  }
}

/**
 * Submit answers for unit challenge
 * @param {string} topicId
 * @param {Array<number|null>} answers
 */
export async function submitStudyPathChallenge(topicId, answers) {
  if (!topicId) throw new Error('topicId is required');
  try {
    const res = await apiClient.post(`/api/study-path/${encodeURIComponent(topicId)}/challenge/submit`, { answers });
    return res.data;
  } catch (err) {
    const fb = await apiClient.post(`/api/backend/study-path/${encodeURIComponent(topicId)}/challenge/submit`, { answers });
    return fb.data;
  }
}

/**
 * Retry unit challenge: clears current set and generates fresh set
 * @param {string} topicId
 */
export async function retryStudyPathChallenge(topicId) {
  if (!topicId) throw new Error('topicId is required');
  try {
    const res = await apiClient.post(`/api/study-path/${encodeURIComponent(topicId)}/challenge/retry`, {});
    return res.data;
  } catch (err) {
    const fb = await apiClient.post(`/api/backend/study-path/${encodeURIComponent(topicId)}/challenge/retry`, {});
    return fb.data;
  }
}

const api = {
  uploadStudyMaterial,
  generatePath,
  getActiveStudyPath,
  getUserStudyPaths,
  getStudyPath,
  updateStudyPathNode,
  analyzeStudyPathNodeSummary,
  deleteStudyPath,
  getStudyPathChallenge,
  submitStudyPathChallenge,
  retryStudyPathChallenge,
  getFlashcards,
  getFlashcardDecks,
  generateFlashcards,
  reviewFlashcard
};

export default api;
