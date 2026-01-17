'use client'

import { useState, useEffect } from 'react'
import { FaBell, FaPlus, FaTrash, FaCalendar, FaEdit, FaWhatsapp, FaCheckCircle, FaTimes, FaLink } from 'react-icons/fa'

interface Reminder {
  id: string
  title: string
  date: string
  time: string
  type: 'deadline' | 'study' | 'exam'
  whatsappNumber?: string
  sendWhatsApp?: boolean
  timetableId?: string // Link to timetable item
}

interface StudyRemindersProps {
  className?: string
  reminders?: Reminder[]
  setReminders?: React.Dispatch<React.SetStateAction<Reminder[]>>
}

export default function StudyReminders({ className = '', reminders: externalReminders, setReminders: externalSetReminders }: StudyRemindersProps) {
  const [internalReminders, setInternalReminders] = useState<Reminder[]>([
    {
      id: '1',
      title: 'Math Assignment Due',
      date: '2024-01-15',
      time: '23:59',
      type: 'deadline',
    },
    {
      id: '2',
      title: 'Physics Study Session',
      date: '2024-01-14',
      time: '14:00',
      type: 'study',
    },
  ])

  // Use external reminders if provided, otherwise use internal state
  const reminders = externalReminders || internalReminders
  const setReminders = externalSetReminders || setInternalReminders

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [countryCode, setCountryCode] = useState('+234')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [tempCountryCode, setTempCountryCode] = useState('+234')
  const [tempPhoneNumber, setTempPhoneNumber] = useState('')
  const [isWhatsAppConfirmed, setIsWhatsAppConfirmed] = useState(false)
  const [showWhatsAppEdit, setShowWhatsAppEdit] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmationCode, setConfirmationCode] = useState('')
  const [sendingCode, setSendingCode] = useState(false)
  const [verifyingCode, setVerifyingCode] = useState(false)

  // Common country codes
  const countryCodes = [
    { code: '+234', country: 'Nigeria (NG)' },
    { code: '+1', country: 'USA/Canada' },
    { code: '+44', country: 'UK' },
    { code: '+233', country: 'Ghana (GH)' },
    { code: '+254', country: 'Kenya (KE)' },
    { code: '+27', country: 'South Africa (ZA)' },
    { code: '+255', country: 'Tanzania (TZ)' },
    { code: '+256', country: 'Uganda (UG)' },
  ]
  const [newReminder, setNewReminder] = useState({
    title: '',
    date: '',
    time: '',
    type: 'study' as Reminder['type'],
    whatsappNumber: '',
    sendWhatsApp: false,
  })

  // Parse phone number into country code and number
  const parsePhoneNumber = (fullNumber: string) => {
    if (!fullNumber) return { code: '+234', number: '' }
    
    // Remove all spaces and non-digit characters except +
    const cleaned = fullNumber.replace(/[^\d+]/g, '')
    
    // Try to match known country codes (longest first to avoid partial matches)
    const sortedCodes = [...countryCodes].sort((a, b) => b.code.length - a.code.length)
    
    for (const cc of sortedCodes) {
      const codeWithoutPlus = cc.code.replace('+', '')
      if (cleaned.startsWith(cc.code) || cleaned.startsWith(codeWithoutPlus)) {
        const number = cleaned.substring(cc.code.length).replace(/^0+/, '')
        return { code: cc.code, number }
      }
    }
    
    // If starts with + but no match, extract first 1-3 digits as code
    if (cleaned.startsWith('+')) {
      const match = cleaned.match(/^\+(\d{1,3})(\d+)$/)
      if (match) {
        const code = `+${match[1]}`
        const number = match[2].replace(/^0+/, '')
        return { code, number }
      }
    }
    
    // Default: assume it's just a number, use default country code
    const number = cleaned.replace(/^0+/, '')
    return { code: '+234', number }
  }

  // Combine country code and phone number (simple concatenation)
  const combinePhoneNumber = (code: string, number: string) => {
    // Remove any leading zeros and spaces from the number
    const cleanNumber = number.replace(/^0+/, '').replace(/\s/g, '')
    return `${code}${cleanNumber}`
  }

  // Load WhatsApp number and confirmation status from localStorage
  useEffect(() => {
    const savedWhatsApp = localStorage.getItem('whatsapp-number')
    const savedConfirmation = localStorage.getItem('whatsapp-confirmed')
    
    if (savedWhatsApp) {
      const parsed = parsePhoneNumber(savedWhatsApp)
      setWhatsappNumber(savedWhatsApp)
      setCountryCode(parsed.code)
      setPhoneNumber(parsed.number)
      setNewReminder((prev) => ({ ...prev, whatsappNumber: savedWhatsApp }))
      setIsWhatsAppConfirmed(savedConfirmation === 'true')
    } else {
      // Try to get from auth store (phone number from signup)
      if (typeof window !== 'undefined') {
        const authStorage = localStorage.getItem('auth-storage')
        if (authStorage) {
          try {
            const parsed = JSON.parse(authStorage)
            const userPhone = parsed.state?.user?.phone
            if (userPhone) {
              const phoneParts = parsePhoneNumber(userPhone)
              setWhatsappNumber(userPhone)
              setCountryCode(phoneParts.code)
              setPhoneNumber(phoneParts.number)
              setTempCountryCode(phoneParts.code)
              setTempPhoneNumber(phoneParts.number)
              setNewReminder((prev) => ({ ...prev, whatsappNumber: userPhone }))
            }
          } catch (error) {
            console.error('Error parsing auth storage:', error)
          }
        }
      }
    }
  }, [])

  const addReminder = () => {
    if (newReminder.title && newReminder.date && newReminder.time) {
      if (editingId) {
        // Update existing reminder
        setReminders(
          reminders.map((r) =>
            r.id === editingId
              ? {
                  ...newReminder,
                  id: editingId,
                  whatsappNumber: newReminder.sendWhatsApp ? newReminder.whatsappNumber : undefined,
                }
              : r
          )
        )
        setEditingId(null)
      } else {
        // Add new reminder
        setReminders([
          ...reminders,
          {
            id: Date.now().toString(),
            ...newReminder,
            whatsappNumber: newReminder.sendWhatsApp ? newReminder.whatsappNumber : undefined,
          },
        ])
      }
      setNewReminder({
        title: '',
        date: '',
        time: '',
        type: 'study',
        whatsappNumber: whatsappNumber,
        sendWhatsApp: false,
      })
      setShowAddForm(false)
    }
  }

  const editReminder = (reminder: Reminder) => {
    setNewReminder({
      title: reminder.title,
      date: reminder.date,
      time: reminder.time,
      type: reminder.type,
      whatsappNumber: reminder.whatsappNumber || whatsappNumber,
      sendWhatsApp: !!reminder.whatsappNumber,
    })
    setEditingId(reminder.id)
    setShowAddForm(true)
  }

  const removeReminder = (id: string) => {
    setReminders(reminders.filter((r) => r.id !== id))
  }

  const sendConfirmationCode = async () => {
    const fullNumber = combinePhoneNumber(tempCountryCode, tempPhoneNumber)
    
    if (!tempPhoneNumber || tempPhoneNumber.length < 8) {
      alert('Please enter a valid phone number')
      return
    }

    setSendingCode(true)
    try {
      // Simulate API call to send confirmation code
      // In production, this would call: await apiClient.post('/reminders/send-whatsapp-code', { phone: fullNumber })
      await new Promise((resolve) => setTimeout(resolve, 1500))
      
      setShowConfirmation(true)
      setSendingCode(false)
      alert(`Confirmation code sent to ${fullNumber}. In production, this would be sent via WhatsApp.`)
    } catch (error) {
      setSendingCode(false)
      alert('Failed to send confirmation code. Please try again.')
    }
  }

  const verifyConfirmationCode = async () => {
    if (!confirmationCode || confirmationCode.length !== 6) {
      alert('Please enter a valid 6-digit confirmation code')
      return
    }

    const fullNumber = combinePhoneNumber(tempCountryCode, tempPhoneNumber)

    setVerifyingCode(true)
    try {
      // Simulate API call to verify confirmation code
      // In production, this would call: await apiClient.post('/reminders/verify-whatsapp-code', { phone: fullNumber, code: confirmationCode })
      await new Promise((resolve) => setTimeout(resolve, 1500))
      
      // For demo purposes, accept any 6-digit code. In production, verify with backend
      localStorage.setItem('whatsapp-number', fullNumber)
      localStorage.setItem('whatsapp-confirmed', 'true')
      setWhatsappNumber(fullNumber)
      setCountryCode(tempCountryCode)
      setPhoneNumber(tempPhoneNumber)
      setIsWhatsAppConfirmed(true)
      setShowConfirmation(false)
      setConfirmationCode('')
      setShowWhatsAppEdit(false)
      setNewReminder((prev) => ({ ...prev, whatsappNumber: fullNumber }))
      alert('WhatsApp number confirmed successfully!')
    } catch (error) {
      setVerifyingCode(false)
      alert('Invalid confirmation code. Please try again.')
    }
  }

  const resetConfirmation = () => {
    setShowConfirmation(false)
    setConfirmationCode('')
    if (whatsappNumber) {
      const parsed = parsePhoneNumber(whatsappNumber)
      setTempCountryCode(parsed.code)
      setTempPhoneNumber(parsed.number)
    } else {
      setTempCountryCode('+234')
      setTempPhoneNumber('')
    }
  }

  const getTypeColor = (type: Reminder['type']) => {
    switch (type) {
      case 'deadline':
        return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
      case 'exam':
        return 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800'
      default:
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FaBell className="text-purple-500 text-xl" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Study Reminders</h3>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-2 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
        >
          <FaPlus />
        </button>
      </div>

      {/* WhatsApp Number Setup - Step 1: Enter Number */}
      {(!whatsappNumber || showWhatsAppEdit) && !showConfirmation && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FaWhatsapp className="text-green-500" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                {whatsappNumber ? 'Update' : 'Add'} WhatsApp Number for Reminders
              </h4>
            </div>
            {whatsappNumber && !showWhatsAppEdit && (
              <button
                onClick={() => setShowWhatsAppEdit(false)}
                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <FaTimes />
              </button>
            )}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Get reminders sent directly to your WhatsApp. You'll need to confirm your number.
          </p>
          <div className="flex gap-2">
            <select
              value={tempCountryCode || countryCode}
              onChange={(e) => {
                setTempCountryCode(e.target.value)
                if (!showWhatsAppEdit) {
                  setCountryCode(e.target.value)
                }
              }}
              disabled={sendingCode}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 disabled:opacity-50"
            >
              {countryCodes.map((cc) => (
                <option key={cc.code} value={cc.code}>
                  {cc.code} {cc.country}
                </option>
              ))}
            </select>
            <input
              type="tel"
              placeholder="911 915 438 720"
              value={tempPhoneNumber || phoneNumber}
              onChange={(e) => {
                // Only allow digits, remove everything else
                const value = e.target.value.replace(/\D/g, '')
                setTempPhoneNumber(value)
                if (!showWhatsAppEdit) {
                  setPhoneNumber(value)
                }
              }}
              disabled={sendingCode}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 disabled:opacity-50"
            />
            <button
              onClick={sendConfirmationCode}
              disabled={sendingCode || !tempPhoneNumber || tempPhoneNumber.length < 8}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingCode ? 'Sending...' : 'Send Code'}
            </button>
          </div>
          {whatsappNumber && !showWhatsAppEdit && (
            <button
              onClick={() => {
                setShowWhatsAppEdit(false)
                resetConfirmation()
              }}
              className="mt-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {/* WhatsApp Confirmation - Step 2: Verify Code */}
      {showConfirmation && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FaWhatsapp className="text-blue-500" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Confirm WhatsApp Number
              </h4>
            </div>
            <button
              onClick={resetConfirmation}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <FaTimes />
            </button>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Enter the 6-digit code sent to <strong>{combinePhoneNumber(tempCountryCode, tempPhoneNumber)}</strong>
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="000000"
              value={confirmationCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                setConfirmationCode(value)
              }}
              maxLength={6}
              disabled={verifyingCode}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 text-center text-lg tracking-widest disabled:opacity-50"
            />
            <button
              onClick={verifyConfirmationCode}
              disabled={verifyingCode || confirmationCode.length !== 6}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifyingCode ? 'Verifying...' : 'Verify'}
            </button>
          </div>
          <button
            onClick={sendConfirmationCode}
            disabled={sendingCode}
            className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
          >
            Resend code
          </button>
        </div>
      )}

      {/* Show WhatsApp Number if confirmed */}
      {whatsappNumber && isWhatsAppConfirmed && !showWhatsAppEdit && !showConfirmation && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaCheckCircle className="text-green-500" />
            <div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                WhatsApp: {whatsappNumber}
              </span>
              <span className="ml-2 text-xs text-green-600 dark:text-green-400">(Confirmed)</span>
            </div>
          </div>
          <button
            onClick={() => {
              setShowWhatsAppEdit(true)
              setTempCountryCode(countryCode)
              setTempPhoneNumber(phoneNumber)
            }}
            className="text-xs text-green-600 dark:text-green-400 hover:underline"
          >
            Edit
          </button>
        </div>
      )}

      {/* Show unconfirmed WhatsApp Number */}
      {whatsappNumber && !isWhatsAppConfirmed && !showWhatsAppEdit && !showConfirmation && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaWhatsapp className="text-yellow-600" />
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  WhatsApp: {whatsappNumber}
                </span>
                <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">(Not confirmed)</span>
              </div>
            </div>
            <button
              onClick={() => {
                setShowWhatsAppEdit(true)
                setTempCountryCode(countryCode)
                setTempPhoneNumber(phoneNumber)
              }}
              className="text-xs text-yellow-600 dark:text-yellow-400 hover:underline"
            >
              Confirm Now
            </button>
          </div>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
            Please confirm your WhatsApp number to receive reminders
          </p>
        </div>
      )}

      {showAddForm && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
          <input
            type="text"
            placeholder="Reminder title"
            value={newReminder.title}
            onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={newReminder.date}
              onChange={(e) => setNewReminder({ ...newReminder, date: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700"
            />
            <input
              type="time"
              value={newReminder.time}
              onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700"
            />
          </div>
          <select
            value={newReminder.type}
            onChange={(e) => setNewReminder({ ...newReminder, type: e.target.value as Reminder['type'] })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700"
          >
            <option value="study">Study Session</option>
            <option value="deadline">Deadline</option>
            <option value="exam">Exam</option>
          </select>

          {/* WhatsApp Reminder Option */}
          {whatsappNumber && isWhatsAppConfirmed && (
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <input
                type="checkbox"
                id="send-whatsapp"
                checked={newReminder.sendWhatsApp}
                onChange={(e) =>
                  setNewReminder({
                    ...newReminder,
                    sendWhatsApp: e.target.checked,
                    whatsappNumber: e.target.checked ? whatsappNumber : '',
                  })
                }
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="send-whatsapp" className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <FaWhatsapp className="text-green-500" />
                <span>Send reminder via WhatsApp to {whatsappNumber}</span>
              </label>
            </div>
          )}

          {whatsappNumber && !isWhatsAppConfirmed && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-xs text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                <FaWhatsapp className="text-yellow-600" />
                <span>Please confirm your WhatsApp number above to receive reminders</span>
              </p>
            </div>
          )}

          {!whatsappNumber && (
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Add and confirm your WhatsApp number above to receive reminders
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={addReminder}
              className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
            >
              {editingId ? 'Update Reminder' : 'Add Reminder'}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false)
                setEditingId(null)
                setNewReminder({
                  title: '',
                  date: '',
                  time: '',
                  type: 'study',
                  whatsappNumber: whatsappNumber,
                  sendWhatsApp: false,
                })
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Info about timetable integration */}
      {reminders.some((r) => r.timetableId) && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-400 flex items-center gap-2">
            <FaLink className="text-xs" />
            <span>Reminders from your timetable are automatically created and synced. Edit them from the Timetable tab.</span>
          </p>
        </div>
      )}

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {reminders.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FaCalendar className="mx-auto mb-2 text-3xl" />
            <p>No reminders yet</p>
            <p className="text-xs mt-2">Add items to your timetable or create reminders manually</p>
          </div>
        ) : (
          reminders.map((reminder) => {
            const isFromTimetable = !!reminder.timetableId
            return (
              <div
                key={reminder.id}
                className={`p-3 rounded-lg border ${getTypeColor(reminder.type)} flex items-center justify-between ${
                  isFromTimetable ? 'opacity-90' : ''
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-medium">{reminder.title}</div>
                    {isFromTimetable && (
                      <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                        <FaLink className="text-xs" />
                        From Timetable
                      </span>
                    )}
                  </div>
                  <div className="text-xs opacity-80 mb-1">
                    {formatDate(reminder.date)} at {reminder.time}
                  </div>
                  {reminder.whatsappNumber && (
                    <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <FaWhatsapp />
                      <span>WhatsApp: {reminder.whatsappNumber}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {!isFromTimetable && (
                    <>
                      <button
                        onClick={() => editReminder(reminder)}
                        className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded"
                        title="Edit reminder"
                      >
                        <FaEdit className="text-xs" />
                      </button>
                      <button
                        onClick={() => removeReminder(reminder.id)}
                        className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded"
                        title="Delete reminder"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </>
                  )}
                  {isFromTimetable && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                      Edit from Timetable
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
