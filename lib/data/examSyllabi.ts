/**
 * Nigerian Exam Syllabi - Topics and Question Styles
 * Used to generate standard questions matching each exam's format
 */

export type ExamType = 'WAEC' | 'JAMB' | 'POST_UTME' | 'NECO' | 'BECE'

export interface SyllabusTopic {
  topic: string
  subtopics?: string[]
  weight?: number // Importance/weight in exam (1-10)
}

export interface ExamSyllabus {
  examType: ExamType
  subjects: {
    [subject: string]: {
      topics: SyllabusTopic[]
      questionStyle: string
      difficultyLevel: 'easy' | 'medium' | 'hard'
      questionFormat: string
    }
  }
}

// WAEC Syllabus Structure
export const waecSyllabus: ExamSyllabus = {
  examType: 'WAEC',
  subjects: {
    Mathematics: {
      topics: [
        { topic: 'Number and Numeration', weight: 8 },
        { topic: 'Algebraic Processes', weight: 9 },
        { topic: 'Mensuration', weight: 7 },
        { topic: 'Plane Geometry', weight: 8 },
        { topic: 'Trigonometry', weight: 6 },
        { topic: 'Statistics and Probability', weight: 5 },
        { topic: 'Vectors and Transformation', weight: 4 },
      ],
      questionStyle: 'WAEC Mathematics questions are practical and application-based. They test understanding of concepts through real-world scenarios. Questions often involve multi-step problem solving.',
      difficultyLevel: 'medium',
      questionFormat: 'Multiple choice with 4 options. Questions are typically 1-2 sentences, testing specific concepts or calculations.',
    },
    English: {
      topics: [
        { topic: 'Comprehension', weight: 10 },
        { topic: 'Lexis and Structure', weight: 9 },
        { topic: 'Oral English', weight: 6 },
        { topic: 'Summary Writing', weight: 7 },
        { topic: 'Essay Writing', weight: 8 },
      ],
      questionStyle: 'WAEC English focuses on comprehension, vocabulary, grammar, and usage. Questions test understanding of context, synonyms, antonyms, and grammatical correctness.',
      difficultyLevel: 'medium',
      questionFormat: 'Multiple choice focusing on vocabulary, grammar, and comprehension skills.',
    },
    Physics: {
      topics: [
        { topic: 'Mechanics', weight: 9 },
        { topic: 'Thermodynamics', weight: 7 },
        { topic: 'Waves and Optics', weight: 6 },
        { topic: 'Electricity and Magnetism', weight: 8 },
        { topic: 'Modern Physics', weight: 5 },
      ],
      questionStyle: 'WAEC Physics questions combine theoretical understanding with practical applications. They often include calculations and require understanding of physical principles.',
      difficultyLevel: 'medium',
      questionFormat: 'Multiple choice with calculations and conceptual questions. Options include numerical values and descriptive answers.',
    },
    Chemistry: {
      topics: [
        { topic: 'Atomic Structure and Bonding', weight: 8 },
        { topic: 'Stoichiometry', weight: 9 },
        { topic: 'Acids, Bases and Salts', weight: 7 },
        { topic: 'Organic Chemistry', weight: 8 },
        { topic: 'Physical Chemistry', weight: 6 },
      ],
      questionStyle: 'WAEC Chemistry questions test understanding of chemical principles, reactions, and calculations. They emphasize practical applications and problem-solving.',
      difficultyLevel: 'medium',
      questionFormat: 'Multiple choice covering chemical concepts, reactions, and calculations.',
    },
    Biology: {
      topics: [
        { topic: 'Cell Biology', weight: 8 },
        { topic: 'Genetics', weight: 7 },
        { topic: 'Ecology', weight: 6 },
        { topic: 'Human Anatomy and Physiology', weight: 9 },
        { topic: 'Plant Biology', weight: 6 },
      ],
      questionStyle: 'WAEC Biology questions focus on understanding biological processes, structures, and their functions. Questions test knowledge of biological systems and their interrelationships.',
      difficultyLevel: 'medium',
      questionFormat: 'Multiple choice questions testing biological knowledge, processes, and applications.',
    },
  },
}

