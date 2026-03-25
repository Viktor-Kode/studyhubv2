export const studentDashboardSteps = [
  {
    target: '[data-tour="student-quick-access"]',
    title: 'Quick Access',
    description: 'Jump straight to the tools you use most: CBT, Community, Library, and more.',
    position: 'right',
  },
  {
    target: '[data-tour="student-ai-assistant"]',
    title: 'AI Assistant',
    description: 'Need help explaining a concept or answering a question? Start the AI Tutor chat.',
    position: 'bottom',
  },
]

export const cbtSteps = [
  {
    target: '[data-tour="cbt-start"]',
    title: 'Start Your CBT',
    description: 'Ready when you are. Begin your exam session and track progress as you go.',
    position: 'top',
  },
]

export const communitySteps = [
  {
    target: '[data-tour="community-create-post"]',
    title: 'Create a Post',
    description: 'Share study tips, ask questions, and earn points by helping others.',
    position: 'bottom',
  },
]

export const librarySteps = [
  {
    target: '[data-tour="library-upload"]',
    title: 'Upload to Library',
    description: 'Store PDFs and learning materials for quick access later.',
    position: 'top',
  },
  {
    target: '[data-tour="library-add-material"]',
    title: 'Add a File',
    description: 'Add another PDF anytime — you can also manage folders.',
    position: 'right',
  },
]

export const aiTutorSteps = [
  {
    target: '[data-tour="ai-tutor-input"]',
    title: 'Ask the AI Tutor',
    description: 'Type your question in the input box. Keep it specific for better answers.',
    position: 'top',
  },
  {
    target: '[data-tour="ai-tutor-send"]',
    title: 'Send',
    description: 'Press the send button (or Enter) to get an answer.',
    position: 'right',
  },
]

export function getTourStepsForPathname(pathname) {
  if (!pathname) return []

  if (pathname.startsWith('/dashboard/student')) return studentDashboardSteps
  if (pathname.includes('/cbt')) return cbtSteps
  if (pathname.includes('/community')) return communitySteps
  if (pathname.includes('/library')) return librarySteps
  if (pathname.includes('/tutor') || pathname.includes('/chat')) return aiTutorSteps

  return []
}

