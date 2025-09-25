"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Navbar, NavBody, NavItems, MobileNav, MobileNavHeader, MobileNavToggle, MobileNavMenu } from "@/components/ui/resizable-navbar"
const navigationItems = [
  { name: "Dashboard", link: "/" },
  { name: "Chat", link: "/chat" },
  { name: "Stores", link: "/stores" },
  { name: "Settings", link: "/settings" }
]

export function SuperMemoryNavbar() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)

  return (
    <div className="fixed top-4 left-0 right-0 z-50 mx-4">
      <Navbar className="top-0">
        <NavBody className="bg-slate-900/80 backdrop-blur border border-slate-700 rounded-2xl">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 relative z-20">
            <Image
              src="/segmante.webp"
              alt="Segmante"
              width={200}
              height={50}
              priority
            />
          </Link>

          {/* Navigation Items */}
          <NavItems items={navigationItems} className="text-gray-300" />

          {/* Right side actions */}
          <div className="flex items-center space-x-4 relative z-20">

             


            {/* CTA Button */}
            <Button className="bg-white text-black hover:bg-gray-100 font-medium px-6 py-2 rounded-lg">
              Get Started →
            </Button>
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav className="bg-slate-900/80 backdrop-blur border border-slate-700 rounded-2xl">
          <MobileNavHeader>
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/segmante.webp"
                alt="Segmante"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
            </Link>

            {/* Mobile Toggle */}
            <MobileNavToggle
              isOpen={isMenuOpen}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)}>
            {navigationItems.map((item, idx) => (
              <Link
                key={idx}
                href={item.link}
                className="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </div>
  )
}