// JAMB Syllabus Structure
export const jambSyllabus: ExamSyllabus = {
  examType: 'JAMB',
  subjects: {
    Mathematics: {
      topics: [
        { topic: 'Number Bases', weight: 6 },
        { topic: 'Indices, Logarithms and Surds', weight: 7 },
        { topic: 'Polynomials', weight: 8 },
        { topic: 'Sequences and Series', weight: 6 },
        { topic: 'Matrices and Determinants', weight: 5 },
        { topic: 'Coordinate Geometry', weight: 7 },
        { topic: 'Calculus', weight: 8 },
        { topic: 'Statistics and Probability', weight: 6 },
      ],
      questionStyle: 'JAMB Mathematics questions are more advanced and test deeper understanding. They often require multiple steps and test analytical thinking. Questions are concise and direct.',
      difficultyLevel: 'hard',
      questionFormat: 'Multiple choice with 4 options. Questions are typically short and test specific mathematical concepts or problem-solving skills.',
    },
    English: {
      topics: [
        { topic: 'Comprehension/Summary', weight: 10 },
        { topic: 'Lexis and Structure', weight: 9 },
        { topic: 'Oral Forms', weight: 5 },
        { topic: 'Narrative', weight: 4 },
      ],
      questionStyle: 'JAMB English is more challenging, testing advanced vocabulary, complex grammar structures, and deeper comprehension skills. Questions often have subtle distinctions between options.',
      difficultyLevel: 'hard',
      questionFormat: 'Multiple choice with emphasis on advanced vocabulary, complex grammar, and detailed comprehension.',
    },
    Physics: {
      topics: [
        { topic: 'Mechanics', weight: 9 },
        { topic: 'Thermal Physics', weight: 7 },
        { topic: 'Waves', weight: 6 },
        { topic: 'Electricity and Magnetism', weight: 8 },
        { topic: 'Modern Physics', weight: 6 },
      ],
      questionStyle: 'JAMB Physics questions are more theoretical and require deeper understanding. They test analytical skills and ability to apply principles to complex scenarios.',
      difficultyLevel: 'hard',
      questionFormat: 'Multiple choice with complex scenarios and calculations. Options test deep understanding of physical principles.',
    },
    Chemistry: {
      topics: [
        { topic: 'Atomic Structure', weight: 7 },
        { topic: 'Chemical Bonding', weight: 8 },
        { topic: 'Stoichiometry', weight: 9 },
        { topic: 'States of Matter', weight: 6 },
        { topic: 'Energetics', weight: 7 },
        { topic: 'Organic Chemistry', weight: 8 },
      ],
      questionStyle: 'JAMB Chemistry questions are more advanced, testing deeper understanding of chemical principles, mechanisms, and complex calculations.',
      difficultyLevel: 'hard',
      questionFormat: 'Multiple choice with emphasis on chemical mechanisms, advanced calculations, and theoretical understanding.',
    },
    Biology: {
      topics: [
        { topic: 'Cell Structure and Function', weight: 8 },
        { topic: 'Genetics and Evolution', weight: 7 },
        { topic: 'Ecology', weight: 6 },
        { topic: 'Human Physiology', weight: 9 },
        { topic: 'Plant Physiology', weight: 6 },
      ],
      questionStyle: 'JAMB Biology questions test advanced understanding of biological processes, requiring analytical thinking and ability to connect different biological concepts.',
      difficultyLevel: 'hard',
      questionFormat: 'Multiple choice testing advanced biological knowledge and ability to analyze biological systems.',
    },
  },
}

