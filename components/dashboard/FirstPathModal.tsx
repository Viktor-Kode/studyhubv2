'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { extractTextFromFile } from '@/lib/utils/extraction'
import { uploadStudyMaterial } from '@/src/services/api'
import { openPaywallModal } from '@/lib/upgradeHandler'
import { useAuthStore } from '@/lib/store/authStore'
import {
  FiCheckCircle,
  FiFileText,
  FiLoader,
  FiUploadCloud,
  FiX
} from 'react-icons/fi'
import { IoSparklesSharp } from 'react-icons/io5'

interface FirstPathModalProps {
  isOpen?: boolean
  onClose: () => void
  onSkip?: () => void
}

const SAMPLE_LECTURE_FILENAME = 'Introduction_to_Research_Methods.pdf'

// ---------------------------------------------------------------------------
// DEMO STUDY PATH — hardcoded, no API call, instant navigation
// Topic: Research Methods & Statistics
// Why this topic: virtually every Nigerian university student — sciences,
// social sciences, arts, management, education — passes through this course.
// It is the single best "middle ground" topic that guarantees familiarity.
// ---------------------------------------------------------------------------
const SAMPLE_STUDY_PATH = {
  topicId: 'demo-research-methods-statistics-university',
  title: 'Research Methods & Basic Statistics',
  courseCode: 'GST / RMS 101 · Interactive Demo',
  currentProgress: 0,
  challenge: { status: 'locked', questionCount: 10, passMark: 5, maxXp: 50, bestScore: 0, bestXp: 0 },
  nodes: [
    // ── Node 1 ────────────────────────────────────────────────────────────
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
    // ── Node 2 ────────────────────────────────────────────────────────────
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
    // ── Node 3 ────────────────────────────────────────────────────────────
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
    // ── Node 4 ────────────────────────────────────────────────────────────
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
    // ── Node 5 ────────────────────────────────────────────────────────────
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
}

export default function FirstPathModal({
  isOpen = true,
  onClose
}: FirstPathModalProps) {
  const router = useRouter()
  const { user } = useAuthStore()

  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractionLabel, setExtractionLabel] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateStage, setGenerateStage] = useState('')
  const [isLoadingSample, setIsLoadingSample] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File) => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    if (!isPdf && !file.name.match(/\.(docx|pptx|ppt|txt)$/i)) {
      setError('Please upload a PDF lecture note or document.')
      return
    }

    const maxMb = 50
    if (file.size > maxMb * 1024 * 1024) {
      setError(`File size exceeds ${maxMb}MB limit.`)
      return
    }

    setError(null)
    setUploadedFile(file)
    setExtractionLabel('Reading lecture note & extracting text...')
    setExtracting(true)

    try {
      const text = await extractTextFromFile(file)
      if (text && text.trim().length >= 30) {
        setExtractedText(text)
      } else {
        setExtractedText('')
      }
    } catch {
      // PDF pipeline handles server-side parsing if client extraction fails
      setExtractedText('')
    } finally {
      setExtracting(false)
      setExtractionLabel('')
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      const files = e.dataTransfer.files
      if (files && files.length > 0) {
        void processFile(files[0])
      }
    },
    [processFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const executeGeneration = async (file: File | null, text: string, customTitle?: string) => {
    if (isGenerating) return

    setError(null)
    setIsGenerating(true)
    setGenerateStage('Uploading lecture note to AI...')

    try {
      const title =
        customTitle ||
        (file ? file.name.replace(/\.[^/.]+$/, '').trim() : '') ||
        'My Lecture Path'

      // Pass null file when using text-only path (e.g. sample) so api.js
      // routes through the text branch instead of the PDF binary pipeline.
      const studyPath = await uploadStudyMaterial(file ?? null, {
        title,
        text,
        userId: user?.uid,
        onProgress: (job: { stage?: string; status?: string }) => {
          setGenerateStage(job?.stage || 'Building roadmap nodes...')
        }
      })

      if (!studyPath || !studyPath.topicId) {
        throw new Error('Study path generation failed. Please try again.')
      }

      // Save active topic in localStorage so lesson view can access it instantly
      if (typeof window !== 'undefined') {
        localStorage.setItem('studyhelp_active_topic', JSON.stringify(studyPath))
        try {
          const raw = localStorage.getItem('studyhelp_saved_topics')
          const list = raw ? JSON.parse(raw) : []
          const updated = [studyPath, ...list.filter((t: any) => t?.topicId !== studyPath.topicId)]
          localStorage.setItem('studyhelp_saved_topics', JSON.stringify(updated))
        } catch {
          // ignore storage error
        }
      }

      // Automatically close modal
      onClose()

      // Route directly to Node 1 of newly generated map
      const firstNodeId = studyPath.nodes?.[0]?.id ?? 1
      router.push(`/dashboard/student/lesson/${firstNodeId}`)
    } catch (err: unknown) {
      const errorObj = err as any
      const isPaywall =
        errorObj?.code === 'PAYWALL_TRIGGERED' ||
        errorObj?.isPaywall ||
        errorObj?.response?.status === 403 ||
        errorObj?.response?.data?.error === 'PAYWALL_TRIGGERED' ||
        errorObj?.response?.data?.code === 'PAYWALL_TRIGGERED' ||
        errorObj?.message === 'PAYWALL_TRIGGERED'

      if (isPaywall) {
        openPaywallModal('study_map')
        onClose()
        return
      }

      console.error('[FirstPathModal] Generation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate study path. Please retry.')
    } finally {
      setIsGenerating(false)
      setGenerateStage('')
    }
  }

  const handleGenerate = async () => {
    if (!uploadedFile || isGenerating) return
    await executeGeneration(uploadedFile, extractedText)
  }

  const handleUseSample = async () => {
    if (isGenerating || isLoadingSample) return
    setIsLoadingSample(true)

    // Save demo path to storage
    try {
      localStorage.setItem('studyhelp_active_topic', JSON.stringify(SAMPLE_STUDY_PATH))
      const raw = localStorage.getItem('studyhelp_saved_topics')
      const list = raw ? JSON.parse(raw) : []
      const updated = [SAMPLE_STUDY_PATH, ...list.filter((t: any) => t?.topicId !== SAMPLE_STUDY_PATH.topicId)]
      localStorage.setItem('studyhelp_saved_topics', JSON.stringify(updated))
    } catch {
      // ignore storage errors
    }

    // 2-second realistic preparation delay requested
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsLoadingSample(false)
    onClose()
    // Navigate to the map so users see the full study path before diving in
    router.push(`/dashboard/student/map/${encodeURIComponent(SAMPLE_STUDY_PATH.topicId)}`)
  }

  if (!isOpen) return null

  const isReadyToBuild = !!uploadedFile && !extracting && !isGenerating

  return (
    <div
      className="sp-modal-overlay"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 9999
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="first-path-title"
    >
      <div
        className="sp-modal-box"
        style={{
          maxWidth: '560px',
          width: '100%',
          position: 'relative',
          padding: '30px 26px',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.45)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - No close button / escape hatch */}
        <div className="sp-modal-header" style={{ marginBottom: '16px', alignItems: 'flex-start' }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '999px',
                background: 'rgba(59, 130, 246, 0.12)',
                color: '#3b82f6',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '8px'
              }}
            >
              <IoSparklesSharp /> Welcome to StudyHelp
            </div>
            <h2
              id="first-path-title"
              className="sp-modal-title"
              style={{ fontSize: '22px', lineHeight: 1.3, fontWeight: 800 }}
            >
              Drop your lecture note or PDF to build your path.
            </h2>
            <p
              className="sp-tool-sub"
              style={{ marginTop: '6px', fontSize: '14px', lineHeight: 1.5, opacity: 0.85 }}
            >
              Turn boring lecture notes into a clean, step-by-step study path before your exam.
            </p>
          </div>
        </div>

        {/* Hero Element: Drag and Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !extracting && !isGenerating && fileInputRef.current?.click()}
          className={`sp-dropzone ${isDragging ? 'dragging' : ''} ${uploadedFile ? 'done' : ''}`}
          style={{
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            padding: '30px 20px',
            textAlign: 'center',
            borderWidth: '2px',
            borderStyle: 'dashed',
            borderColor: isDragging
              ? '#3b82f6'
              : uploadedFile
              ? '#22c55e'
              : 'rgba(99, 102, 241, 0.45)',
            borderRadius: '16px',
            background: isDragging
              ? 'rgba(59, 130, 246, 0.08)'
              : uploadedFile
              ? 'rgba(34, 197, 94, 0.06)'
              : 'rgba(15, 23, 42, 0.5)',
            boxShadow: isDragging
              ? '0 0 20px rgba(59, 130, 246, 0.2)'
              : uploadedFile
              ? '0 0 20px rgba(34, 197, 94, 0.15)'
              : 'none',
            transition: 'all 0.2s ease',
            margin: '16px 0 14px'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="sp-hidden-input"
            accept=".pdf,application/pdf,.docx,.pptx,.ppt,.txt"
            onChange={(e) => {
              if (e.target.files?.[0]) void processFile(e.target.files[0])
            }}
            disabled={isGenerating}
          />

          {extracting ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <FiLoader className="animate-spin sp-dropzone-loader" size={32} />
              <p className="sp-dropzone-title" style={{ fontSize: '15px' }}>
                {extractionLabel}
              </p>
            </div>
          ) : uploadedFile ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div
                className="sp-dropzone-icon done"
                style={{
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  background: 'rgba(34, 197, 94, 0.18)',
                  color: '#22c55e'
                }}
              >
                <FiCheckCircle size={28} />
              </div>
              <div>
                <p className="sp-dropzone-title sp-dropzone-file" style={{ fontWeight: 700, fontSize: '15px' }}>
                  {uploadedFile.name}
                </p>
                <p className="sp-dropzone-sub" style={{ fontSize: '13px', opacity: 0.8 }}>
                  {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to generate path
                </p>
              </div>
              <button
                type="button"
                className="sp-dropzone-remove"
                onClick={(e) => {
                  e.stopPropagation()
                  setUploadedFile(null)
                  setExtractedText('')
                }}
                disabled={isGenerating}
                style={{
                  marginTop: '4px',
                  background: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <FiX /> Remove file
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div
                className="sp-dropzone-icon"
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isDragging ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.08)',
                  color: '#3b82f6'
                }}
              >
                <FiUploadCloud size={28} />
              </div>
              <div>
                <p className="sp-dropzone-title" style={{ fontWeight: 700, fontSize: '16px', margin: 0 }}>
                  Drag & drop your lecture PDF here
                </p>
                <p className="sp-dropzone-sub" style={{ fontSize: '13px', margin: '4px 0 0', opacity: 0.75 }}>
                  or click to browse from your device (PDF up to 50MB)
                </p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '13px',
              lineHeight: 1.4,
              marginBottom: '14px'
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* High-Contrast Action Button - Pops when file is dropped */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!isReadyToBuild}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: '15px',
            letterSpacing: '0.02em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: !isReadyToBuild ? 'not-allowed' : 'pointer',
            background: isReadyToBuild
              ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
              : '#162032',
            color: isReadyToBuild ? '#ffffff' : '#64748b',
            border: isReadyToBuild
              ? '1px solid #4ade80'
              : '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: isReadyToBuild
              ? '0 0 24px rgba(34, 197, 94, 0.55), 0 4px 16px rgba(34, 197, 94, 0.4)'
              : 'none',
            transform: isReadyToBuild ? 'translateY(-1px)' : 'none',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            marginTop: '4px'
          }}
        >
          {isGenerating ? (
            <>
              <FiLoader style={{ animation: 'spin 1s linear infinite' }} size={18} />
              <span>{generateStage || 'Creating your roadmap...'}</span>
            </>
          ) : (
            <>
              <IoSparklesSharp size={18} />
              <span>Build My Study Path</span>
            </>
          )}
        </button>

        {/* Frictionless Fallback - Sample Lecture Note */}
        <div style={{ marginTop: '14px', width: '100%' }}>
          <button
            type="button"
            onClick={handleUseSample}
            disabled={isGenerating || extracting || isLoadingSample}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              background: 'rgba(99, 102, 241, 0.08)',
              color: '#c7d2fe',
              fontSize: '14px',
              fontWeight: 600,
              cursor: isGenerating || isLoadingSample ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              opacity: isGenerating || isLoadingSample ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (!isGenerating && !isLoadingSample) {
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.16)'
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.6)'
                e.currentTarget.style.color = '#ffffff'
              }
            }}
            onMouseLeave={(e) => {
              if (!isGenerating && !isLoadingSample) {
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)'
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.35)'
                e.currentTarget.style.color = '#c7d2fe'
              }
            }}
          >
            {isLoadingSample ? (
              <>
                <FiLoader style={{ animation: 'spin 1s linear infinite' }} size={16} />
                <span>Loading sample study map...</span>
              </>
            ) : (
              <>
                <FiFileText size={16} />
                <span>Try with a sample lecture note</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
