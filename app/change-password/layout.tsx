"use client"

import ProtectedRoute from '@/components/ProtectedRoute'

export default function ChangePasswordLayout({
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
