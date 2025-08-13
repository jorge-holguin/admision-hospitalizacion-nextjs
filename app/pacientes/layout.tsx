"use client"

import ProtectedRoute from '@/components/ProtectedRoute'

export default function PacientesLayout({
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
