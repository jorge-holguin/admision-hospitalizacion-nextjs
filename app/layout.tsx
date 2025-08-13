import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import { LoadingProvider } from '@/components/LoadingProvider'

export const metadata: Metadata = {
  title: 'Sistema de Admisión',
  description: 'Sistema de Admisión Web - HJATCH',
  generator: 'Equipo de desarrollo del HJATCH',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <LoadingProvider>
            {children}
          </LoadingProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
