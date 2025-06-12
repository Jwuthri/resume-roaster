"use client"

import { useState } from "react"
import { Flame, Menu, X, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NavigationProps {
  currentPage?: string
}

export function Navigation({ currentPage }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const isAuthenticated = status === 'authenticated'

  const navigationItems = [
    // { name: 'Resume Optimizer', path: '/resume-optimizer', showAlways: true },
    { name: 'Dashboard', path: '/dashboard', authRequired: true },
    { name: 'Pricing', path: '/pricing', showAlways: true },
    { name: 'Settings', path: '/settings', authRequired: true },
  ]

  const visibleItems = navigationItems.filter(item => 
    item.showAlways || (item.authRequired && isAuthenticated)
  )

  return (
    <header className="border-b border-orange-100 bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo - Clickable to go home */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Flame className="h-8 w-8 text-orange-500" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              Resume Roaster
            </h1>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {visibleItems.map((item) => (
              <Button
                key={item.path}
                variant={currentPage === item.name.toLowerCase().replace(' ', '-') ? "default" : "ghost"}
                onClick={() => router.push(item.path)}
                className={currentPage === item.name.toLowerCase().replace(' ', '-') ? 
                  "bg-gradient-to-r from-orange-500 to-red-500 text-white" : ""
                }
              >
                {item.name}
              </Button>
            ))}
            
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    {session?.user?.name || session?.user?.email}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                    Dashboard
                  </DropdownMenuItem>
                  {/* <DropdownMenuItem onClick={() => router.push('/resume-optimizer')}>
                    Resume Optimizer
                  </DropdownMenuItem> */}
                  <DropdownMenuItem onClick={() => router.push('/pricing')}>
                    Pricing
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/settings')}>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" onClick={() => router.push('/auth/signin')}>
                Sign In
              </Button>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-orange-100">
            <div className="flex flex-col space-y-2 pt-4">
              {visibleItems.map((item) => (
                <Button
                  key={item.path}
                  variant={currentPage === item.name.toLowerCase().replace(' ', '-') ? "default" : "ghost"}
                  className={`justify-start ${currentPage === item.name.toLowerCase().replace(' ', '-') ? 
                    "bg-gradient-to-r from-orange-500 to-red-500 text-white" : ""
                  }`}
                  onClick={() => {
                    router.push(item.path)
                    setMobileMenuOpen(false)
                  }}
                >
                  {item.name}
                </Button>
              ))}
              
              {isAuthenticated ? (
                <>
                  <div className="px-3 py-2 text-sm text-gray-600 border-t border-orange-100 mt-2 pt-4">
                    {session?.user?.name || session?.user?.email}
                  </div>
                  <Button 
                    variant="ghost" 
                    className="justify-start text-red-600" 
                    onClick={() => {
                      signOut()
                      setMobileMenuOpen(false)
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button 
                  variant="outline" 
                  className="justify-start" 
                  onClick={() => {
                    router.push('/auth/signin')
                    setMobileMenuOpen(false)
                  }}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
} 