// NECO Syllabus Structure
export const necoSyllabus: ExamSyllabus = {
  examType: 'NECO',
  subjects: {
    Mathematics: {
      topics: [
        { topic: 'Number and Numeration', weight: 8 },
        { topic: 'Algebra', weight: 9 },
        { topic: 'Geometry and Trigonometry', weight: 7 },
        { topic: 'Statistics and Probability', weight: 6 },
      ],
      questionStyle: 'NECO Mathematics questions are similar to WAEC but may have slight variations in emphasis. They test practical application of mathematical concepts.',
      difficultyLevel: 'medium',
      questionFormat: 'Multiple choice with practical application questions.',
    },
    English: {
      topics: [
        { topic: 'Comprehension', weight: 10 },
        { topic: 'Lexis and Structure', weight: 9 },
        { topic: 'Oral English', weight: 6 },
      ],
      questionStyle: 'NECO English questions focus on comprehension, vocabulary, and grammar similar to WAEC format.',
      difficultyLevel: 'medium',
      questionFormat: 'Multiple choice testing English language skills.',
    },
  },
}

// POST UTME Syllabus Structure
export const postUtmeSyllabus: ExamSyllabus = {
  examType: 'POST_UTME',
  subjects: {
    Mathematics: {
      topics: [
        { topic: 'Algebra', weight: 9 },
        { topic: 'Geometry', weight: 7 },
        { topic: 'Trigonometry', weight: 6 },
        { topic: 'Calculus', weight: 8 },
      ],
      questionStyle: 'POST UTME Mathematics questions are university-level, testing advanced concepts and problem-solving abilities. They are more challenging than JAMB.',
      difficultyLevel: 'hard',
      questionFormat: 'Multiple choice with advanced problem-solving questions.',
    },
    English: {
      topics: [
        { topic: 'Advanced Comprehension', weight: 10 },
        { topic: 'Advanced Lexis', weight: 9 },
        { topic: 'Critical Reasoning', weight: 8 },
      ],
      questionStyle: 'POST UTME English questions are university-level, testing advanced comprehension, vocabulary, and critical thinking skills.',
      difficultyLevel: 'hard',
      questionFormat: 'Multiple choice with emphasis on advanced comprehension and critical reasoning.',
    },
  },
}

// BECE Syllabus Structure
export const beceSyllabus: ExamSyllabus = {
  examType: 'BECE',
  subjects: {
    Mathematics: {
      topics: [
        { topic: 'Basic Arithmetic', weight: 9 },
        { topic: 'Basic Algebra', weight: 7 },
        { topic: 'Basic Geometry', weight: 6 },
        { topic: 'Basic Statistics', weight: 5 },
      ],
      questionStyle: 'BECE Mathematics questions are foundational, testing basic mathematical concepts and simple problem-solving skills suitable for junior secondary level.',
      difficultyLevel: 'easy',
      questionFormat: 'Multiple choice with simple, straightforward questions testing basic concepts.',
    },
    English: {
      topics: [
        { topic: 'Basic Comprehension', weight: 10 },
        { topic: 'Basic Grammar', weight: 9 },
        { topic: 'Vocabulary', weight: 8 },
      ],
      questionStyle: 'BECE English questions test foundational English language skills, basic grammar, and simple comprehension.',
      difficultyLevel: 'easy',
      questionFormat: 'Multiple choice with simple English language questions.',
    },
  },
}

// Combined syllabus map
export const examSyllabi: Record<ExamType, ExamSyllabus> = {
  WAEC: waecSyllabus,
  JAMB: jambSyllabus,
  NECO: necoSyllabus,
  POST_UTME: postUtmeSyllabus,
  BECE: beceSyllabus,
}

// Get syllabus for a specific exam and subject
export const getSyllabus = (examType: ExamType, subject: string) => {
  const syllabus = examSyllabi[examType]
  return syllabus.subjects[subject] || null
}

// Get all subjects for an exam type
export const getSubjectsForExam = (examType: ExamType): string[] => {
  const syllabus = examSyllabi[examType]
  return Object.keys(syllabus.subjects)
}
