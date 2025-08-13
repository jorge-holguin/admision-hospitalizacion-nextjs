"use client"

import ProtectedRoute from '@/components/ProtectedRoute'

export default function EmergenciaLayout({
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
