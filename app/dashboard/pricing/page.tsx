'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { paymentApi } from '@/lib/api/paymentApi'
import ProtectedRoute from '@/components/ProtectedRoute'
import { FiArrowRight, FiCheck, FiClock, FiLoader, FiZap } from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import { PLANS } from '@/lib/config/plans'
import './pricing.css'

type PlanCard = {
  key: string
  name: string
  price: number
  period: string
  description: string
  features: string[]
  badge?: string
}

export default function PricingPage() {
  const searchParams = useSearchParams()
  const isTeacherFlow = searchParams?.get('from') === 'teacher'
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [status, setStatus] = useState<any | null>(null)

  useEffect(() => {
    let cancelled = false
    paymentApi.getStatus()
      .then((data) => { if (!cancelled && data?.success) setStatus(data) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const handleSubscribe = async (planType: string) => {
    if (planType === 'free') return
    try {
      window.localStorage.setItem('studyhelp_selected_plan', planType)
      setLoadingPlan(planType)
      const data = await paymentApi.initializePayment(planType)
      if (data?.authorizationUrl) {
        window.location.href = data.authorizationUrl
      } else {
        toast.error('Could not start payment. Please try again.')
      }
    } catch (err) {
      console.error('Payment error:', err)
      toast.error('Payment failed. Please try again.')
    } finally {
      setLoadingPlan(null)
    }
  }

  const plans: PlanCard[] = isTeacherFlow
    ? [
        {
          key: 'free', name: 'Free Trial', price: 0, period: 'forever',
          description: 'Try the teacher tools.',
          features: ['3 free runs per tool', 'Export to PDF and Word', 'Access teacher tools'],
        },
        {
          key: 'weekly', name: 'Teacher Basic', price: 700, period: 'week',
          description: 'Short-term lesson prep.',
          features: ['Unlimited lesson notes', 'Schemes and result tools', 'Save and export content'],
        },
        {
          key: 'monthly', name: 'Teacher Premium', price: 1500, period: 'month',
          description: 'Full access for the term.', badge: 'Most popular',
          features: ['All teacher tools', 'Unlimited downloads', 'Priority generation'],
        },
      ]
    : [
        {
          key: 'free', name: 'Free', price: 0, period: 'forever',
          description: 'Start studying for free.',
          features: ['3 practice sessions', 'Study timer', 'Basic progress view'],
        },
        {
          key: 'weekly', name: 'Weekly', price: PLANS.weekly.price, period: 'week',
          description: 'A focused week of revision.',
          features: ['Unlimited CBT practice', 'AI tutor and explanations', 'All exam types'],
        },
        {
          key: 'monthly', name: 'Monthly', price: PLANS.monthly.price, period: 'month',
          description: 'Full access to every study tool.', badge: 'Most popular',
          features: ['Unlimited CBT and AI tutor', 'All exam types', 'Notes and progress tracking'],
        },
        {
          key: 'yearly', name: 'Yearly', price: PLANS.yearly.price, period: 'year',
          description: 'Best value for the whole year.', badge: 'Save 30%',
          features: ['Everything in Monthly', '12 months of access', 'Lowest price per month'],
        },
      ]

  const currentPlan = String(status?.subscription?.plan || 'free').toLowerCase()

  return (
    <ProtectedRoute>
      <main className="pricing-page min-h-screen px-4 pt-0 pb-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <header className="pricing-header">
            <span className="pricing-eyebrow"><FiZap /> {isTeacherFlow ? 'Teacher plans' : 'StudyHelp plans'}</span>
            <h1>Simple plans. Better progress.</h1>
            <p>Choose the access that works for you. No recurring charges.</p>
          </header>

          {status?.subscription && (
            <div className="pricing-current">
              <div>
                <span className="pricing-current-label">Your current plan</span>
                <strong>{status.subscription.plan || 'Free'}</strong>
              </div>
              {currentPlan !== 'free' && (
                <span className="pricing-time"><FiClock /> {status.subscription.daysLeft ?? 0} days left</span>
              )}
            </div>
          )}

          <section className={`pricing-grid ${isTeacherFlow ? 'pricing-grid-teacher' : ''}`} aria-label="Available plans">
            {plans.map((plan) => {
              const isCurrent = currentPlan === plan.key
              const isLoading = loadingPlan === plan.key
              const isFeatured = plan.key === 'monthly' && !isTeacherFlow

              return (
                <article className={`pricing-card ${isFeatured ? 'featured' : ''}`} key={plan.key}>
                  <div className="pricing-card-top">
                    <div>
                      {plan.badge && <span className="pricing-badge">{plan.badge}</span>}
                      <h2>{plan.name}</h2>
                    </div>
                    {isFeatured && <span className="pricing-zap"><FiZap /></span>}
                  </div>

                  <p className="pricing-description">{plan.description}</p>

                  <div className="pricing-price">
                    <strong>{plan.price === 0 ? 'Free' : `₦${plan.price.toLocaleString()}`}</strong>
                    {plan.price > 0 && <span>/{plan.period}</span>}
                  </div>

                  <ul className="pricing-features">
                    {plan.features.map((feature) => (
                      <li key={feature}><FiCheck /> <span>{feature}</span></li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <button type="button" className="pricing-cta current" disabled>Current plan</button>
                  ) : plan.key === 'free' ? (
                    <Link href="/dashboard/student" className="pricing-cta secondary">Back to dashboard</Link>
                  ) : (
                    <button
                      type="button"
                      className={`pricing-cta ${isFeatured ? 'primary' : 'secondary'}`}
                      onClick={() => handleSubscribe(plan.key)}
                      disabled={isLoading}
                    >
                      {isLoading ? <FiLoader className="animate-spin" /> : <>Choose {plan.name}<FiArrowRight /></>}
                    </button>
                  )}
                </article>
              )
            })}
          </section>

          <p className="pricing-footnote">Secure checkout. Your plan won’t renew automatically.</p>
        </div>
      </main>
    </ProtectedRoute>
  )
}
