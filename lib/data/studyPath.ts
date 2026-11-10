export const CHALLENGE_PASS_MARK = 5
export const CHALLENGE_XP_PER_QUESTION = 5
export const TOTAL_CHALLENGE_QUESTIONS = 10
export const MAX_CHALLENGE_XP = TOTAL_CHALLENGE_QUESTIONS * CHALLENGE_XP_PER_QUESTION

export interface LessonContent {
  analogy: string
  paragraphs: string[]
  keyConcepts: string[]
}

export interface QuizData {
  question: string
  options: string[]
  correctAnswerIndex: number
  explanation: string
  hint?: string
}

export interface LessonBreakdownSlide {
  heading: string
  body: string
  memoryTip?: string
}

export interface ChallengeQuestion {
  id: number
  question: string
  options: string[]
  correctAnswerIndex: number
  explanation: string
  sourceNodeIds: number[]
  type: 'recall' | 'connect' | 'compare' | 'sequence' | 'cause-effect' | 'synthesis'
  xp: number
}

export interface ChallengeSummary {
  status: 'locked' | 'active' | 'completed'
  questionCount: number
  passMark: number
  maxXp: number
  bestScore: number
  bestXp: number
  passed?: boolean
}

export interface ChallengeSubmitResult {
  score: number
  total: number
  passed: boolean
  passMark: number
  attemptXp: number
  xpAwarded: number
  maxXp: number
  missedNodeIds: number[]
  perQuestion: {
    id: number
    correct: boolean
    xp: number
  }[]
}

export interface LearningNode {
  id: number
  title: string
  status: 'completed' | 'active' | 'locked'
  contentStatus?: 'pending' | 'generating' | 'ready' | 'failed'
  generationError?: string
  xp: number
  duration: string
  unit?: string
  slideImage?: string
  summary: string
  breakdown?: LessonBreakdownSlide[]
  sourceFacts?: string[]
  sourcePages?: number[]
  keyConcepts: string[]
  lessonContent?: LessonContent
  quiz?: QuizData
  quiz2?: QuizData
  finalQuiz?: QuizData[]
  isSummary?: boolean
  isFinalQuiz?: boolean
  nextNodeTitle?: string
}

export interface StudyPathTopic {
  topicId: string
  title: string
  courseCode: string
  currentProgress: number
  completed?: boolean
  challenge?: ChallengeSummary
  nodes: LearningNode[]
}

export const DEFAULT_TOPIC: StudyPathTopic = {
  topicId: '',
  title: '',
  courseCode: '',
  currentProgress: 0,
  completed: false,
  challenge: {
    status: 'locked',
    questionCount: 10,
    passMark: 5,
    maxXp: 50,
    bestScore: 0,
    bestXp: 0,
  },
  nodes: []
}

