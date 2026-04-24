"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Table, Calendar, Loader2, FlaskConical, Shield } from "lucide-react";
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
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string>("");

  useEffect(() => {
    // Verificar permisos cuando el componente se monta
    setCanAccessCitas(hasAccessToCitas());
    setCanAccessTablasMaestras(hasAccessToTablasMaestras());
    setCanAccessHospitalizacion(hasAccessToHospitalizacion());
    setUserPuesto(extractPuestoFromToken());
  }, []);

  const handleFiliacionClick = () => {
    setIsNavigating(true);
    setNavigatingTo("Hospitalización / Emergencia");
    router.push("/filiation");
  };

  const handleTablasMaestrasClick = () => {
    setIsNavigating(true);
    setNavigatingTo("Tablas Maestras");
    router.push("/master-tables");
  };

  const handleCitasClick = () => {
    setIsNavigating(true);
    setNavigatingTo("Citas");
    router.push("/appointments");
  };

  const handleLaboratoryClick = () => {
    setIsNavigating(true);
    setNavigatingTo("Laboratorio");
    router.push("/laboratory");
  };

  const handleInsuranceClick = () => {
    setIsNavigating(true);
    setNavigatingTo("Seguros");
    router.push("/insurance");
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

          {/* LABORATORIO - Acceso para todos */}
          {/*
          <Card
            className="hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border-2 border-transparent hover:border-purple-200"
            onClick={handleLaboratoryClick}
          >
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FlaskConical className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                LABORATORIO
              </h3>
              <p className="text-gray-600 text-sm">
                Gestión de citas de laboratorio
              </p>
            </CardContent>
          </Card>
          */}

          {/* SEGUROS - Acceso para todos */}
          <Card
            className="hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border-2 border-transparent hover:border-cyan-200"
            onClick={handleInsuranceClick}
          >
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-10 h-10 text-cyan-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                SEGUROS
              </h3>
              <p className="text-gray-600 text-sm">
               FUAs y atenciones SIS
              </p>
            </CardContent>
          </Card>

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

      {/* Loading Overlay */}
      {isNavigating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md mx-4">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Cargando módulo...
                </h3>
                <p className="text-gray-600">
                  {navigatingTo}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Por favor espere mientras se carga el módulo
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
}
