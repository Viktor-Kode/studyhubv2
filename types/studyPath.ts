// ============================================================================
// 1. Core Study Map & Node Contracts
// ============================================================================

export type DomainDiscipline =
  | 'medicine'
  | 'stem'
  | 'law'
  | 'business'
  | 'humanities'
  | 'general';

export type NodeProgressionStatus = 'locked' | 'active' | 'completed';
export type NodeContentStatus = 'pending' | 'generating' | 'ready' | 'failed';
export type ChallengeStatus = 'locked' | 'active' | 'completed';

export interface BreakdownSlide {
  heading: string;
  body: string;
  memoryTip?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[]; // Exactly 4 non-empty options
  correctAnswerIndex: number; // 0..3
  explanation: string;
}

export interface StudyPathNode {
  id: number; // 1-based sequential node ID
  title: string;
  unit: string; // Module or thematic grouping (e.g., "Unit 1: Structural Foundations")
  status: NodeProgressionStatus; // 'active' in progression sequence, 'locked', 'completed'
  contentStatus: NodeContentStatus; // 'generating' | 'pending' in skeleton, 'ready' when content is prepared, 'failed' on error
  generationError?: string | null;
  duration: string; // e.g., "5 min"
  xp: number; // e.g., 20 - 35 XP
  slideImage: string; // Canonical URL: e.g., "/api/slides/brachial-plexus-anatomy/page-1.png"
  sourcePages: number[]; // Original slide numbers from the PDF (e.g., [1, 2])
  sourceFacts?: string[]; // Grounded factual claims extracted from document
  summary: string;
  breakdown: BreakdownSlide[]; // Empty array [] in skeleton or when gated; populated with 2 slides when contentStatus === 'ready'
  keyConcepts: string[]; // Empty array [] in skeleton or when gated; populated when contentStatus === 'ready'
  quiz?: QuizQuestion; // Present when contentStatus === 'ready' and authorized
  quiz2?: QuizQuestion; // Present when contentStatus === 'ready' and authorized
}

export interface ChallengeMeta {
  status: ChallengeStatus;
  questionCount: number; // Standard: 10 questions
  passMark: number; // Standard: 7
  maxXp: number; // Standard: 100
  bestScore: number;
  bestXp: number;
}

export interface DocumentClassification {
  discipline: DomainDiscipline;
  documentType?: string;
  cognitiveDensity?: string;
}

export interface StudyPathResponse {
  topicId: string; // Slugified identifier and canonical documentId (e.g., "brachial-plexus-anatomy")
  title: string;
  courseCode: string; // e.g., "BRACHI 101 · Interactive Study Path"
  currentProgress: number; // Number of completed nodes
  completed: boolean; // True if all nodes completed or challenge passed
  challenge: ChallengeMeta;
  nodes: StudyPathNode[]; // Dynamic N nodes (adaptive, determined by document content)
  classification?: DocumentClassification;
}

// ============================================================================
// 2. Job & Polling Payloads
// ============================================================================

export interface JobInitResponse {
  success: boolean;
  jobId: string;
  anonymousSessionId?: string; // Server-sanitized guest session ID (anon_<32hex>)
  isAnonymousTrial?: boolean;
  cached?: boolean; // True if returned instantly from SHA-256 fingerprint cache
  topicId?: string; // Present on instant cache hit
  studyPath?: StudyPathResponse; // Present on instant cache hit (complete N-node roadmap)
}

export interface JobStatusResponse {
  success: boolean;
  jobId: string;
  status: 'queued' | 'outline' | 'writing' | 'done' | 'error';
  stage: string; // Descriptive UI string (e.g., "Reading slides... extracting outline (~15s)")
  done: number; // Number of nodes processed
  total: number; // Total nodes in study map
  topicId?: string; // Present when status === 'done'
  studyPath?: StudyPathResponse; // Initial skeleton map when status === 'done'
  message?: string; // Descriptive error message when status === 'error'
}

// ============================================================================
// 3. Error Payloads
// ============================================================================

export interface GateRequireSignupError {
  success: false;
  requireSignup: true;
  anonymousSessionId: string;
  topicId: string;
  message: string; // e.g., "Create a free account to unlock Node 2 and keep your progress!"
}

export interface PaywallTriggeredError {
  success: false;
  error: 'PAYWALL_TRIGGERED';
  code: 'PAYWALL_TRIGGERED';
  message: string;
  showUpgrade: true;
  upgradeRequired: true;
  total_maps_created: number;
  limit: number; // 3 for free tier
}

export interface NodePrepareResponse {
  success: boolean;
  node: StudyPathNode;
}

