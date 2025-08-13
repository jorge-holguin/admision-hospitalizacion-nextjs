"use client"

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Spinner } from './ui/spinner'

interface LoadingContextType {
  isLoading: boolean
}

const LoadingContext = createContext<LoadingContextType>({ isLoading: false })

export const useLoading = () => useContext(LoadingContext)

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Cuando la ruta cambia, mostrar el loader
    setIsLoading(true)
    
    // Pequeño retraso para evitar parpadeos en navegaciones rápidas
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [pathname, searchParams])

  return (
    <LoadingContext.Provider value={{ isLoading }}>
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-300">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
            <Spinner size="lg" />
            <p className="mt-4 text-gray-700 font-medium">Cargando...</p>
          </div>
        </div>
      )}
      {children}
    </LoadingContext.Provider>
  )
}
