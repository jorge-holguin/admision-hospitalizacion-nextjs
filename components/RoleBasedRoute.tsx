"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "@/lib/router"

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
  
  // Memoizar roles permitidos para evitar recalcular en cada render
  const allowedRolesSet = useMemo(() => 
    new Set(allowedRoles.map(r => r.toUpperCase())),
    [allowedRoles]
  );

  useEffect(() => {
    // Solo ejecutar verificación una vez al montar el componente
    let isMounted = true;
    
    const checkAccess = () => {
      const puesto = extractPuestoFromToken();

      // Solo logear en desarrollo
      if (process.env.NODE_ENV === 'development') {
      }

      if (!puesto) {
        if (isMounted) {
          console.warn('⚠️ No se pudo obtener el puesto del usuario');
          alert('Sesión no válida\n\nNo se pudo obtener su información de sesión. Por favor, vuelva a iniciar sesión.');
          router.replace('/');
        }
        return;
      }

      const hasAccess = allowedRolesSet.has(puesto.toUpperCase());

      if (!hasAccess) {
        if (isMounted) {
          console.error(`❌ Acceso denegado. El puesto "${puesto}" no tiene permisos para ${moduleName}`);
          alert(`Acceso Denegado\n\nNo tiene permisos para acceder a ${moduleName}.\n\nPuesto actual: ${puesto}\nPuestos autorizados: ${allowedRoles.join(', ')}`);
          router.push(redirectTo);
        }
        return;
      }

      if (isMounted) {
        if (process.env.NODE_ENV === 'development') {        }
        setIsAuthorized(true);
        setIsLoading(false);
      }
    };

    checkAccess();
    
    return () => {
      isMounted = false;
    };
  }, []);  // ✅ Solo ejecutar al montar, sin dependencias

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
