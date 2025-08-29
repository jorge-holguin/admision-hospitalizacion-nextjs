import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import { LoadingProvider } from '@/components/LoadingProvider'
import { HideDebugger } from '@/components/HideDebugger'
import { PatientProvider } from '@/contexts/PatientContext'
import { PatientAccountProvider } from '@/contexts/PatientAccountContext'
import { PatientDataProvider } from '@/contexts/PatientDataContext'

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
            <PatientDataProvider>
              <PatientAccountProvider>
                <PatientProvider>
                  <HideDebugger />
                  {children}
                </PatientProvider>
              </PatientAccountProvider>
            </PatientDataProvider>
          </LoadingProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
