/**
 * Syllabus topics for Study by Topic (JAMB-aligned core; WAEC/NECO reuse; Post-UTME adds aptitude topics).
 */

export type SyllabusExamKey = 'jamb' | 'waec' | 'neco' | 'postutme'

export type SyllabusSubjectKey =
  | 'english'
  | 'mathematics'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'economics'
  | 'government'
  | 'literature'
  | 'geography'
  | 'agric'
  | 'civic'
  | 'further_maths'
  | 'commerce'
  | 'accounts'
  | 'crs'

const JAMB_CORE: Record<SyllabusSubjectKey, string[]> = {
  mathematics: [
    'Number Bases',
    'Fractions, Decimals and Approximations',
    'Indices',
    'Logarithms',
    'Sequence and Series',
    'Sets',
    'Matrices and Determinants',
    'Surds',
    'Polynomials',
    'Rational Functions',
    'Linear and Quadratic Equations',
    'Inequalities',
    'Variation',
    'Trigonometry',
    'Coordinate Geometry',
    'Differentiation',
    'Integration',
    'Statistics',
    'Probability',
    'Vectors and Scalars',
    'Mechanics',
  ],
  english: [
    'Lexis and Structure',
    'Comprehension',
    'Summary Writing',
    'Sentence Interpretation',
    'Antonyms and Synonyms',
    'Register',
    'Oral English — Vowels and Consonants',
    'Oral English — Stress and Intonation',
    'Essay Writing — Formal Letter',
    'Essay Writing — Informal Letter',
    'Essay Writing — Narrative',
    'Essay Writing — Descriptive',
    'Essay Writing — Argumentative',
    'Literary Devices',
    'Figures of Speech',
  ],
  biology: [
    'Cell Biology',
    'Nutrition in Plants and Animals',
    'Transport System',
    'Respiration',
    'Excretion',
    'Reproduction in Plants',
    'Reproduction in Animals',
    'Growth and Development',
    'Genetics and Variation',
    'Evolution',
    'Ecology',
    'Microorganisms',
    'Diseases',
    'Adaptation and Conservation',
    'Nervous System',
    'Hormones',
    'Sense Organs',
    'Classification of Living Things',
  ],
  chemistry: [
    'Separation Techniques',
    'Atomic Structure',
    'Bonding',
    'Periodic Table',
    'Kinetic Theory and Gas Laws',
    'Acids, Bases and Salts',
    'Oxidation and Reduction',
    'Electrolysis',
    'Metals and Non-metals',
    'Organic Chemistry — Hydrocarbons',
    'Organic Chemistry — Functional Groups',
    'Environmental Chemistry',
    'Nuclear Chemistry',
    'Chemical Equilibrium',
    'Rates of Reaction',
    'Energetics',
    'Water and Hydrogen',
  ],
  physics: [
    'Measurement and Units',
    'Scalars and Vectors',
    'Motion',
    'Forces',
    'Work, Energy and Power',
    'Simple Machines',
    'Elasticity',
    'Pressure',
    'Waves',
    'Sound',
    'Light — Reflection',
    'Light — Refraction',
    'Electricity',
    'Magnetism',
    'Electromagnetic Spectrum',
    'Nuclear Physics',
    'Temperature and Thermometers',
    'Heat Transfer',
  ],
  economics: [
    'Basic Economic Problems',
    'Demand and Supply',
    'Price Determination',
    'Elasticity',
    'National Income',
    'Money and Banking',
    'Public Finance',
    'International Trade',
    'Population',
    'Agriculture',
    'Industry',
    'Labour',
    'Capital',
    'Economic Development',
    'Inflation',
    'Unemployment',
  ],
  government: [
    'Basic Concepts in Government',
    'Democracy',
    'Federalism',
    'Constitution',
    'Organs of Government',
    'The Legislature',
    'The Executive',
    'The Judiciary',
    'Political Parties',
    'Electoral System',
    'Pressure Groups',
    'Civil Service',
    'Local Government',
    'Nigerian Colonial History',
    'Nigerian Independence and Republic',
    'Military Rule in Nigeria',
    'Third Republic',
    'Fourth Republic',
    'ECOWAS',
    'African Union',
    'United Nations',
  ],
  literature: [
    'Drama — Plot and Character',
    'Poetry — Themes and Devices',
    'Prose — Narrative Techniques',
    'Literary Terms',
    'African Literature',
    'Shakespeare and Classics',
    'Literary Appreciation',
  ],
  geography: [
    'Map Reading',
    'Weather and Climate',
    'Rocks and Relief',
    'Vegetation and Soils',
    'Water Bodies',
    'Population',
    'Settlement',
    'Agriculture',
    'Mining and Industry',
    'Trade and Transport',
    'Environmental Issues',
    'Nigeria — Physical and Human Geography',
    'Regional Geography of Africa',
  ],
  agric: [
    'Farm Structures and Implements',
    'Soil Science',
    'Crop Production',
    'Animal Production',
    'Agricultural Economics',
    'Pests and Diseases',
    'Fish Farming',
    'Forest and Wildlife',
    'Agricultural Extension',
  ],
  civic: [
    'Citizenship',
    'Human Rights',
    'Rule of Law',
    'Democracy and Governance',
    'National Values',
    'Nigerian Constitution Overview',
    'Electoral Process',
    'Civil Society',
  ],
  further_maths: [
    'Complex Numbers',
    'Matrices',
    'Vectors',
    'Conic Sections',
    'Differentiation',
    'Integration',
    'Differential Equations',
    'Probability Distributions',
    'Mechanics — Projectiles',
    'Mechanics — Circular Motion',
  ],
  commerce: [
    'Trade',
    'Business Units',
    'Advertising',
    'Transport',
    'Insurance',
    'Warehousing',
    'Communication',
    'Finance and Capital',
    'Market Structure',
    'International Trade',
  ],
  accounts: [
    'Bookkeeping Basics',
    'The Ledger',
    'Trial Balance',
    'Final Accounts',
    'Depreciation',
    'Bank Reconciliation',
    'Control Accounts',
    'Incomplete Records',
    'Manufacturing Accounts',
    'Partnership Accounts',
  ],
  crs: [
    'Creation and Sin',
    'Covenants in the Bible',
    'Life of Jesus',
    'Early Church',
    'Pauline Epistles',
    'Islamic Studies — Pillars and Ethics',
    'Comparative Themes',
  ],
}

