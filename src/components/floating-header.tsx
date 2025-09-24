"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Menu, MessageSquare, BarChart3, Settings, Store } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"

const navigationItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: BarChart3
  },
  {
    title: "Chat",
    href: "/chat",
    icon: MessageSquare
  },
  {
    title: "Stores",
    href: "/stores",
    icon: Store
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings
  }
]

export function FloatingHeader() {
  const isMobile = useIsMobile()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 mx-4 mt-4">
      <div className="bg-background/80 backdrop-blur-md border border-border rounded-2xl shadow-lg px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/segmante.webp"
              alt="Segmante"
              width={120}
              height={40}
              className="h-8 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          {!isMobile && (
            <nav className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.href} href={item.href}>
                    <Button variant="ghost" size="sm" className="h-9">
                      <Icon className="h-4 w-4 mr-2" />
                      {item.title}
                    </Button>
                  </Link>
                )
              })}
            </nav>
          )}

          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            <ThemeToggle />

            {/* Mobile menu */}
            {isMobile && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden">
                    <Menu className="h-4 w-4" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <div className="flex flex-col space-y-4 mt-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <Image
                        src="/segmante.webp"
                        alt="Segmante"
                        width={120}
                        height={40}
                        className="h-8 w-auto"
                      />
                    </div>
                    {navigationItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link key={item.href} href={item.href}>
                          <Button variant="ghost" size="lg" className="w-full justify-start h-12">
                            <Icon className="h-5 w-5 mr-3" />
                            {item.title}
                          </Button>
                        </Link>
                      )
                    })}
                  </div>
                </SheetContent>
              </Sheet>
            )}

            {/* Get Started Button */}
            <Button size="sm" className="hidden sm:inline-flex">
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}