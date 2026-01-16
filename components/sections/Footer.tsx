'use client'

import Link from 'next/link'
import { FaGraduationCap, FaGithub, FaTwitter, FaLinkedin } from 'react-icons/fa'

const footerLinks = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'How It Works', href: '#how-it-works' },
  ],
  Company: [
    { label: 'About', href: '#about' },
    { label: 'Blog', href: '#blog' },
    { label: 'Careers', href: '#careers' },
  ],
  Resources: [
    { label: 'Help Center', href: '#help' },
    { label: 'Contact', href: '#contact' },
    { label: 'Privacy', href: '#privacy' },
  ],
  Legal: [
    { label: 'Terms', href: '#terms' },
    { label: 'Privacy Policy', href: '#privacy-policy' },
    { label: 'Cookie Policy', href: '#cookies' },
  ],
}

const socialLinks = [
  { icon: FaGithub, href: '#', label: 'GitHub' },
  { icon: FaTwitter, href: '#', label: 'Twitter' },
  { icon: FaLinkedin, href: '#', label: 'LinkedIn' },
]

export default function Footer() {
  return (
    <footer className="bg-[#050505] border-t border-white/10 py-12 md:py-16 relative z-10">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Main Footer Content */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Logo Column */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 border border-cyan-400 rounded-lg flex items-center justify-center">
                  <FaGraduationCap className="text-cyan-400 text-lg" />
                </div>
                <span className="text-xl font-bold text-white font-mono">StudyHelp</span>
              </Link>
              <p className="text-white/40 text-sm mb-4">
                Expert academic support powered by AI and verified educators.
              </p>
              {/* Social Icons */}
              <div className="flex gap-3">
                {socialLinks.map((social, index) => {
                  const Icon = social.icon
                  return (
                    <a
                      key={index}
                      href={social.href}
                      className="w-8 h-8 border border-white/20 rounded-lg flex items-center justify-center text-white/60 hover:text-cyan-400 hover:border-cyan-400/50 transition-all duration-300 hover:scale-110"
                      aria-label={social.label}
                    >
                      <Icon className="text-sm" />
                    </a>
                  )
                })}
              </div>
            </div>

            {/* Link Columns */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h3 className="text-white font-semibold mb-4 uppercase tracking-wide text-sm">
                  {category}
                </h3>
                <ul className="space-y-2">
                  {links.map((link, index) => (
                    <li key={index}>
                      <Link
                        href={link.href}
                        className="text-white/60 hover:text-cyan-400 transition-colors duration-300 text-sm relative group"
                      >
                        {link.label}
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-400 group-hover:w-full transition-all duration-300"></span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/40 text-sm">
              © {new Date().getFullYear()} StudyHelp. All rights reserved.
            </p>
            <p className="text-white/40 text-sm">
              Built with ❤️ for students everywhere
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