function cloneSubjects(base: Record<SyllabusSubjectKey, string[]>): Record<SyllabusSubjectKey, string[]> {
  const out = {} as Record<SyllabusSubjectKey, string[]>
  ;(Object.keys(base) as SyllabusSubjectKey[]).forEach((k) => {
    out[k] = [...base[k]]
  })
  return out
}

/** Post-UTME cross-cutting topics prepended for every subject */
const POSTUTME_GENERAL = ['Critical Reasoning', 'Use of English', 'Quantitative Reasoning']

export const SYLLABUS: Record<SyllabusExamKey, Record<SyllabusSubjectKey, string[]>> = {
  jamb: cloneSubjects(JAMB_CORE),
  waec: cloneSubjects(JAMB_CORE),
  neco: cloneSubjects(JAMB_CORE),
  postutme: cloneSubjects(JAMB_CORE),
}

export const SYLLABUS_SUBJECTS: { key: SyllabusSubjectKey; label: string }[] = [
  { key: 'english', label: 'English Language' },
  { key: 'mathematics', label: 'Mathematics' },
  { key: 'physics', label: 'Physics' },
  { key: 'chemistry', label: 'Chemistry' },
  { key: 'biology', label: 'Biology' },
  { key: 'economics', label: 'Economics' },
  { key: 'government', label: 'Government' },
  { key: 'literature', label: 'Literature in English' },
  { key: 'geography', label: 'Geography' },
  { key: 'agric', label: 'Agricultural Science' },
  { key: 'civic', label: 'Civic Education' },
  { key: 'further_maths', label: 'Further Mathematics' },
  { key: 'commerce', label: 'Commerce' },
  { key: 'accounts', label: 'Accounts' },
  { key: 'crs', label: 'CRS/IRS' },
]

export function getTopicsForExam(exam: SyllabusExamKey, subjectKey: SyllabusSubjectKey): string[] {
  const list = SYLLABUS[exam]?.[subjectKey] ?? []
  if (exam === 'postutme') {
    return [...POSTUTME_GENERAL, ...list]
  }
  return [...list]
}

export function progressStorageKey(exam: string, subjectKey: string, topic: string): string {
  const safeTopic = topic.replace(/\s+/g, '_').slice(0, 80)
  return `syllabus_progress_${exam}_${subjectKey}_${safeTopic}`
}

export interface SyllabusProgress {
  attempted: number
  lastAt?: string
}

export function readTopicProgress(key: string): SyllabusProgress | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as SyllabusProgress
  } catch {
    return null
  }
}

export function writeTopicProgress(key: string, data: SyllabusProgress): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}
