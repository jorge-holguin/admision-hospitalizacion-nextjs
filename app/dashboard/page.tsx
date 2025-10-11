"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Home, Table, Calendar } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Navbar />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Sistema de Admisión para Hospitalización Web
          </h2>
          <p className="text-gray-600">
            Seleccione el módulo al que desea acceder
          </p>
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

          {/* <Card
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
                Gestión de pacientes en emergencia
              </p>
            </CardContent>
          </Card>

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
            </CardContent>
          </Card> */}
        </div>
      </main>
    </div>
  );
}
