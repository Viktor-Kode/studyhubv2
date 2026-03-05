'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
  label?: string
  href?: string
}

export default function BackButton({ label = 'Back', href }: BackButtonProps) {
  const router = useRouter()

  if (href) {
    return (
      <Link href={href} className="back-button">
        <ArrowLeft size={18} />
        <span>{label}</span>
      </Link>
    )
  }

  return (
    <button
      type="button"
      className="back-button"
      onClick={() => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
          router.back()
        } else {
          router.push('/dashboard')
        }
      }}
    >
      <ArrowLeft size={18} />
      <span>{label}</span>
    </button>
  )
}
