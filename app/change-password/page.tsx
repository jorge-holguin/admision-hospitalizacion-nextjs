"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock } from "lucide-react"
import { getAuthToken } from "@/lib/auth"
import { Navbar } from "@/components/Navbar"

// API base URL
const API_BASE_URL = "http://192.168.0.17:9006";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    dni: "",
    fechaNacimiento: "",
    digitoVerificador: "",
    nuevaContrasena: "",
    confirmarContrasena: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (formData.nuevaContrasena !== formData.confirmarContrasena) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (formData.nuevaContrasena.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/restaurar-contrasena-usuario`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          dni: formData.dni,
          fechaNacimiento: formData.fechaNacimiento,
          digitoVerificador: formData.digitoVerificador,
          nuevaContrasena: formData.nuevaContrasena
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al cambiar la contraseña');
      }
      
      if (data.success) {
        setSuccess(true);
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setError(data.message || 'Error al cambiar la contraseña');
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="SISTEMA DE GESTIÓN HOSPITALARIA" subtitle="Cambio de Contraseña" />
      <div className="flex items-center justify-center p-8">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-blue-900 mb-2">SISTEMA DE GESTIÓN HOSPITALARIA</h1>
            <p className="text-blue-700">Hospital José Agurto Tello de Chosica</p>
          </div>

          {success ? (
            <div className="text-center p-6">
              <div className="text-green-600 text-xl mb-4">¡Contraseña cambiada exitosamente!</div>
              <p className="text-gray-600">Serás redirigido al dashboard en unos segundos...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-lg font-semibold text-gray-700">Cambio de contraseña</h2>
                <p className="text-sm text-gray-500 mt-1">Por favor establece tu nueva contraseña</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="dni" className="text-sm font-medium text-gray-700">
                    DNI
                  </Label>
                  <Input
                    id="dni"
                    name="dni"
                    type="text"
                    value={formData.dni}
                    onChange={handleChange}
                    className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="fechaNacimiento" className="text-sm font-medium text-gray-700">
                    Fecha de Nacimiento
                  </Label>
                  <Input
                    id="fechaNacimiento"
                    name="fechaNacimiento"
                    type="date"
                    value={formData.fechaNacimiento}
                    onChange={handleChange}
                    className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="digitoVerificador" className="text-sm font-medium text-gray-700">
                    Dígito Verificador
                  </Label>
                  <Input
                    id="digitoVerificador"
                    name="digitoVerificador"
                    type="text"
                    value={formData.digitoVerificador}
                    onChange={handleChange}
                    className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="nuevaContrasena" className="text-sm font-medium text-gray-700">
                    Nueva Contraseña
                  </Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5" />
                    <Input
                      id="nuevaContrasena"
                      name="nuevaContrasena"
                      type="password"
                      value={formData.nuevaContrasena}
                      onChange={handleChange}
                      className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmarContrasena" className="text-sm font-medium text-gray-700">
                    Confirmar Contraseña
                  </Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5" />
                    <Input
                      id="confirmarContrasena"
                      name="confirmarContrasena"
                      type="password"
                      value={formData.confirmarContrasena}
                      onChange={handleChange}
                      className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {error && <div className="text-red-600 text-sm text-center">{error}</div>}

              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                disabled={isLoading}
              >
                {isLoading ? "PROCESANDO..." : "CAMBIAR CONTRASEÑA"}
              </Button>
            </form>
          )}

          <div className="mt-8 text-center text-xs text-gray-500"> Derechos Reservados HJATCH - UEI - 2025</div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
