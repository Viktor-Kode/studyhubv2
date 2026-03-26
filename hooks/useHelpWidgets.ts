import { useHelpWidgetsStore } from '@/lib/store/helpWidgetsStore'

/**
 * Tour / help chatbot visibility. Persists to localStorage; syncs to MongoDB when authenticated.
 */
export function useHelpWidgets() {
  const tourHidden = useHelpWidgetsStore((s) => s.tourHidden)
  const chatbotHidden = useHelpWidgetsStore((s) => s.chatbotHidden)
  const setTourHidden = useHelpWidgetsStore((s) => s.setTourHidden)
  const setChatbotHidden = useHelpWidgetsStore((s) => s.setChatbotHidden)

  return {
    tourButtonVisible: !tourHidden,
    chatbotVisible: !chatbotHidden,
    tourHidden,
    chatbotHidden,
    setTourHidden,
    setChatbotHidden,
    hideTourButton: () => void setTourHidden(true),
    showTourButton: () => void setTourHidden(false),
    hideChatbot: () => void setChatbotHidden(true),
    showChatbot: () => void setChatbotHidden(false),
  }
}
