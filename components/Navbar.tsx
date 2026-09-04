"use client"

import { useState } from "react"
import { useRouter, Link } from "@/lib/router"
import { ChevronDown, LogOut, Menu, X, User, Settings, LayoutDashboard, Calendar, Users, FolderHeart, FlaskConical, Table2, FileX } from "lucide-react"
import { UserProfile } from "./UserProfile"
import { useAuth } from "./AuthProvider"

interface NavbarProps {
  title?: string
  subtitle?: string
  showBackButton?: boolean
  backUrl?: string
}

const navLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/appointments", label: "Citas", icon: Calendar },
  { to: "/filiation", label: "Filiación", icon: Users },
  { to: "/historias-clinicas", label: "Historias", icon: FolderHeart },
  { to: "/insurance", label: "Seguros", icon: FolderHeart },
  { to: "/laboratory", label: "Laboratorio", icon: FlaskConical },
  { to: "/master-tables", label: "Tablas Maestras", icon: Table2 },
  { to: "/demanda-insatisfecha", label: "Demanda Insatisfecha", icon: FileX },
]

export function Navbar({ 
  title = "Sistema de Admisión Web", 
  subtitle = "HOSPITAL JOSÉ AGURTO TELLO DE CHOSICA - HJATCH", 
  showBackButton = false,
  backUrl = "/"
}: NavbarProps) {
  const { logout } = useAuth()
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    setMobileMenuOpen(false)
    setDropdownOpen(false)
    logout()
  }

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen)
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen)

  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="page-shell py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 min-w-0">
            {showBackButton && (
              <button
                onClick={() => router.push(backUrl)}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                ← Volver
              </button>
            )}
            <div className="shrink-0 w-8 h-8 bg-white rounded-full flex flex-wrap items-center justify-center">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg lg:text-xl font-bold truncate">{title}</h1>
              <p className="text-xs sm:text-sm opacity-90 truncate hidden sm:block">{subtitle}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {/* Mobile hamburger */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden inline-flex flex-wrap items-center justify-center rounded-md p-2 text-white hover:bg-blue-700 focus:outline-none"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Desktop profile dropdown */}
            <div className="relative hidden lg:block">
              <button 
                onClick={toggleDropdown}
                className="flex flex-wrap items-center gap-2 focus:outline-none"
              >
                <UserProfile />
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                    <p className="font-medium">Mi cuenta</p>
                  </div>
                  <button 
                    onClick={() => {
                      setDropdownOpen(false)
                      handleLogout()
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex flex-wrap items-center"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile / tablet navigation drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-blue-500 bg-blue-700">
          <nav className="page-shell py-3">
            <ul className="space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon
                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex flex-wrap items-center gap-3 rounded-md px-3 py-2 text-sm text-white hover:bg-blue-600"
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  </li>
                )
              })}
              <li className="border-t border-blue-500 pt-2 mt-2">
                <button
                  onClick={handleLogout}
                  className="flex flex-wrap w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-red-100 hover:bg-blue-600"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  )
}
