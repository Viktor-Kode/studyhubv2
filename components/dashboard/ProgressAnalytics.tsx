'use client'

import { FaChartBar, FaBook, FaCheckCircle, FaClock } from 'react-icons/fa'

interface ProgressAnalyticsProps {
  className?: string
}

export default function ProgressAnalytics({ className = '' }: ProgressAnalyticsProps) {
  const stats = [
    { label: 'Questions Completed', value: 45, total: 60, icon: FaCheckCircle, color: 'emerald' },
    { label: 'Study Hours', value: 32, total: 40, icon: FaClock, color: 'blue' },
    { label: 'Courses Tracked', value: 5, total: 6, icon: FaBook, color: 'purple' },
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      emerald: 'bg-emerald-500 text-emerald-500',
      blue: 'bg-blue-500 text-blue-500',
      purple: 'bg-purple-500 text-purple-500',
    }
    return colors[color as keyof typeof colors] || colors.emerald
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <FaChartBar className="text-emerald-500 text-xl" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Progress Analytics</h3>
      </div>

      <div className="space-y-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          const percentage = (stat.value / stat.total) * 100
          const colorClasses = getColorClasses(stat.color).split(' ')
          
          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`${colorClasses[1]} text-lg`} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stat.label}</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {stat.value} / {stat.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`${colorClasses[0]} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {percentage.toFixed(0)}% complete
              </div>
            </div>
          )
        })}
      </div>

      {/* Overall Progress */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-3xl font-bold text-emerald-500 mb-1">75%</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Overall Progress</div>
        </div>
      </div>
    </div>
  )
}
