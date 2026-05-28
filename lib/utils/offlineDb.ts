import { openDB, IDBPDatabase } from 'idb'

let dbPromise: Promise<IDBPDatabase> | null = null

export function getDB() {
  if (typeof window === 'undefined') return null
  if (!dbPromise) {
    dbPromise = openDB('studyhelp-offline', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('questions')) {
          db.createObjectStore('questions')
        }
        if (!db.objectStoreNames.contains('flashcards')) {
          db.createObjectStore('flashcards')
        }
        if (!db.objectStoreNames.contains('planner')) {
          db.createObjectStore('planner')
        }
        if (!db.objectStoreNames.contains('progress')) {
          db.createObjectStore('progress', { autoIncrement: true })
        }
      }
    })
  }
  return dbPromise
}

// ─── CBT Question Sets ────────────────────────────────────────────────────────
export async function cacheQuestions(questionsData: any) {
  const db = await getDB()
  if (!db) return
  await db.put('questions', questionsData, 'cached-questions')
}

export async function getCachedQuestions() {
  const db = await getDB()
  if (!db) return null
  return db.get('questions', 'cached-questions')
}

// ─── Flashcard Hub ────────────────────────────────────────────────────────────
export async function cacheFlashcards(flashcardsData: any) {
  const db = await getDB()
  if (!db) return
  await db.put('flashcards', flashcardsData, 'cached-flashcards')
}

export async function getCachedFlashcards() {
  const db = await getDB()
  if (!db) return null
  return db.get('flashcards', 'cached-flashcards')
}

// ─── Study Planner ────────────────────────────────────────────────────────────
export async function cachePlanner(plannerData: any) {
  const db = await getDB()
  if (!db) return
  await db.put('planner', plannerData, 'cached-planner')
}

export async function getCachedPlanner() {
  const db = await getDB()
  if (!db) return null
  return db.get('planner', 'cached-planner')
}

// ─── Offline Progress Sync Queue ──────────────────────────────────────────────
export interface ProgressSyncItem {
  key?: number
  type: 'cbt' | 'flashcard' | 'planner'
  data: any
  timestamp: number
}

export async function addProgressItem(type: 'cbt' | 'flashcard' | 'planner', data: any) {
  const db = await getDB()
  if (!db) return
  const item: ProgressSyncItem = {
    type,
    data,
    timestamp: Date.now()
  }
  await db.put('progress', item)
}

export async function getProgressQueue(): Promise<ProgressSyncItem[]> {
  const db = await getDB()
  if (!db) return []
  const tx = db.transaction('progress', 'readonly')
  const store = tx.objectStore('progress')
  const keys = await store.getAllKeys()
  const values = await store.getAll()
  return keys.map((key, index) => ({
    key: key as number,
    ...values[index]
  }))
}

export async function removeProgressItem(key: number) {
  const db = await getDB()
  if (!db) return
  await db.delete('progress', key)
}

// ─── Storage Metrics ──────────────────────────────────────────────────────────
export async function getOfflineStorageUsage(): Promise<{ bytes: number; formatted: string }> {
  if (typeof window === 'undefined') return { bytes: 0, formatted: '0 B' }
  
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate()
      const usage = estimate.usage || 0
      
      // Return formatted
      if (usage < 1024) return { bytes: usage, formatted: `${usage} B` }
      if (usage < 1024 * 1024) return { bytes: usage, formatted: `${(usage / 1024).toFixed(1)} KB` }
      return { bytes: usage, formatted: `${(usage / (1024 * 1024)).toFixed(1)} MB` }
    }
  } catch (err) {
    console.error('Failed to estimate storage usage:', err)
  }
  
  return { bytes: 0, formatted: 'Unknown' }
}

export async function getOfflineItemsSummary() {
  const db = await getDB()
  if (!db) return { questionsCount: 0, flashcardsCount: 0, plannerTasksCount: 0, pendingSyncCount: 0 }
  
  try {
    const qData = await db.get('questions', 'cached-questions')
    const fData = await db.get('flashcards', 'cached-flashcards')
    const pData = await db.get('planner', 'cached-planner')
    const syncQueue = await getProgressQueue()
    
    return {
      questionsCount: qData?.questions?.length || 0,
      flashcardsCount: fData?.flashCards?.length || 0,
      plannerTasksCount: pData?.tasks?.length || 0,
      pendingSyncCount: syncQueue.length
    }
  } catch (err) {
    console.error('Failed to get offline items summary:', err)
    return { questionsCount: 0, flashcardsCount: 0, plannerTasksCount: 0, pendingSyncCount: 0 }
  }
}

export async function clearAllOfflineData() {
  const db = await getDB()
  if (!db) return
  const tx = db.transaction(['questions', 'flashcards', 'planner', 'progress'], 'readwrite')
  await tx.objectStore('questions').clear()
  await tx.objectStore('flashcards').clear()
  await tx.objectStore('planner').clear()
  await tx.objectStore('progress').clear()
  await tx.done
}
