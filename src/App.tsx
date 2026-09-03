import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { RootLayout } from '@/components/RootLayout'

const Home = lazy(() => import('./pages/page'))
const Dashboard = lazy(() => import('./pages/dashboard/page'))
const Appointments = lazy(() => import('./pages/appointments/page'))
const AppointmentsReserved = lazy(() => import('./pages/appointments/reserved/page'))
const Filiation = lazy(() => import('./pages/filiation/page'))
const HistoriasClinicas = lazy(() => import('./pages/historias-clinicas/page'))
const Insurance = lazy(() => import('./pages/insurance/page'))
const Laboratory = lazy(() => import('./pages/laboratory/page'))
const MasterTables = lazy(() => import('./pages/master-tables/page'))
const DemandaInsatisfecha = lazy(() => import('./pages/demanda-insatisfecha/page'))
const NotFound = lazy(() => import('./pages/not-found'))

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <RootLayout>
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center text-blue-700">Cargando...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/appointments/reserved" element={<AppointmentsReserved />} />
            <Route path="/filiation" element={<Filiation />} />
            <Route path="/historias-clinicas" element={<HistoriasClinicas />} />
            <Route path="/insurance" element={<Insurance />} />
            <Route path="/laboratory" element={<Laboratory />} />
            <Route path="/master-tables" element={<MasterTables />} />
            <Route path="/demanda-insatisfecha" element={<DemandaInsatisfecha />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </RootLayout>
    </BrowserRouter>
  )
}

export default App
