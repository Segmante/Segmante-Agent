"use client"

import Link from "next/link"
import Image from "next/image"

export function SuperMemoryFooter() {
  return (
    <footer className="relative bg-gradient-to-t from-blue-600 via-blue-500 to-transparent py-20 px-6 overflow-hidden">
      {/* Large Segmante Logo Background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <div className="text-[20rem] font-bold text-white/10 select-none">
          segmante™
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-8 md:space-y-0">
          {/* Left side - Logo */}
          <div className="flex items-center">
            <Image
              src="/segmante.webp"
              alt="Segmante"
              width={200}
              height={50}
            />
          </div>

          {/* Center - Navigation Links */}
          <div className="flex flex-wrap gap-8 text-sm">
            <Link href="/terms" className="text-white/80 hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-white/80 hover:text-white transition-colors">
              Privacy Policy
            </Link>
          </div>

          {/* Right side - Contact */}
          <div className="text-white/80">
            <a href="mailto:hello@segmante.com" className="text-sm hover:text-white transition-colors">
              CONTACT US
            </a>
          </div>
        </div>
      </div>

      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 via-transparent to-transparent pointer-events-none" />
    </footer>
  )
}