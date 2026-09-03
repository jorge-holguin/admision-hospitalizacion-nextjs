import { AuthProvider } from '@/components/AuthProvider'
import { LoadingProvider } from '@/components/LoadingProvider'
import { HideDebugger } from '@/components/HideDebugger'
import { PatientProvider } from '@/contexts/PatientContext'
import { PatientAccountProvider } from '@/contexts/PatientAccountContext'
import { EmergencyAccountProvider } from '@/contexts/EmergencyAccountContext'
import { PatientDataProvider } from '@/contexts/PatientDataContext'
import { TipoDocumentoProvider } from '@/contexts/filiation/TipoDocumentoContext'

interface RootLayoutProps {
  children: React.ReactNode
}

export function RootLayout({ children }: Readonly<RootLayoutProps>) {
  return (
    <AuthProvider>
      <LoadingProvider>
        <TipoDocumentoProvider>
          <PatientDataProvider>
            <PatientAccountProvider>
              <EmergencyAccountProvider>
                <PatientProvider>
                  <HideDebugger />
                  {children}
                </PatientProvider>
              </EmergencyAccountProvider>
            </PatientAccountProvider>
          </PatientDataProvider>
        </TipoDocumentoProvider>
      </LoadingProvider>
    </AuthProvider>
  )
}
