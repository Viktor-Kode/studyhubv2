'use client'

import Link from 'next/link'
import { FaGithub, FaTwitter, FaLinkedin, FaWhatsapp, FaEnvelope, FaPhone } from 'react-icons/fa'
import Image from 'next/image'

const footerLinks = {
  Product: [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
  ],
  Account: [
    { label: 'Log in', href: '/auth/login' },
    { label: 'Sign up', href: '/auth/signup' },
    { label: 'Dashboard', href: '/dashboard' },
  ],
  Resources: [
    { label: 'Help Center', href: '/help-center' },
    { label: 'Contact', href: '/contact' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
  ],
  Legal: [
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookie-policy' },
  ],
}

const socialLinks = [
  { icon: FaTwitter, href: '#', label: 'Twitter' },
  { icon: FaLinkedin, href: '#', label: 'LinkedIn' },
  { icon: FaGithub, href: '#', label: 'GitHub' },
]

export default function Footer() {
  return (
    <footer className="bg-[#05070a] border-t border-white/5 py-12 md:py-20 relative z-10">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Main Footer Content */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-12 mb-16">
            {/* Logo Column */}
            <div className="col-span-2">
              <Link href="/" className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 border border-purple-500 rounded-lg flex items-center justify-center overflow-hidden bg-slate-900">
                  <Image 
                    src="/favicon-32x32.png" 
                    alt="StudyHelp Logo" 
                    width={32} 
                    height={32} 
                    className="object-contain"
                  />
                </div>
                <span className="text-2xl font-bold text-white tracking-tight">StudyHelp</span>
              </Link>
              <p className="text-slate-400 text-sm mb-8 max-w-xs leading-relaxed">
                The ultimate AI-powered study tool designed specifically for Nigerian students to ace their exams and master their courses.
              </p>
              {/* Social Icons */}
              <div className="flex gap-4">
                {socialLinks.map((social, index) => {
                  const Icon = social.icon
                  return (
                    <a
                      key={index}
                      href={social.href}
                      className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all duration-300"
                      aria-label={social.label}
                    >
                      <Icon className="text-lg" />
                    </a>
                  )
                })}
              </div>
            </div>

            {/* Link Columns */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category} className="col-span-1">
                <h3 className="text-white font-bold mb-6 text-sm">
                  {category}
                </h3>
                <ul className="space-y-4">
                  {links.map((link, index) => (
                    <li key={index}>
                      <Link
                        href={link.href}
                        className="text-slate-400 hover:text-purple-400 transition-colors duration-300 text-sm"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-500 text-xs">
              © {new Date().getFullYear()} StudyHelp. Built with ❤️ for Nigerian Students.
            </p>
            <div className="flex items-center gap-6">
              <a href="mailto:support@studyhelp.site" className="text-slate-500 hover:text-white transition-colors text-xs flex items-center gap-2">
                <FaEnvelope /> support@studyhelp.site
              </a>
              <a href="tel:+2349163345794" className="text-slate-500 hover:text-white transition-colors text-xs flex items-center gap-2">
                <FaPhone /> +234 916 334 5794
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
