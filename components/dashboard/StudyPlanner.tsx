'use client'

import { useState, useEffect } from 'react'
import { 
  FiTarget, FiBook, FiClock, FiCheckCircle, FiCalendar, 
  FiArrowRight, FiChevronLeft, FiPlus, FiRotateCcw, FiZap, FiStar,
  FiDownload, FiWifi, FiWifiOff, FiLoader
} from 'react-icons/fi'
import { studyPlanApi } from '@/lib/api/studyPlanApi'
import {
  cachePlanner,
  getCachedPlanner,
  addProgressItem
} from '@/lib/utils/offlineDb'
import { useAuthStore } from '@/lib/store/authStore'
import { useUpgrade } from '@/context/UpgradeContext'
import './planner.css'

const EXAMS = ['JAMB', 'WAEC', 'NECO', 'Post-UTME', 'University Exam']
const SUBJECTS = [
  'Mathematics', 'English Language', 'Physics', 'Chemistry', 
  'Biology', 'Economics', 'Government', 'Literature', 
  'CRS', 'Financial Accounting', 'Commerce', 'Geography'
]
const UNI_COURSES = ['Anatomy', 'Biochemistry', 'Economics', 'Law', 'Engineering Math', 'Statistics', 'Literature', 'Computer Science', 'Business Admin']
const GOALS = ['Improve grades', 'Stay consistent', 'Prepare for tests']
const CHALLENGES = [
  { id: 'procrastination', label: '😴 I keep procrastinating', icon: '😴' },
  { id: 'distraction', label: '📱 I get distracted easily', icon: '📱' },
  { id: 'no_plan', label: "📋 I don't know what to study", icon: '📋' },
  { id: 'no_time', label: "⏰ I don't have enough time", icon: '⏰' },
  { id: 'exam_anxiety', label: "😰 I have an exam coming up and I'm not ready", icon: '😰' }
]

