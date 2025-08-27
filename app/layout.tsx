import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import { LoadingProvider } from '@/components/LoadingProvider'
import { HideDebugger } from '@/components/HideDebugger'
import { PatientProvider } from '@/contexts/PatientContext'

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
            <PatientProvider>
              <HideDebugger />
              {children}
            </PatientProvider>
          </LoadingProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
