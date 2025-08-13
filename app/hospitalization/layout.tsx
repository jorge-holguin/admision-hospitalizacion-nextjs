"use client"

import ProtectedRoute from '@/components/ProtectedRoute'

export default function HospitalizationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  )
}