export default function StudyPlanner() {
  const { user } = useAuthStore()
  const { showUpgrade } = useUpgrade()
  const isPro = user?.plan?.type && user.plan.type !== 'free'

  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<any>(null)
  const [step, setStep] = useState(-1) // -1: Diagnosis, 0: Select Mode, 1: Form, 2: Generated Plan
  const [planType, setPlanType] = useState<'exam' | 'general' | null>(null)
  const [studyChallenges, setStudyChallenges] = useState<string[]>([])

  // Offline state
  const [isOffline, setIsOffline] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isOfflineCached, setIsOfflineCached] = useState(false)
  
  // Form State
  const [formData, setFormData] = useState({
    examName: 'University Exam',
    examDate: '',
    subjects: [] as string[],
    weakSubjects: [] as string[],
    hoursPerDay: 2,
    subject: '',
    goal: '',
    customSubject: ''
  })

  useEffect(() => {
    const update = () => setIsOffline(!navigator.onLine)
    setIsOffline(!navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    getCachedPlanner().then(data => {
      if (data?.plan) setIsOfflineCached(true)
    })
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  useEffect(() => {
    fetchPlan()
  }, [])

  const fetchPlan = async () => {
    // ── Offline: load from IndexedDB cache ──────────────────────────────────
    if (!navigator.onLine) {
      try {
        setLoading(true)
        const cached = await getCachedPlanner()
        if (cached?.plan) {
          setPlan(cached.plan)
          setStep(2)
        } else {
          setStep(-1)
        }
      } catch (err) {
        setStep(-1)
      } finally {
        setLoading(false)
      }
      return
    }

    // ── Online: fetch from API then cache ───────────────────────────────────
    try {
      setLoading(true)
      const res = await studyPlanApi.getActivePlan()
      if (res.data.success && res.data.plan) {
        setPlan(res.data.plan)
        setStep(2)
        // Keep local cache up to date
        await cachePlanner({ plan: res.data.plan, cachedAt: Date.now() })
        setIsOfflineCached(true)
      } else {
        setStep(-1)
      }
    } catch (err) {
      console.error('Fetch plan error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePlan = async () => {
    try {
      setLoading(true)
      const payload = {
        planType,
        studyChallenges,
        ...(planType === 'exam' ? {
          examDetails: {
            examName: formData.examName,
            examDate: formData.examDate,
            subjects: formData.subjects,
            weakSubjects: formData.weakSubjects,
            hoursPerDay: formData.hoursPerDay
          }
        } : {
          generalDetails: {
            subject: formData.subject,
            hoursPerDay: formData.hoursPerDay,
            goal: formData.goal
          }
        })
      }

      const res = await studyPlanApi.createPlan(payload as any)
      if (res.data.success) {
        setPlan(res.data.plan)
        setStep(2)
        // Cache the newly created plan for offline access
        await cachePlanner({ plan: res.data.plan, cachedAt: Date.now() })
        setIsOfflineCached(true)
      }
    } catch (err) {
      console.error('Create plan error:', err)
    } finally {
      setLoading(false)
    }
  }

  // ── Download for Offline ─────────────────────────────────────────────────
  const handleDownloadOffline = async () => {
    if (!isPro) {
      showUpgrade('planner')
      return
    }
    if (!plan) return
    setIsDownloading(true)
    try {
      await cachePlanner({ plan, cachedAt: Date.now() })
      setIsOfflineCached(true)
    } catch (err) {
      console.error('Failed to save planner offline:', err)
    } finally {
      setIsDownloading(false)
    }
  }

  // ── Toggle task completion with offline support ──────────────────────────
  const handleToggleTask = async (taskId: string, currentlyCompleted: boolean) => {
    const newCompleted = !currentlyCompleted
    // Optimistically update local state
    setPlan((prev: any) => ({
      ...prev,
      tasks: prev.tasks.map((t: any) =>
        t._id === taskId ? { ...t, completed: newCompleted } : t
      )
    }))

    if (!navigator.onLine) {
      // Stash for sync
      await addProgressItem('planner', { taskId, completed: newCompleted })
      // Also update the local cache so it reflects the change
      const cached = await getCachedPlanner()
      if (cached?.plan) {
        const updatedPlan = {
          ...cached.plan,
          tasks: cached.plan.tasks.map((t: any) =>
            t._id === taskId ? { ...t, completed: newCompleted } : t
          )
        }
        await cachePlanner({ plan: updatedPlan, cachedAt: Date.now() })
      }
      return
    }

    try {
      await studyPlanApi.updateTaskStatus(taskId, newCompleted)
    } catch (err) {
      console.error('Failed to update task:', err)
      // Revert on error
      setPlan((prev: any) => ({
        ...prev,
        tasks: prev.tasks.map((t: any) =>
          t._id === taskId ? { ...t, completed: currentlyCompleted } : t
        )
      }))
    }
  }

  const handleAddCustomSubject = () => {
    if (formData.customSubject && !formData.subjects.includes(formData.customSubject)) {
      setFormData({
        ...formData,
        subjects: [...formData.subjects, formData.customSubject],
        customSubject: ''
      })
    }
  }

  const handleToggleChallenge = (id: string) => {
    if (studyChallenges.includes(id)) {
      setStudyChallenges(studyChallenges.filter(c => c !== id))
    } else {
      setStudyChallenges([...studyChallenges, id])
    }
  }

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset your plan? All progress will be lost.')) return
    try {
      setLoading(true)
      await studyPlanApi.resetPlan()
      setPlan(null)
      setStep(-1)
      setPlanType(null)
      setStudyChallenges([])
    } catch (err) {
      console.error('Reset plan error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  // Step -1: Diagnosis
  if (step === -1) {
    return (
      <div className="planner-container fade-in max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Let's Personalize Your Plan</h1>
          <p className="text-gray-400">What's your biggest study challenge right now? (Select all that apply)</p>
        </div>
        <div className="space-y-4">
          {CHALLENGES.map(c => {
            const isSelected = studyChallenges.includes(c.id)
            return (
              <div 
                key={c.id}
                onClick={() => handleToggleChallenge(c.id)}
                className={`v3-card p-4 flex items-center gap-4 cursor-pointer transition-all group ${
                  isSelected ? 'border-purple-500 bg-purple-500/10' : 'hover:border-purple-500/50 hover:bg-purple-500/5'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform ${
                  isSelected ? 'bg-purple-500 text-white' : 'bg-gray-800'
                }`}>
                  {c.icon}
                </div>
                <p className={`font-medium transition-colors ${isSelected ? 'text-white' : 'text-gray-200 group-hover:text-white'}`}>
                  {c.label}
                </p>
                <div className={`ml-auto w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  isSelected ? 'bg-purple-500 border-purple-500' : 'border-gray-700'
                }`}>
                  {isSelected && <FiCheckCircle className="text-white text-xs" />}
                </div>
              </div>
            )
          })}
        </div>

        <button
          onClick={() => setStep(0)}
          disabled={studyChallenges.length === 0}
          className="w-full mt-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-bold text-white shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Continue <FiArrowRight />
        </button>
      </div>
    )
  }

  // Step 0: Mode Selection
  if (step === 0) {
    return (
      <div className="planner-container fade-in">
        <button 
          onClick={() => setStep(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <FiChevronLeft /> Back
        </button>
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Create Your Study Plan</h1>
          <p className="text-gray-400">Choose a mode that fits your current needs</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div 
            className="mode-card group"
            onClick={() => { setPlanType('exam'); setStep(1); }}
          >
            <div className="mode-icon bg-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
              <FiTarget className="text-4xl" />
            </div>
            <h2 className="text-xl font-bold mb-2">Exam Prep Mode</h2>
            <p className="text-gray-400 text-sm">I have a specific exam coming up (JAMB, WAEC, etc.)</p>
            <div className="mt-6 flex items-center text-blue-400 font-bold gap-2">
              Get Started <FiArrowRight />
            </div>
          </div>

          <div 
            className="mode-card group"
            onClick={() => { setPlanType('general'); setStep(1); }}
          >
            <div className="mode-icon bg-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
              <FiBook className="text-4xl" />
            </div>
            <h2 className="text-xl font-bold mb-2">General Study Mode</h2>
            <p className="text-gray-400 text-sm">I just want to study consistently and improve my grades</p>
            <div className="mt-6 flex items-center text-purple-400 font-bold gap-2">
              Get Started <FiArrowRight />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Step 1: Forms
  if (step === 1) {
    const isUniExam = formData.examName === 'University Exam'

    return (
      <div className="planner-container fade-in max-w-2xl mx-auto">
        <button 
          onClick={() => setStep(0)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <FiChevronLeft /> Back
        </button>

        <div className="v3-card p-8">
          <h2 className="text-2xl font-bold mb-6">
            {planType === 'exam' ? 'Exam Preparation Details' : 'General Study Details'}
          </h2>

          <div className="space-y-6">
            {planType === 'exam' ? (
              <>
                <div className="form-group">
                  <label className="label">Which exam are you preparing for?</label>
                  <select 
                    className="input"
                    value={formData.examName}
                    onChange={(e) => setFormData({...formData, examName: e.target.value, subjects: []})}
                  >
                    <option value="">Select Exam</option>
                    {EXAMS.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Exam Date</label>
                  <input 
                    type="date" 
                    className="input"
                    value={formData.examDate}
                    onChange={(e) => setFormData({...formData, examDate: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="label">
                    {isUniExam ? 'What course or subject is your exam on?' : 'Select your subjects'}
                  </label>
                  
                  {isUniExam ? (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          placeholder="Type course name..."
                          className="input flex-1"
                          value={formData.customSubject}
                          onChange={(e) => setFormData({...formData, customSubject: e.target.value})}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddCustomSubject()}
                        />
                        <button 
                          onClick={handleAddCustomSubject}
                          className="px-4 bg-purple-600 rounded-lg text-white"
                        >
                          <FiPlus />
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {UNI_COURSES.map(course => (
                          <button
                            key={course}
                            onClick={() => {
                              if (!formData.subjects.includes(course)) {
                                setFormData({...formData, subjects: [...formData.subjects, course]})
                              }
                            }}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                              formData.subjects.includes(course)
                              ? 'bg-purple-500 text-white'
                              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                          >
                            {course}
                          </button>
                        ))}
                      </div>

                      {formData.subjects.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4 p-3 bg-white/5 rounded-xl">
                          {formData.subjects.map(sub => (
                            <span key={sub} className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-bold border border-purple-500/30">
                              {sub}
                              <button onClick={() => setFormData({...formData, subjects: formData.subjects.filter(s => s !== sub)})}>
                                <FiPlus className="rotate-45" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {SUBJECTS.map(sub => (
                        <label key={sub} className="flex items-center gap-2 p-2 rounded-lg bg-gray-800/50 cursor-pointer hover:bg-gray-800">
                          <input 
                            type="checkbox"
                            checked={formData.subjects.includes(sub)}
                            onChange={(e) => {
                              if (e.target.checked) setFormData({...formData, subjects: [...formData.subjects, sub]})
                              else setFormData({...formData, subjects: formData.subjects.filter(s => s !== sub)})
                            }}
                          />
                          <span className="text-sm">{sub}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {!isUniExam && formData.subjects.length > 0 && (
                  <div className="form-group">
                    <label className="label">Which of these are your weak subjects?</label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {formData.subjects.map(sub => (
                        <label key={sub} className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 cursor-pointer hover:bg-red-500/20">
                          <input 
                            type="checkbox"
                            checked={formData.weakSubjects.includes(sub)}
                            onChange={(e) => {
                              if (e.target.checked) setFormData({...formData, weakSubjects: [...formData.weakSubjects, sub]})
                              else setFormData({...formData, weakSubjects: formData.weakSubjects.filter(s => s !== sub)})
                            }}
                          />
                          <span className="text-sm">{sub}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="label">What are you studying?</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Computer Science, Medicine..."
                    className="input"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Study Goal</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {GOALS.map(goal => (
                      <button
                        key={goal}
                        onClick={() => setFormData({...formData, goal})}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                          formData.goal === goal 
                          ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30' 
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {goal}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <label className="label">Hours available daily?</label>
              <div className="flex gap-4 mt-2">
                {[1, 2, 3, 4].map(hr => (
                  <button
                    key={hr}
                    onClick={() => setFormData({...formData, hoursPerDay: hr})}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                      formData.hoursPerDay === hr 
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' 
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {hr}{hr === 4 ? 'hr+' : 'hr'}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleCreatePlan}
              disabled={loading || (planType === 'exam' && (!formData.examName || !formData.examDate || formData.subjects.length === 0)) || (planType === 'general' && (!formData.subject || !formData.goal))}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-bold text-white shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              Generate My Plan 🚀
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Step 2: Generated Plan
  const today = new Date().toISOString().split('T')[0]
  const todayTasks = plan.tasks.filter((t: any) => new Date(t.date).toISOString().split('T')[0] === today)
  const completedToday = todayTasks.filter((t: any) => t.completed).length
  const progressPercent = todayTasks.length > 0 ? Math.round((completedToday / todayTasks.length) * 100) : 0

  return (
    <div className="planner-container fade-in">
      {/* Header Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 v3-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 overflow-hidden relative">
          <div className="relative z-10 w-full sm:w-auto">
            <h2 className="text-xl font-bold mb-1">Weekly Progress</h2>
            <p className="text-gray-400 text-sm mb-4">{completedToday}/{todayTasks.length} tasks done today — {progressPercent}%</p>
            <div className="h-2 w-full sm:w-64 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <div className="relative z-10 text-left sm:text-right w-full sm:w-auto flex flex-col sm:items-end gap-3">
             <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-400 px-4 py-2 rounded-xl border border-orange-500/20">
                <FiZap className="text-xl" />
                <div>
                   <p className="text-[10px] uppercase font-black">Streak</p>
                   <p className="text-lg font-bold leading-none">{plan.streak} Days</p>
                </div>
             </div>
             {/* Offline indicator / Download button */}
             {isOffline ? (
               <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                 <FiWifiOff size={10} /> Offline Mode
               </span>
             ) : (
               <button
                 onClick={handleDownloadOffline}
                 disabled={isDownloading}
                 title={isPro ? 'Save plan for offline access' : 'Upgrade to Pro to use offline mode'}
                 className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all ${
                   isOfflineCached
                     ? 'text-green-400 bg-green-500/10 border-green-500/20 hover:bg-green-500/20'
                     : 'text-gray-400 bg-gray-800 border-gray-700 hover:bg-gray-700'
                 }`}
               >
                 {isDownloading
                   ? <FiLoader size={10} className="animate-spin" />
                   : isOfflineCached
                     ? <FiWifi size={10} />
                     : <FiDownload size={10} />}
                 {isDownloading ? 'Saving...' : isOfflineCached ? 'Offline Ready' : 'Save Offline'}
                 {!isPro && <span className="ml-1 bg-amber-400 text-white px-1 py-0.5 rounded text-[8px]">PRO</span>}
               </button>
             )}
          </div>
          {/* Background decoration */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="v3-card flex flex-col justify-center items-center text-center py-6">
           <button 
             onClick={handleReset}
             disabled={isOffline}
             className="text-gray-500 hover:text-red-400 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
           >
             <FiRotateCcw /> Reset Plan
           </button>
           <p className="text-[10px] text-gray-500 mt-2">Active since {new Date(plan.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="mb-10">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <FiStar className="text-yellow-500" /> Today's Focus
        </h3>
        <div className="space-y-4">
          {todayTasks.length > 0 ? todayTasks.map((t: any) => {
            const taskDate = new Date(t.date).toISOString().split('T')[0]
            const isToday = taskDate === new Date().toISOString().split('T')[0]
            
            return (
              <div 
                key={t._id}
                className={`v3-card p-5 flex items-center gap-5 transition-all group ${
                  t.completed ? 'opacity-75 bg-green-500/5' : ''
                }`}
              >
                <button
                  onClick={() => handleToggleTask(t._id, t.completed)}
                  className={`task-check flex items-center justify-center rounded-xl transition-all flex-shrink-0 ${
                    t.completed ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'border-2 border-gray-700 text-gray-500 hover:border-green-500 hover:text-green-500'
                  }`}
                >
                  {t.completed ? <FiCheckCircle className="text-xl" /> : <FiClock className="text-lg opacity-50" />}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    {t.label && (
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
                        {t.label}
                      </span>
                    )}
                    {!t.completed && isToday && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-orange-400 animate-pulse">
                        <FiTarget className="text-[10px]" /> Monitoring...
                      </span>
                    )}
                  </div>
                  <p className={`text-base font-bold ${t.completed ? 'text-gray-500 line-through' : 'text-white'}`}>
                    {t.title}
                  </p>
                  {t.tip && !t.completed && (
                    <p className="text-[11px] text-gray-400 mt-1.5 italic flex items-start gap-1.5 leading-relaxed">
                      <span className="text-blue-400">💡</span> {t.tip}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-3">
                    <a 
                      href={t.link} 
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors"
                    >
                      Open Tool <FiArrowRight className="text-[10px]" />
                    </a>
                  </div>
                </div>
              </div>
            )
          }) : (
            <div className="v3-card py-10 text-center opacity-60 italic">
              No tasks scheduled for today. Take a rest! 😴
            </div>
          )}
        </div>
      </div>

      {/* Weekly Overview */}
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <FiCalendar className="text-blue-400" /> Weekly Schedule
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {[...Array(7)].map((_, i) => {
            const d = new Date()
            d.setDate(d.getDate() + i)
            const dStr = d.toISOString().split('T')[0]
            const dayTasks = plan.tasks.filter((t: any) => new Date(t.date).toISOString().split('T')[0] === dStr)
            const isToday = i === 0

            return (
              <div key={i} className={`min-w-[200px] v3-card ${isToday ? 'border-purple-500/50 bg-purple-500/5' : ''}`}>
                <p className="text-xs font-black text-gray-500 uppercase mb-3">
                  {d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <div className="space-y-3">
                  {dayTasks.map((t: any) => (
                    <div key={t._id} className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${t.completed ? 'bg-green-500' : 'bg-gray-700'}`}></div>
                      <p className={`text-[10px] font-medium truncate ${t.completed ? 'text-gray-600 line-through' : 'text-gray-300'}`}>
                        {t.title}
                      </p>
                    </div>
                  ))}
                  {dayTasks.length === 0 && <p className="text-[10px] text-gray-600 italic">No tasks</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
