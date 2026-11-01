'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Script from 'next/script'
import { Download, Menu, X } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import { usePWA } from '@/hooks/usePWA'
import { useAuthStore } from '@/lib/store/authStore'
import '@/styles/landing.css'

export default function Home() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const { isInstallable, installApp } = usePWA()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return

    if (user.role === 'admin') {
      router.replace('/dashboard/admin')
      return
    }
    router.replace('/dashboard/student')
  }, [isLoading, isAuthenticated, user, router])

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 800) {
        setMobileMenuOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  if (isLoading) return null
  if (isAuthenticated && user) return null

  return (
    <div className="studyhelp-landing">
      {/* Schema.org Structured Data for SEO */}
      <Script
        id="home-jsonld"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'StudyHelp',
              url: 'https://www.studyhelp.site',
              logo: 'https://www.studyhelp.site/logo.png',
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+234-916-334-5794',
                contactType: 'customer support',
                areaServed: 'NG',
                availableLanguage: 'English',
              },
              sameAs: ['https://twitter.com/StudyHelpAI'],
            },
            {
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'StudyHelp',
              url: 'https://www.studyhelp.site',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://www.studyhelp.site/?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            },
            {
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'StudyHelp',
              operatingSystem: 'Web, Android, iOS',
              applicationCategory: 'EducationApplication',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'NGN',
              },
              description:
                'AI-powered CBT practice platform for Nigerian university students. Turn lecturer notes into practice questions for JAMB, WAEC, NECO, and Post-UTME.',
              url: 'https://www.studyhelp.site',
            },
            {
              '@context': 'https://schema.org',
              '@type': 'EducationalOrganization',
              name: 'StudyHelp',
              url: 'https://www.studyhelp.site',
              description:
                'The #1 AI-powered study platform for Nigerian university students preparing for JAMB, WAEC, NECO, and Post-UTME examinations.',
              areaServed: {
                '@type': 'Country',
                name: 'Nigeria',
              },
            },
            {
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'What is StudyHelp?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text:
                      'StudyHelp is an AI-powered CBT practice platform built for Nigerian university students. It lets you turn your lecturer notes into practice questions for JAMB, WAEC, NECO, and Post-UTME exams.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Is StudyHelp free?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text:
                      'Yes! StudyHelp has a free plan with 3 practice sessions (10 questions each). You can upgrade to a Weekly plan (₦700) or Monthly plan (₦1,500) for unlimited access.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Can StudyHelp generate JAMB past questions?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text:
                      'Yes. StudyHelp uses AI to generate CBT-style practice questions in the format of JAMB, WAEC, NECO, and Post-UTME exams. You can also upload your own notes and get custom questions instantly.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How do I prepare for WAEC using StudyHelp?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text:
                      'Sign up for free on StudyHelp, select WAEC as your exam type, choose your subjects, and start practicing. The AI study tutor explains every answer so you learn while you practice.',
                  },
                },
              ],
            },
          ]),
        }}
      />

      {/* Navigation */}
      <header className="nv">
        <div className="w nav">
          <Link href="/" className="logo" onClick={() => setMobileMenuOpen(false)}>
            <div className="logo-icon-wrap">
              <Image
                src="/apple-touch-icon.png"
                alt="StudyHelp"
                width={40}
                height={40}
                priority
                className="logo-icon-img"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            StudyHelp
          </Link>

          {/* Desktop Nav Links */}
          <nav className="links">
            <Link href="#features">Features</Link>
            <Link href="#how-it-works">How it works</Link>
            <Link href="#pricing">Pricing</Link>
          </nav>

          {/* Desktop Action Buttons */}
          <div className="nav-actions-desktop">
            <ThemeToggle />
            {isInstallable && (
              <button
                type="button"
                onClick={installApp}
                className="btn-pwa-install"
                title="Install StudyHelp on your device"
              >
                <Download size={14} />
                <span>Install App</span>
              </button>
            )}
            {!isAuthenticated ? (
              <>
                <Link className="btn b2 sm" href="/auth/login">
                  Log in
                </Link>
                <Link className="btn b1 sm" href="/auth/signup">
                  Sign up
                </Link>
              </>
            ) : (
              <Link className="btn b1 sm" href="/dashboard">
                Dashboard
              </Link>
            )}
          </div>

          {/* Mobile Right Controls: Theme Toggle BEFORE Hamburger */}
          <div className="nav-mobile-controls">
            <ThemeToggle />
            <button
              type="button"
              className="nav-hamburger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
            <div className="mobile-menu-drawer" onClick={(e) => e.stopPropagation()}>
              <nav className="mobile-nav-links">
                <Link
                  href="#features"
                  className="mobile-nav-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link
                  href="#how-it-works"
                  className="mobile-nav-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  How it works
                </Link>
                <Link
                  href="#pricing"
                  className="mobile-nav-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
              </nav>

              <div className="mobile-menu-divider" />

              <div className="mobile-menu-actions">
                {isInstallable && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      installApp()
                    }}
                    className="btn-pwa-install mobile-install-btn"
                  >
                    <Download size={16} />
                    <span>Install App</span>
                  </button>
                )}

                {!isAuthenticated ? (
                  <div className="mobile-auth-buttons">
                    <Link
                      className="btn b2 mobile-btn"
                      href="/auth/login"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Log in
                    </Link>
                    <Link
                      className="btn b1 mobile-btn"
                      href="/auth/signup"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign up free
                    </Link>
                  </div>
                ) : (
                  <Link
                    className="btn b1 mobile-btn"
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Go to Dashboard
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="hero">
        {/* Floating Icons Background */}
        <svg
          className="ico"
          style={{ left: '5%', top: '70px', width: '64px', height: '64px' }}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" />
        </svg>
        <svg
          className="ico"
          style={{ left: '15%', top: '330px', width: '48px', height: '48px', animationDelay: '-3s' }}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M22 10 12 5 2 10l10 5z" />
          <path d="M6 12v5c3 2 9 2 12 0v-5" />
        </svg>
        <svg
          className="ico"
          style={{ left: '4%', top: '470px', width: '56px', height: '56px', animationDelay: '-5s' }}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
        </svg>
        <svg
          className="ico"
          style={{ left: '22%', top: '150px', width: '40px', height: '40px', animationDelay: '-7s' }}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
        </svg>
        <svg
          className="ico"
          style={{ right: '6%', top: '80px', width: '60px', height: '60px', animationDelay: '-2s' }}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M9 18h6M10 22h4" />
          <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V18h6v-1.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z" />
        </svg>
        <svg
          className="ico"
          style={{ right: '15%', top: '340px', width: '48px', height: '48px', animationDelay: '-4s' }}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
        <svg
          className="ico"
          style={{ right: '4%', top: '470px', width: '56px', height: '56px', animationDelay: '-6s' }}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 3 3 5-6" />
        </svg>
        <svg
          className="ico"
          style={{ right: '23%', top: '160px', width: '40px', height: '40px', animationDelay: '-1s' }}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
        </svg>
        <svg
          className="ico"
          style={{ left: '12%', top: '215px', width: '52px', height: '52px', animationDelay: '-2s' }}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="1.5" />
          <ellipse cx="12" cy="12" rx="10" ry="4" />
          <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
        </svg>
        <svg
          className="ico"
          style={{ left: '24%', top: '440px', width: '48px', height: '48px', animationDelay: '-5s' }}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 18h.01M12 18h.01M16 18h.01" />
        </svg>
        <svg
          className="ico"
          style={{ left: '2%', top: '290px', width: '44px', height: '44px', animationDelay: '-8s' }}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M18 7V4H6l6 8-6 8h12v-3" />
        </svg>
        <svg
          className="ico"
          style={{ left: '9%', top: '390px', width: '52px', height: '52px', animationDelay: '-3s' }}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M8 13h8M8 17h8" />
        </svg>
        <svg
          className="ico"
          style={{ right: '12%', top: '225px', width: '52px', height: '52px', animationDelay: '-6s' }}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3" />
          <path d="M7.5 15h9" />
        </svg>
        <svg
          className="ico"
          style={{ right: '24%', top: '445px', width: '48px', height: '48px', animationDelay: '-1s' }}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </svg>
        <svg
          className="ico"
          style={{ right: '2%', top: '290px', width: '46px', height: '46px', animationDelay: '-7s' }}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="m3 17 14-14 4 4L7 21z" />
          <path d="m7 9 2 2M10 6l2 2M13 13l2 2M10 16l2 2" />
        </svg>
        <svg
          className="ico"
          style={{ right: '10%', top: '395px', width: '54px', height: '54px', animationDelay: '-4s' }}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" />
          <path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />
        </svg>

        <div className="w hg">
          <div className="ht">
            <h1 className="h1">
              The tool behind every <span className="gt">first class</span>
            </h1>
            <p className="sub">
              Upload your notes, practice past questions and track your progress, all in one place.
            </p>
            <div className="acts">
              <Link className="btn hb1" href="/auth/signup">
                Start free
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <Link className="btn hb2" href="#how-it-works">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="m10 8 6 4-6 4z" />
                </svg>
                See how it works
              </Link>
            </div>
            <div className="stats">
              <div>
                <b>200+</b>
                <span>students studying smarter</span>
              </div>
              <div>
                <b>AI</b>
                <span>tutor and note-to-quiz</span>
              </div>
              <div>
                <b>₦0</b>
                <span>to get started</span>
              </div>
            </div>
          </div>

          {/* Interactive Phone Mockup */}
          <div className="ph">
            <div className="ps">
              <div className="pn" />
              <div className="pt">
                <small>SCHOLAR</small>
                <b>Hi, Viktor</b>
              </div>
              <div className="pk">
                <small>Streak</small>
                <b>12 Days</b>
                <div className="bar">
                  <i style={{ width: '75%' }} />
                </div>
                <small style={{ marginTop: '8px' }}>75% to next rank: Master</small>
              </div>
              <div className="pa">
                <div>
                  <i>
                    <svg viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                    </svg>
                  </i>
                  Past Questions
                </div>
                <div>
                  <i>
                    <svg viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" />
                      <path d="m8 12 3 3 5-6" />
                    </svg>
                  </i>
                  Practice CBT
                </div>
                <div>
                  <i>
                    <svg viewBox="0 0 24 24">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                    </svg>
                  </i>
                  Note Generator
                </div>
                <div>
                  <i>
                    <svg viewBox="0 0 24 24">
                      <path d="M4 6h16M4 12h16M4 18h10" />
                    </svg>
                  </i>
                  AI Summaries
                </div>
                <div>
                  <i>
                    <svg viewBox="0 0 24 24">
                      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
                    </svg>
                  </i>
                  AI Study Tutor
                </div>
                <div>
                  <i>
                    <svg viewBox="0 0 24 24">
                      <rect x="3" y="6" width="18" height="12" rx="2" />
                    </svg>
                  </i>
                  Flashcards
                </div>
              </div>
              <div className="pc">
                <div>
                  <b>Maths Practice</b>
                  <br />
                  <small>2:00 PM · Today</small>
                </div>
                <small style={{ color: '#6D3BF2', fontWeight: 700 }}>Upcoming</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Infinite Scrolling Marquee */}
      <div className="mq">
        <div className="mt">
          <span>CBT practice</span>
          <span>AI study tutor</span>
          <span>Flashcards</span>
          <span>Note generator</span>
          <span>AI summaries</span>
          <span>Question bank</span>
          <span>Progress tracking</span>
          <span>Study groups</span>
          <span>CBT practice</span>
          <span>AI study tutor</span>
          <span>Flashcards</span>
          <span>Note generator</span>
          <span>AI summaries</span>
          <span>Question bank</span>
          <span>Progress tracking</span>
          <span>Study groups</span>
        </div>
      </div>

      {/* Sound Familiar Section */}
      <section className="sec tint">
        <svg
          className="ico"
          style={{ left: '4%', top: '40px', width: '56px', height: '56px' }}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" />
        </svg>
        <svg
          className="ico"
          style={{ right: '5%', top: '60px', width: '48px', height: '48px', animationDelay: '-4s' }}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
        <svg
          className="ico"
          style={{ left: '8%', bottom: '40px', width: '52px', height: '52px', animationDelay: '-2s' }}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
        </svg>
        <svg
          className="ico"
          style={{ right: '9%', bottom: '50px', width: '56px', height: '56px', animationDelay: '-6s' }}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M22 10 12 5 2 10l10 5z" />
          <path d="M6 12v5c3 2 9 2 12 0v-5" />
        </svg>
        <div className="w">
          <div className="k">Sound familiar?</div>
          <h2 className="h2">We&apos;ve all been there</h2>
          <p className="lead">Studying shouldn&apos;t be this hard.</p>
          <div className="g3">
            <div className="card">
              <div className="ic v">01</div>
              <h3>Information overload</h3>
              <p>You have 100+ pages of notes but don&apos;t know what will actually appear in the exam.</p>
            </div>
            <div className="card">
              <div className="ic">02</div>
              <h3>Time is running out</h3>
              <p>Exam is in 2 days and you&apos;re still struggling to memorize basic concepts.</p>
            </div>
            <div className="card">
              <div className="ic v">03</div>
              <h3>Boring study sessions</h3>
              <p>Reading the same textbook over and over is making you fall asleep.</p>
            </div>
          </div>
          <p className="bridge">StudyHelp fixes all three. Here&apos;s how ↓</p>
        </div>
      </section>

      {/* Features Section */}
      <section className="sec" id="features">
        <div className="w">
          <div className="k">Features</div>
          <h2 className="h2">Study smarter, not harder</h2>
          <p className="lead">Everything you need to ace your exams in one platform.</p>
          <div className="g4">
            <div className="card">
              <div className="ic">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6M8 13h8M8 17h5" />
                </svg>
              </div>
              <h3>Note-to-Quiz</h3>
              <p>Upload your notes and get exam-standard questions instantly.</p>
            </div>
            <div className="card">
              <div className="ic v">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" />
                </svg>
              </div>
              <h3>Past Questions</h3>
              <p>Thousands of past questions with detailed solutions.</p>
            </div>
            <div className="card">
              <div className="ic">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
                </svg>
              </div>
              <h3>Progress Tracking</h3>
              <p>See your weak points and track your improvement.</p>
            </div>
            <div className="card">
              <div className="ic v">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
                </svg>
              </div>
              <h3>Study Groups</h3>
              <p>Share notes and grow together with other students.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="sec tint" id="how-it-works">
        <div className="w">
          <div className="k">Fast · AI-powered · Simple</div>
          <h2 className="h2">Simple 3-step process</h2>
          <p className="lead">From stressed student to top of the class in 3 steps.</p>
          <div className="g3">
            <div className="card">
              <span className="bn">1</span>
              <div className="num">1</div>
              <h3>Upload</h3>
              <p>Drop your lecture notes, PDFs, or textbooks into the platform.</p>
              <div className="mini">
                physics_lecture_3.pdf · 12.4 MB
                <div className="bar">
                  <i style={{ width: '80%' }} />
                </div>
              </div>
            </div>
            <div className="card">
              <span className="bn">2</span>
              <div className="num">2</div>
              <h3>Generate</h3>
              <p>Get AI summaries, flashcards and exam-style questions from your material.</p>
              <div className="mini">
                AI summary ready
                <div className="bar">
                  <i style={{ width: '100%' }} />
                </div>
              </div>
            </div>
            <div className="card">
              <span className="bn">3</span>
              <div className="num">3</div>
              <h3>Practice and improve</h3>
              <p>Take CBT practice, review explanations and watch your scores climb.</p>
              <div className="mini">
                Mock score average · 88%
                <div className="bar">
                  <i style={{ width: '88%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="sec" id="pricing">
        <div className="w pr">
          <div className="k">Pricing</div>
          <h2 className="h2">Simple, affordable plans</h2>
          <p className="lead">Built for Nigerian students. No hidden fees. Cancel anytime.</p>
          <div className="g3">
            {/* Free Plan */}
            <div className="card pcd">
              <b>Free</b>
              <div className="price">
                ₦0 <small>forever</small>
              </div>
              <span className="ps2">Get started with no commitment</span>
              <ul>
                <li>3 practice sessions (10 questions each)</li>
                <li>Basic study timer</li>
                <li>Limited analytics</li>
              </ul>
              <Link className="btn b2" href="/auth/signup">
                Get started free
              </Link>
            </div>

            {/* Weekly Plan */}
            <div className="card pop pcd">
              <span className="tag">Popular</span>
              <b>Weekly</b>
              <div className="price">
                ₦700 <small>/ week</small>
              </div>
              <span className="ps2">Perfect for exam season</span>
              <ul>
                <li>Unlimited CBT tests and study sessions</li>
                <li>Unlimited AI questions and tutoring</li>
                <li>All exam types</li>
                <li>Smart study timer</li>
                <li>Full analytics and progress tracking</li>
                <li>Notes, highlights and streak tracking</li>
                <li>AI explanations for answers</li>
              </ul>
              <Link className="btn b1" href="/auth/signup?plan=weekly">
                Start weekly plan
              </Link>
            </div>

            {/* Monthly Plan */}
            <div className="card pcd">
              <span className="tag bl">Best value</span>
              <b>Monthly</b>
              <div className="price">
                ₦1,500 <small>/ month</small>
              </div>
              <span className="ps2" style={{ color: '#2F5FE0', fontWeight: 700 }}>
                Save ₦1,300 vs weekly
              </span>
              <ul>
                <li>Everything in Weekly</li>
                <li>Priority support</li>
              </ul>
              <Link className="btn b2" href="/auth/signup?plan=monthly">
                Start monthly plan
              </Link>
            </div>
          </div>

          <div className="chips">
            <span>Pay with card, bank or USSD</span>
            <span>Instant activation</span>
            <span>No auto-renewal</span>
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="w cta-wrap">
        <div className="cta">
          <svg
            className="ico"
            style={{ left: '5%', top: '30px', width: '60px', height: '60px', color: '#fff', opacity: 0.14 }}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M22 10 12 5 2 10l10 5z" />
            <path d="M6 12v5c3 2 9 2 12 0v-5" />
          </svg>
          <svg
            className="ico"
            style={{
              right: '6%',
              bottom: '30px',
              width: '56px',
              height: '56px',
              color: '#fff',
              opacity: 0.14,
              animationDelay: '-3s',
            }}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" />
          </svg>
          <h2 className="h2" style={{ color: '#fff', marginTop: 0 }}>
            Ready to join 200+ students?
          </h2>
          <p style={{ maxWidth: '520px', margin: '0 auto 28px', fontSize: '18px' }}>
            Stop struggling and start studying smarter. It takes less than 30 seconds to get started.
          </p>
          <Link className="btn" href="/auth/signup">
            Start free now
          </Link>
          <p style={{ margin: '20px 0 0', fontSize: '14px', opacity: 0.9 }}>
            No credit card required · Instant access · Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="foot">
        <div className="w">
          <div className="fg">
            <div className="foot-brand">
              <Link className="logo" href="/">
                <div className="logo-icon-wrap">
                  <Image
                    src="/apple-touch-icon.png"
                    alt="StudyHelp"
                    width={40}
                    height={40}
                    className="logo-icon-img"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
                StudyHelp
              </Link>
            </div>
            <div className="foot-links">
              <div className="foot-col">
                <b>Product</b>
                <Link href="#how-it-works">How it works</Link>
                <Link href="#features">Features</Link>
                <Link href="#pricing">Pricing</Link>
              </div>
              <div className="foot-col">
                <b>Account</b>
                <Link href="/auth/login">Log in</Link>
                <Link href="/auth/signup">Sign up</Link>
                <Link href="/dashboard">Dashboard</Link>
              </div>
              <div className="foot-col">
                <b>Resources</b>
                <Link href="/help-center">Help center</Link>
                <Link href="/contact">Contact</Link>
                <Link href="/privacy-policy">Privacy policy</Link>
              </div>
              <div className="foot-col">
                <b>Legal</b>
                <Link href="/terms">Terms of service</Link>
                <Link href="/cookie-policy">Cookie policy</Link>
              </div>
            </div>
          </div>
          <div className="foot-bottom">
            <p>© {new Date().getFullYear()} StudyHelp. Built for Nigerian students.</p>
            <p className="foot-contact">
              <a href="mailto:support@studyhelp.site">support@studyhelp.site</a> · +234 916 334 5794
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