export const SAMPLE_TOPICS: StudyPathTopic[] = [
  {
    topicId: 'demo-research-methods-statistics-university',
    title: 'Research Methods & Basic Statistics',
    courseCode: 'GST / RMS 101 · Interactive Demo',
    currentProgress: 0,
    completed: false,
    challenge: {
      status: 'locked',
      questionCount: 10,
      passMark: 5,
      maxXp: 50,
      bestScore: 0,
      bestXp: 0,
    },
    nodes: [
      {
        id: 8001,
        title: 'What Is Research? Concepts & Types',
        status: 'active',
        contentStatus: 'ready',
        xp: 10,
        duration: '5 min',
        unit: 'Unit 1 – Foundations of Research',
        summary:
          'Research is a systematic, objective process of inquiry aimed at discovering new knowledge or verifying existing knowledge. It is classified by purpose (pure vs. applied), approach (quantitative vs. qualitative), and method (descriptive, correlational, experimental).',
        keyConcepts: [
          'Research: systematic inquiry to discover or verify knowledge',
          'Pure research advances theory; applied research solves real problems',
          'Quantitative: numerical data & statistical analysis',
          'Qualitative: non-numerical, interpretive, context-rich',
          'Empirical research is based on observation & evidence',
        ],
        breakdown: [
          {
            heading: 'Defining Research & Purpose',
            body: '**Research** is a careful, systematic process of collecting, analyzing, and interpreting information (data) to increase understanding of a phenomenon. It must be **objective**, **replicable**, and **controlled**. **Pure (Basic) research** builds theory with no immediate practical use; **Applied research** directly solves a real problem.',
            memoryTip: 'ROCC — Research is Objective, Controlled, and Collected. Pure = know. Applied = fix.',
          },
          {
            heading: 'Quantitative vs. Qualitative Research',
            body: '**Quantitative research** collects numerical data and uses statistical tools — surveys, experiments, census data. **Qualitative research** collects words, images, and meanings — interviews, observations, case studies. **Mixed-methods** combines both for a richer picture.',
            memoryTip: 'Quant = quantities/numbers. Qual = qualities/meanings.',
          },
        ],
        quiz: {
          question: 'Which type of research is primarily aimed at advancing theoretical knowledge without immediate practical application?',
          options: ['Applied research', 'Action research', 'Pure (basic) research', 'Descriptive research'],
          correctAnswerIndex: 2,
          explanation: 'Pure (basic) research is curiosity-driven and focused on building or testing theories, with no immediate intention to solve a specific practical problem.',
          hint: 'Think of scientists working in labs just to understand how nature works.',
        },
        quiz2: {
          question: 'A researcher collects interview transcripts and observes participants in their natural setting. What type of research is this?',
          options: ['Quantitative', 'Experimental', 'Qualitative', 'Longitudinal'],
          correctAnswerIndex: 2,
          explanation: 'Qualitative research collects non-numerical data (words, observations, meanings) and interprets it in context rather than applying statistical analysis.',
          hint: 'Interviews and observation = rich words, not numbers.',
        },
        nextNodeTitle: 'The Research Process & Problem Formulation',
      },
      {
        id: 8002,
        title: 'The Research Process & Problem Formulation',
        status: 'locked',
        contentStatus: 'ready',
        xp: 10,
        duration: '6 min',
        unit: 'Unit 1 – Foundations of Research',
        summary:
          'Every research project follows a logical sequence: identifying the problem, reviewing literature, formulating hypotheses, designing the study, collecting and analyzing data, and reporting findings. A well-defined research problem is the cornerstone of a good study.',
        keyConcepts: [
          '8-step research process: problem → report',
          'Research problem must be clear, researchable & significant',
          'Literature review: what is already known?',
          'Research question narrows the problem into a testable inquiry',
          'Hypothesis: a tentative, testable prediction',
        ],
        breakdown: [
          {
            heading: 'The 8-Step Research Process',
            body: '1. **Identify the problem** 2. Review literature 3. Formulate research question/hypothesis 4. Design the study 5. Collect data 6. Analyze data 7. Interpret results 8. Report & publish. Each step informs the next — skipping steps introduces bias and errors.',
            memoryTip: 'IRFDC-AIR: Identify, Review, Formulate, Design, Collect, Analyze, Interpret, Report.',
          },
          {
            heading: 'Research Problem & Hypothesis',
            body: 'A good research problem is **Specific**, **Researchable**, **Significant**, and **Ethical** (SRSE). From it, you derive a **hypothesis** — a testable statement. The **null hypothesis (H₀)** states no effect exists; the **alternative hypothesis (H₁)** states an effect exists. Research aims to reject or fail to reject H₀.',
            memoryTip: 'SRSE for the problem. H₀ = nothing. H₁ = something. Test which is true.',
          },
        ],
        quiz: {
          question: 'Which statement correctly describes the null hypothesis (H₀)?',
          options: [
            'It predicts a significant effect between variables',
            'It states that no relationship or difference exists between variables',
            'It represents the researcher\'s expected result',
            'It is used only in qualitative research',
          ],
          correctAnswerIndex: 1,
          explanation: 'The null hypothesis (H₀) is the default assumption that there is no significant relationship or difference between the variables being studied. It is what researchers attempt to disprove.',
          hint: 'Null = nothing. No effect, no difference.',
        },
        quiz2: {
          question: 'What is the FIRST step in the research process?',
          options: ['Collecting data', 'Reviewing related literature', 'Identifying and defining the research problem', 'Formulating a hypothesis'],
          correctAnswerIndex: 2,
          explanation: 'The research process begins with clearly identifying and defining the research problem. Everything else — the literature review, hypothesis, design — flows from a well-defined problem.',
          hint: 'You cannot solve a problem you have not clearly stated.',
        },
        nextNodeTitle: 'Research Design: Experimental & Non-Experimental',
      },
      {
        id: 8003,
        title: 'Research Design: Experimental & Non-Experimental',
        status: 'locked',
        contentStatus: 'ready',
        xp: 10,
        duration: '7 min',
        unit: 'Unit 2 – Research Design & Sampling',
        summary:
          'Research design is the blueprint of a study. Experimental designs manipulate an independent variable and measure effects on a dependent variable — establishing causality. Non-experimental designs (descriptive, correlational, survey) describe or find relationships without manipulation.',
        keyConcepts: [
          'Experimental design: manipulates IV, measures DV, requires control group',
          'Causality requires manipulation + control + randomization',
          'Descriptive design: describes phenomena as they exist',
          'Correlational design: finds relationships, NOT causation',
          'Survey design: systematic data collection from a sample',
        ],
        breakdown: [
          {
            heading: 'Experimental Design: IV, DV & Control',
            body: 'In an **experimental design**, the researcher deliberately **manipulates** the **independent variable (IV)** and observes its effect on the **dependent variable (DV)**. A **control group** (no treatment) is compared to an **experimental group** (treatment). **Random assignment** eliminates selection bias and **confounding variables**.',
            memoryTip: 'IV → DV. Control = no treatment baseline. Random assignment = unbiased groups.',
          },
          {
            heading: 'Non-Experimental Designs',
            body: '**Descriptive**: photographs reality — surveys, case studies, observation (no manipulation). **Correlational**: measures two variables to see if they move together (positive/negative/zero correlation) — but correlation ≠ causation. **Ex post facto**: studies events that already happened.',
            memoryTip: 'Correlation shows a link. Only an Experiment proves a cause.',
          },
        ],
        quiz: {
          question: 'A researcher divides students into two groups: one receives a new study technique (Group A) and the other studies normally (Group B). Which group is the control group?',
          options: ['Group A', 'Group B', 'Both groups', 'Neither group'],
          correctAnswerIndex: 1,
          explanation: 'Group B is the control group — it receives no treatment (the standard condition). Group A is the experimental group that receives the manipulation (new study technique).',
          hint: 'Control = the unchanged baseline for comparison.',
        },
        quiz2: {
          question: 'A study finds that students who eat breakfast score higher on exams. What can we conclude?',
          options: [
            'Eating breakfast CAUSES higher exam scores',
            'There is a correlation between breakfast and exam scores, but not necessarily causation',
            'Skipping breakfast CAUSES lower scores',
            'The finding is not significant',
          ],
          correctAnswerIndex: 1,
          explanation: 'This is a correlational finding — it shows a relationship, but without experimental manipulation (randomly assigning students to eat/skip breakfast), we cannot conclude causation. Other factors (e.g., socioeconomic status) may explain both.',
          hint: 'Correlation ≠ causation. No manipulation = no causal claim.',
        },
        nextNodeTitle: 'Sampling Methods & Data Collection',
      },
      {
        id: 8004,
        title: 'Sampling Methods & Data Collection',
        status: 'locked',
        contentStatus: 'ready',
        xp: 10,
        duration: '6 min',
        unit: 'Unit 2 – Research Design & Sampling',
        summary:
          'A sample is a subset of the population used to draw conclusions about the whole. Probability sampling (random, stratified, cluster) allows generalization. Non-probability sampling (purposive, snowball, convenience) is faster but limits generalizability. Data collection tools include questionnaires, interviews, observation, and tests.',
        keyConcepts: [
          'Population: the entire group of interest',
          'Sample: a subset selected from the population',
          'Probability sampling: every member has a known, non-zero chance of selection',
          'Simple random sampling: purest probability method',
          'Stratified: divides population into strata then samples each',
          'Convenience sampling: fast but not representative',
        ],
        breakdown: [
          {
            heading: 'Population vs. Sample & Probability Sampling',
            body: 'The **population** is the full group to study (e.g., all Nigerian university students). A **sample** is the subset studied. In **Simple Random Sampling**, everyone has an equal chance. **Stratified Sampling** divides into strata (faculties) then samples each. **Cluster Sampling** selects whole groups at once.',
            memoryTip: 'Population = all. Sample = subset. Stratified = proportional groups. Cluster = whole groups.',
          },
          {
            heading: 'Non-Probability Sampling & Data Tools',
            body: '**Purposive Sampling** selects participants by specific criteria. **Snowball Sampling** has subjects recruit peers. **Convenience Sampling** uses whoever is available. Data collection tools include **questionnaires**, **interviews**, **observation**, and **secondary records**.',
            memoryTip: 'Non-probability = quick, practical, but cannot be generalized to the entire population.',
          },
        ],
        quiz: {
          question: 'A researcher divides a university population into Science, Arts, and Social Science faculties, then randomly selects 50 students from each faculty. Which sampling method is this?',
          options: ['Simple random sampling', 'Cluster sampling', 'Stratified random sampling', 'Convenience sampling'],
          correctAnswerIndex: 2,
          explanation: 'Stratified random sampling divides the population into mutually exclusive groups (strata — here, the three faculties) and then randomly samples from each stratum, ensuring each group is represented.',
          hint: 'Divided into groups (strata), then randomly sampled within each group.',
        },
        quiz2: {
          question: 'Which sampling method gives every member of a population an equal and independent chance of being selected?',
          options: ['Purposive sampling', 'Snowball sampling', 'Systematic sampling', 'Simple random sampling'],
          correctAnswerIndex: 3,
          explanation: 'Simple random sampling is the purest probability method — each individual in the population has an equal, known chance of being selected, eliminating selection bias.',
          hint: 'Think lottery: everyone\'s name in a hat.',
        },
        nextNodeTitle: 'Measurement, Scales & Basic Statistics',
      },
      {
        id: 8005,
        title: 'Measurement, Scales & Basic Statistics',
        status: 'locked',
        contentStatus: 'ready',
        xp: 15,
        duration: '8 min',
        unit: 'Unit 3 – Data Analysis & Statistics',
        summary:
          'Measurement assigns numbers to objects/events. The four scales of measurement (nominal, ordinal, interval, ratio) determine which statistics are appropriate. Descriptive statistics (mean, median, mode, standard deviation) summarize data; inferential statistics draw conclusions about populations from samples.',
        keyConcepts: [
          'Nominal scale: categories only (no order, no distance)',
          'Ordinal scale: ordered categories, but unequal intervals',
          'Interval scale: equal intervals, no true zero (e.g., temperature °C)',
          'Ratio scale: equal intervals + true zero (e.g., weight, age)',
          'Mean: arithmetic average; sensitive to outliers',
          'Median: middle value; robust to outliers',
          'Standard deviation: average spread from the mean',
        ],
        breakdown: [
          {
            heading: 'Scales of Measurement (NOIR)',
            body: '**Nominal**: labels/categories with no order (gender, faculty). **Ordinal**: ordered ranks with unequal gaps (Likert scales, class standing). **Interval**: equal intervals without a true zero (IQ score, temperature in °C). **Ratio**: equal intervals with an absolute true zero (age, test marks, study hours).',
            memoryTip: 'NOIR: Nominal → Ordinal → Interval → Ratio. Each level adds richer statistical properties.',
          },
          {
            heading: 'Central Tendency & Inferential Statistics',
            body: '**Mean** is the arithmetic average (sensitive to outliers). **Median** is the middle value (best for skewed data). **Mode** is the most frequent value. **Standard Deviation** reflects spread around the mean. **Inferential statistics** (t-test, ANOVA) test hypotheses; p < 0.05 indicates statistical significance.',
            memoryTip: 'Outlier present? Pick Median. Small SD = tight cluster. p < 0.05 = reliable effect.',
          },
        ],
        quiz: {
          question: 'A student records students\' religions (Christianity, Islam, Others) in their questionnaire. Which scale of measurement is this?',
          options: ['Ordinal', 'Interval', 'Nominal', 'Ratio'],
          correctAnswerIndex: 2,
          explanation: 'Religion is a nominal variable — it consists of unordered categories (labels). No category is "greater than" another, and there is no meaningful distance between them.',
          hint: 'No ranking, no math — just labels/names = Nominal.',
        },
        quiz2: {
          question: 'A dataset of exam scores has one extreme outlier (a score of 100 when most scores are around 50). Which measure of central tendency should the researcher prefer?',
          options: ['Mean', 'Mode', 'Median', 'Standard deviation'],
          correctAnswerIndex: 2,
          explanation: 'The median is the best measure of central tendency when outliers are present, because it is not affected by extreme values the way the mean is.',
          hint: 'Outlier distorts the mean. Median stays in the middle.',
        },
        nextNodeTitle: undefined,
      },
    ],
  },
]
