"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { extractPuestoFromToken } from "@/utils/jwtUtils";

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
  moduleName?: string;
}

/**
 * Componente para proteger rutas basándose en el rol (puesto) del usuario
 * Solo permite acceso si el puesto del usuario está en la lista de roles permitidos
 */
export default function RoleBasedRoute({
  children,
  allowedRoles,
  redirectTo = "/dashboard",
  moduleName = "este módulo"
}: RoleBasedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAccess = () => {
      const puesto = extractPuestoFromToken();
      
      console.log('🔐 Verificando acceso a ruta protegida:');
      console.log('   - Módulo:', moduleName);
      console.log('   - Puesto del usuario:', puesto);
      console.log('   - Roles permitidos:', allowedRoles);
      
      if (!puesto) {
        console.warn('⚠️ No se pudo obtener el puesto del usuario');
        router.push(redirectTo);
        return;
      }

      const hasAccess = allowedRoles.some(role => 
        role.toUpperCase() === puesto.toUpperCase()
      );

      if (!hasAccess) {
        console.error(`❌ Acceso denegado. El puesto "${puesto}" no tiene permisos para ${moduleName}`);
        alert(`Acceso Denegado\n\nNo tiene permisos para acceder a ${moduleName}.\n\nPuesto actual: ${puesto}\nPuestos autorizados: ${allowedRoles.join(', ')}`);
        router.push(redirectTo);
        return;
      }

      console.log(`✅ Acceso autorizado para ${moduleName}`);
      setIsAuthorized(true);
      setIsLoading(false);
    };

    checkAccess();
  }, [router, allowedRoles, redirectTo, moduleName]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
