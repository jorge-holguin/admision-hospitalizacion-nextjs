"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Table, Calendar } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { hasAccessToCitas, hasAccessToTablasMaestras, hasAccessToHospitalizacion, extractPuestoFromToken } from "@/utils/jwtUtils";

export default function Dashboard() {
  const router = useRouter();
  const [canAccessCitas, setCanAccessCitas] = useState(false);
  const [canAccessTablasMaestras, setCanAccessTablasMaestras] = useState(false);
  const [canAccessHospitalizacion, setCanAccessHospitalizacion] = useState(false);
  const [userPuesto, setUserPuesto] = useState<string | null>(null);

  useEffect(() => {
    // Verificar permisos cuando el componente se monta
    setCanAccessCitas(hasAccessToCitas());
    setCanAccessTablasMaestras(hasAccessToTablasMaestras());
    setCanAccessHospitalizacion(hasAccessToHospitalizacion());
    setUserPuesto(extractPuestoFromToken());
    
    console.log('🔐 Permisos de acceso verificados:');
    console.log('   - Puesto:', extractPuestoFromToken());
    console.log('   - Acceso a Citas:', hasAccessToCitas());
    console.log('   - Acceso a Tablas Maestras:', hasAccessToTablasMaestras());
    console.log('   - Acceso a Hospitalización:', hasAccessToHospitalizacion());
  }, []);

  const handleFiliacionClick = () => {
    router.push("/filiation");
  };

  const handleTablasMaestrasClick = () => {
    router.push("/master-tables");
  };

  const handleCitasClick = () => {
    router.push("/appointments");
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <Navbar />

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Módulos de trabajo del Sistema de Admisión Web
          </h2>
          <p className="text-gray-600">
            Seleccione el módulo al que desea acceder
          </p>
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* HOSPITALIZACIÓN / EMERGENCIA - Acceso para todos */}
          {canAccessHospitalizacion && (
            <Card
              className="hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border-2 border-transparent hover:border-blue-200"
              onClick={handleFiliacionClick}
            >
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Home className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  HOSPITALIZACIÓN / EMERGENCIA
                </h3>
                <p className="text-gray-600 text-sm">
                  Generación de órdenes de Hospitalización y Emergencia
                </p>
              </CardContent>
            </Card>
          )}

          {/* CITAS - Solo CALL CENTER y DEVOPS */}
          {canAccessCitas && (
            <Card
              className="hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border-2 border-transparent hover:border-blue-200"
              onClick={handleCitasClick}
            >
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">CITAS</h3>
                <p className="text-gray-600 text-sm">Gestión de citas médicas</p>
                <div className="mt-2">
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {userPuesto}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TABLAS MAESTRAS - Solo DEVOPS y ESTADISTICA */}
          {canAccessTablasMaestras && (
            <Card
              className="hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border-2 border-transparent hover:border-green-200"
              onClick={handleTablasMaestrasClick}
            >
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Table className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Tablas Maestras
                </h3>
                <p className="text-gray-600 text-sm">
                  Gestión de tablas maestras del sistema
                </p>
                <div className="mt-2">
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                    {userPuesto}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
}
