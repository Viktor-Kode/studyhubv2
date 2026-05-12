'use client'

import { useState, useEffect } from 'react'
import { 
  FiTarget, FiBook, FiClock, FiCheckCircle, FiCalendar, 
  FiArrowRight, FiChevronLeft, FiPlus, FiRotateCcw, FiZap, FiStar
} from 'react-icons/fi'
import { studyPlanApi } from '@/lib/api/studyPlanApi'
import './planner.css'

const EXAMS = ['JAMB', 'WAEC', 'NECO', 'Post-UTME', 'University Exam']
const SUBJECTS = [
  'Mathematics', 'English Language', 'Physics', 'Chemistry', 
  'Biology', 'Economics', 'Government', 'Literature', 
  'CRS', 'Financial Accounting', 'Commerce', 'Geography'
]
const GOALS = ['Improve grades', 'Stay consistent', 'Prepare for tests']

export default function StudyPlanner() {
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<any>(null)
  const [step, setStep] = useState(0) // 0: Select Mode, 1: Form, 2: Generated Plan
  const [planType, setPlanType] = useState<'exam' | 'general' | null>(null)
  
  // Form State
  const [formData, setFormData] = useState({
    examName: '',
    examDate: '',
    subjects: [] as string[],
    weakSubjects: [] as string[],
    hoursPerDay: 2,
    subject: '',
    goal: ''
  })

  useEffect(() => {
    fetchPlan()
  }, [])

  const fetchPlan = async () => {
    try {
      setLoading(true)
      const res = await studyPlanApi.getActivePlan()
      if (res.data.success && res.data.plan) {
        setPlan(res.data.plan)
        setStep(2)
      } else {
        setStep(0)
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
      const payload = planType === 'exam' ? {
        planType: 'exam',
        examDetails: {
          examName: formData.examName,
          examDate: formData.examDate,
          subjects: formData.subjects,
          weakSubjects: formData.weakSubjects,
          hoursPerDay: formData.hoursPerDay
        }
      } : {
        planType: 'general',
        generalDetails: {
          subject: formData.subject,
          hoursPerDay: formData.hoursPerDay,
          goal: formData.goal
        }
      }

      const res = await studyPlanApi.createPlan(payload as any)
      if (res.data.success) {
        setPlan(res.data.plan)
        setStep(2)
      }
    } catch (err) {
      console.error('Create plan error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    try {
      const res = await studyPlanApi.updateTaskStatus(taskId, !currentStatus)
      if (res.data.success) {
        setPlan(res.data.plan)
      }
    } catch (err) {
      console.error('Toggle task error:', err)
    }
  }

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset your plan? All progress will be lost.')) return
    try {
      setLoading(true)
      await studyPlanApi.resetPlan()
      setPlan(null)
      setStep(0)
      setPlanType(null)
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

  // Step 0: Mode Selection
  if (step === 0) {
    return (
      <div className="planner-container fade-in">
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
    return (
      <div className="planner-container fade-in max-w-2xl mx-auto">
        <button 
          onClick={() => setStep(0)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <FiChevronLeft /> Back to selection
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
                    onChange={(e) => setFormData({...formData, examName: e.target.value})}
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
                  <label className="label">Select your subjects</label>
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
                </div>

                {formData.subjects.length > 0 && (
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
        <div className="lg:col-span-2 v3-card flex items-center justify-between overflow-hidden relative">
          <div className="relative z-10">
            <h2 className="text-xl font-bold mb-1">Weekly Progress</h2>
            <p className="text-gray-400 text-sm mb-4">{completedToday}/{todayTasks.length} tasks done today — {progressPercent}%</p>
            <div className="h-2 w-64 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <div className="relative z-10 text-right">
             <div className="flex items-center gap-2 bg-orange-500/10 text-orange-400 px-4 py-2 rounded-xl border border-orange-500/20">
                <FiZap className="text-xl" />
                <div>
                   <p className="text-[10px] uppercase font-black">Streak</p>
                   <p className="text-lg font-bold leading-none">{plan.streak} Days</p>
                </div>
             </div>
          </div>
          {/* Background decoration */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="v3-card flex flex-col justify-center items-center text-center">
           <button 
             onClick={handleReset}
             className="text-gray-500 hover:text-red-400 transition-colors flex items-center gap-2 text-sm font-medium"
           >
             <FiRotateCcw /> Reset Plan
           </button>
           <p className="text-[10px] text-gray-500 mt-2">Active since {new Date(plan.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Daily Tasks */}
      <div className="mb-10">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <FiStar className="text-yellow-500" /> Today's Focus
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {todayTasks.length > 0 ? todayTasks.map((task: any) => (
            <div 
              key={task._id} 
              className={`task-card ${task.completed ? 'completed' : ''}`}
              onClick={() => handleToggleTask(task._id, task.completed)}
            >
              <div className="flex items-center gap-4">
                <div className={`task-check ${task.completed ? 'bg-green-500 text-white' : 'border-2 border-gray-700'}`}>
                  {task.completed && <FiCheckCircle />}
                </div>
                <div>
                  <p className={`font-bold ${task.completed ? 'text-gray-500 line-through' : ''}`}>{task.title}</p>
                  <a 
                    href={task.link} 
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-blue-400 hover:underline flex items-center gap-1 mt-1"
                  >
                    Open Tool <FiArrowRight className="text-[10px]" />
                  </a>
                </div>
              </div>
            </div>
          )) : (
            <div className="md:col-span-2 v3-card py-10 text-center opacity-60 italic">
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
