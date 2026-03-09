'use client'

import { Check, X, Zap } from 'lucide-react'
import Link from 'next/link'
import { PLANS } from '@/lib/config/plans'

export default function PricingSection() {
  return (
    <section className="pricing-section" id="pricing">
      <div className="pricing-container">
        <div className="section-label">Pricing</div>
        <h2 className="section-title">Simple, Affordable Plans</h2>
        <p className="section-sub">
          Built for Nigerian students. No hidden fees. Cancel anytime.
        </p>

        <div className="pricing-cards">
          {/* Free Plan */}
          <div className="pricing-card free">
            <div className="plan-header">
              <span className="plan-name">{PLANS.free.name}</span>
              <div className="plan-price">
                <span className="price-amount">₦0</span>
                <span className="price-period">forever</span>
              </div>
              <p className="plan-tagline">Get started with no commitment</p>
            </div>

            <ul className="feature-list">
              {PLANS.free.features.map((f) => (
                <li key={f} className="feature-item included">
                  <Check size={15} className="feature-check" />
                  {f}
                </li>
              ))}
              {PLANS.free.notIncluded.map((f) => (
                <li key={f} className="feature-item excluded">
                  <X size={15} className="feature-x" />
                  {f}
                </li>
              ))}
            </ul>

            <Link href="/auth/signup" className="plan-btn free-btn">
              Get Started Free
            </Link>
          </div>

          {/* Weekly Plan */}
          <div className="pricing-card weekly">
            <div className="plan-header">
              <span className="plan-name">{PLANS.weekly.name}</span>
              <div className="plan-price">
                <span className="price-amount">₦600</span>
                <span className="price-period">/ week</span>
              </div>
              <p className="plan-tagline">Perfect for exam season</p>
            </div>

            <ul className="feature-list">
              {PLANS.weekly.features.map((f) => (
                <li key={f} className="feature-item included">
                  <Check size={15} className="feature-check" />
                  {f}
                </li>
              ))}
            </ul>

            <Link href="/auth/signup" className="plan-btn weekly-btn">
              Start Weekly Plan
            </Link>
          </div>

          {/* Monthly Plan — highlighted */}
          <div className="pricing-card monthly popular">
            <div className="popular-badge">
              ⭐ {PLANS.monthly.badge}
            </div>
            <div className="plan-header">
              <span className="plan-name">{PLANS.monthly.name}</span>
              <div className="plan-price">
                <span className="price-amount">₦2,300</span>
                <span className="price-period">/ month</span>
              </div>
              <p className="plan-savings">{PLANS.monthly.savings}</p>
            </div>

            <ul className="feature-list">
              {PLANS.monthly.features.map((f) => (
                <li key={f} className="feature-item included">
                  <Check size={15} className="feature-check" />
                  {f}
                </li>
              ))}
            </ul>

            <Link href="/auth/signup" className="plan-btn monthly-btn">
              Start Monthly Plan
            </Link>
          </div>
        </div>

        {/* Add-on */}
        <div className="addon-card">
          <div className="addon-left">
            <Zap size={20} className="addon-icon" />
            <div>
              <span className="addon-title">Need more AI questions?</span>
              <span className="addon-desc">
                Top up anytime — 100 extra AI questions for ₦500. Added instantly
                to your plan.
              </span>
            </div>
          </div>
          <Link href="/auth/signup" className="addon-btn">
            Get Add-on
          </Link>
        </div>

        {/* Reassurance */}
        <div className="pricing-footer">
          <span>✅ Pay with card, bank transfer or USSD</span>
          <span>✅ Instant activation</span>
          <span>✅ No auto-renewal</span>
        </div>
      </div>
    </section>
  )
}
