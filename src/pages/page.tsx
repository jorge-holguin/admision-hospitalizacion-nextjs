"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Lock } from "lucide-react"

import { useAuth } from "@/components/AuthProvider"

const API_AUTH = import.meta.env.VITE_AUTH_API_URL;

export default function LoginPage() {
  const { login } = useAuth();
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_AUTH}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error en la autenticación');
      }

      if (data.success && data.data) {
        login(data.data.jwt, data.data.primerInicio);
      } else {
        setError(data.message || 'Error en la autenticación');
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full grid grid-cols-1 md:grid-cols-2 bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Left side - Hospital Image */}
      <div className="relative min-h-screen hidden md:block">
        <img
          src="/login-bg.png"
          alt="Hospital Building"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'contrast(1.02) brightness(0.9) sepia(0.5) hue-rotate(190deg) saturate(0.7)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-blue-800/25 z-10"></div>
        <div className="absolute inset-0 z-20 flex items-center justify-center p-8">
          <div className="text-white text-center max-w-lg p-8 bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20">
            <h1 className="text-5xl font-extrabold mb-3 text-white tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              HOSPITAL
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              JOSÉ AGURTO TELLO DE CHOSICA
            </h2>
            <div className="mt-4 h-1 w-24 bg-yellow-400 mx-auto rounded-full"></div>
            <p className="text-lg mt-4 text-white/90 font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              ATENCIÓN EMERGENCIAS 24 HORAS
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="min-h-screen flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 md:p-10 border border-white/50">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src="/hjatch-logo.jpg"
                alt="Hospital José Agurto Tello de Chosica"
                width={90}
                height={90}
                className="rounded-full shadow-md object-cover"
              />
            </div>
            <h1 className="text-2xl font-bold text-blue-900 mb-1">SISTEMA DE GESTIÓN</h1>
            <h2 className="text-2xl font-bold text-blue-900 mb-2">HOSPITALARIA</h2>
            <p className="text-sm text-blue-700 font-medium">Hospital José Agurto Tello de Chosica</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5" autoComplete="off">
            <div className="text-center mb-2">
              <span className="text-base font-semibold text-gray-700">Ingreso al sistema</span>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Documento de Identidad
                </Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Documento de Identidad"
                    value={credentials.username}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                    className="pl-10 h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    autoComplete="off"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Contraseña
                </Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Contraseña"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="pl-10 h-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>
            </div>

            {error && <div className="text-red-600 text-sm text-center">{error}</div>}

            <Button
              type="submit"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md"
              disabled={isLoading}
            >
              {isLoading ? "PROCESANDO..." : "INGRESAR AL SISTEMA"}
            </Button>
          </form>

          <div className="mt-8 text-center text-xs text-gray-500">
            © Derechos Reservados HJATCH - UEI - 2026
          </div>
        </div>
      </div>
    </div>
  )
}
