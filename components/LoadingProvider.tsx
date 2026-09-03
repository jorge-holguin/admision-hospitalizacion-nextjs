"use client"

import { useState, useEffect, createContext, useContext, ReactNode, Suspense } from 'react'
import { useLocation } from 'react-router-dom'
import { Spinner } from './ui/spinner'

interface LoadingContextType {
  isLoading: boolean
}

const LoadingContext = createContext<LoadingContextType>({ isLoading: false })

export const useLoading = () => useContext(LoadingContext)

function LoadingProviderInner({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const { pathname, search } = useLocation()

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [pathname, search])

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

export function LoadingProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <LoadingProviderInner>{children}</LoadingProviderInner>
    </Suspense>
  )
}
