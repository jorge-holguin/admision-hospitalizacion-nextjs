"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronDown, LogOut, Menu, Settings, User } from "lucide-react"
import { UserProfile } from "./UserProfile"
import { useAuth } from "./AuthProvider"

interface NavbarProps {
  title?: string
  subtitle?: string
  showBackButton?: boolean
  backUrl?: string
}

export function Navbar({ 
  title = "SIGSALUD", 
  subtitle = "HOSPITALIZACIÓN", 
  showBackButton = false,
  backUrl = "/"
}: NavbarProps) {
  const { logout } = useAuth()
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = () => {
    logout()
  }

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen)
  }

  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          {showBackButton && (
            <button
              onClick={() => router.push(backUrl)}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:text-accent-foreground h-9 rounded-md px-3 text-white hover:bg-blue-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-arrow-left w-4 h-4 mr-2"
              >
                <path d="m12 19-7-7 7-7"></path>
                <path d="M19 12H5"></path>
              </svg>
              Volver
            </button>
          )}
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          </div>
          <div>
            <h1 className="text-xl font-bold">{title}</h1>
            <p className="text-sm opacity-90">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button 
              onClick={toggleDropdown}
              className="flex items-center space-x-2 focus:outline-none"
            >
              <UserProfile />
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                  <p className="font-medium">Mi cuenta</p>
                </div>
                <Link 
                  href="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  onClick={() => setDropdownOpen(false)}
                >
                  <User className="w-4 h-4 mr-2" />
                  <span>Perfil</span>
                </Link>
                <Link 
                  href="/settings"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  onClick={() => setDropdownOpen(false)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  <span>Configuración</span>
                </Link>
                <button 
                  onClick={() => {
                    setDropdownOpen(false)
                    handleLogout()
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
