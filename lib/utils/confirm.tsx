'use client'

import toast from 'react-hot-toast'
import { FiAlertTriangle } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * A modern replacement for window.confirm() using react-hot-toast and Framer Motion.
 * Returns a promise that resolves to true if confirmed, false otherwise.
 */
export const confirmToast = (
  message: string,
  options: {
    title?: string
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'info'
  } = {}
): Promise<boolean> => {
  const {
    title = 'Are you sure?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
  } = options

  return new Promise((resolve) => {
    toast.custom(
      (t) => (
        <AnimatePresence>
          {t.visible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="max-w-sm w-full bg-white dark:bg-slate-900 shadow-2xl rounded-2xl pointer-events-auto flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="p-5 flex items-start gap-4">
                <div className={`p-3 rounded-2xl shrink-0 ${variant === 'danger' ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'}`}>
                  <FiAlertTriangle size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">{title}</h4>
                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {message}
                  </p>
                </div>
              </div>
              <div className="flex border-t border-slate-100 dark:border-slate-800 divide-x divide-slate-100 dark:divide-slate-800">
                <button
                  onClick={() => {
                    toast.dismiss(t.id)
                    resolve(false)
                  }}
                  className="flex-1 px-4 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors outline-none"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    toast.dismiss(t.id)
                    resolve(true)
                  }}
                  className={`flex-1 px-4 py-4 text-sm font-bold transition-colors outline-none ${
                    variant === 'danger'
                      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50'
                      : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50'
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      ),
      { duration: Infinity, position: 'top-center' }
    )
  })
}
