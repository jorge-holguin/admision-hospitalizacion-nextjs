import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { RootLayout } from '@/components/RootLayout'

import Home from './pages/page'
import Dashboard from './pages/dashboard/page'
import Appointments from './pages/appointments/page'
import AppointmentsReserved from './pages/appointments/reserved/page'
import Filiation from './pages/filiation/page'
import HistoriasClinicas from './pages/historias-clinicas/page'
import Insurance from './pages/insurance/page'
import Laboratory from './pages/laboratory/page'
import MasterTables from './pages/master-tables/page'
import DemandaInsatisfecha from './pages/demanda-insatisfecha/page'
import NotFound from './pages/not-found'

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <RootLayout>
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
      </RootLayout>
    </BrowserRouter>
  )
}

export default App
