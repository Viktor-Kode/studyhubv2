import { create } from 'zustand'

export const LS_TOUR_HIDDEN = 'studyhelp_tour_button_hidden'
export const LS_CHAT_HIDDEN = 'studyhelp_chatbot_hidden'

export type HelpWidgetServerPrefs = {
  hideTourButton?: boolean
  hideChatbot?: boolean
}

/** Default: hidden (no floating button) until user turns visibility on. */
function readTourHidden(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const v = localStorage.getItem(LS_TOUR_HIDDEN)
    if (v === null) return true
    return v === 'true'
  } catch {
    return true
  }
}

function readChatHidden(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const v = localStorage.getItem(LS_CHAT_HIDDEN)
    if (v === null) return true
    return v === 'true'
  } catch {
    return true
  }
}

function writeTourLs(hidden: boolean) {
  try {
    localStorage.setItem(LS_TOUR_HIDDEN, hidden ? 'true' : 'false')
  } catch {
    /* ignore */
  }
}

function writeChatLs(hidden: boolean) {
  try {
    localStorage.setItem(LS_CHAT_HIDDEN, hidden ? 'true' : 'false')
  } catch {
    /* ignore */
  }
}

async function patchServerPrefs(body: HelpWidgetServerPrefs) {
  try {
    const { getFirebaseToken } = await import('@/lib/store/authStore')
    const token = await getFirebaseToken()
    if (!token) return
    const { apiClient } = await import('@/lib/api/client')
    await apiClient.patch('/users/preferences', body)
  } catch {
    /* offline or guest — local only */
  }
}

type HelpWidgetsState = {
  tourHidden: boolean
  chatbotHidden: boolean
  initialized: boolean
  initFromStorage: () => void
  setTourHidden: (hidden: boolean) => Promise<void>
  setChatbotHidden: (hidden: boolean) => Promise<void>
  /** Apply only defined boolean fields from the server; leaves other state/localStorage unchanged. */
  applyServerPreferences: (prefs: HelpWidgetServerPrefs | null | undefined) => void
}

export const useHelpWidgetsStore = create<HelpWidgetsState>((set, get) => ({
  tourHidden: true,
  chatbotHidden: true,
  initialized: false,

  initFromStorage: () => {
    set({
      tourHidden: readTourHidden(),
      chatbotHidden: readChatHidden(),
      initialized: true,
    })
  },

  setTourHidden: async (hidden) => {
    set({ tourHidden: hidden })
    writeTourLs(hidden)
    await patchServerPrefs({ hideTourButton: hidden })
  },

  setChatbotHidden: async (hidden) => {
    set({ chatbotHidden: hidden })
    writeChatLs(hidden)
    await patchServerPrefs({ hideChatbot: hidden })
  },

  applyServerPreferences: (prefs) => {
    if (prefs == null || typeof prefs !== 'object') return
    const { tourHidden: curT, chatbotHidden: curC } = get()
    let tourHidden = curT
    let chatbotHidden = curC
    if (typeof prefs.hideTourButton === 'boolean') {
      tourHidden = prefs.hideTourButton
      writeTourLs(tourHidden)
    }
    if (typeof prefs.hideChatbot === 'boolean') {
      chatbotHidden = prefs.hideChatbot
      writeChatLs(chatbotHidden)
    }
    set({ tourHidden, chatbotHidden })
  },
}))

/** Load preferences from GET /users/me when logged in (overrides localStorage per-field when server sends booleans). */
export async function fetchAndApplyHelpWidgetPreferences() {
  try {
    const { getFirebaseToken } = await import('@/lib/store/authStore')
    const token = await getFirebaseToken()
    if (!token) return
    const { apiClient } = await import('@/lib/api/client')
    const res = await apiClient.get('/users/me')
    const prefs = res.data?.data?.user?.preferences
    useHelpWidgetsStore.getState().applyServerPreferences(prefs)
  } catch {
    /* ignore */
  }
}
