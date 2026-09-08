"use client"

import { useState, useEffect, createContext, useContext, ReactNode, Suspense } from 'react'
import { useLocation } from 'react-router-dom'
import { PageLoader } from '@/components/ui/PageLoader'

interface LoadingContextType {
  isLoading: boolean
}

const LoadingContext = createContext<LoadingContextType>({ isLoading: false })

export const useLoading = () => useContext(LoadingContext)

function LoadingProviderInner({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const [showLoading, setShowLoading] = useState(false)
  const { pathname, search } = useLocation()

  useEffect(() => {
    setIsLoading(true)
    setShowLoading(false)
    const showTimer = setTimeout(() => setShowLoading(true), 150)
    const hideTimer = setTimeout(() => {
      setIsLoading(false)
      setShowLoading(false)
    }, 500)
    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [pathname, search])

  return (
    <LoadingContext.Provider value={{ isLoading }}>
      {showLoading && <PageLoader overlay />}
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
