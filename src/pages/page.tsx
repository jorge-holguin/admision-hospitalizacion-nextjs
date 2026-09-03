"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Lock } from "lucide-react"
import { useAuth } from "@/components/AuthProvider"

const API_AUTH = import.meta.env.VITE_AUTH_API_URL

export default function LoginPage() {
  const { login } = useAuth()
  const [credentials, setCredentials] = useState({ username: "", password: "" })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    try {
      const response = await fetch(`${API_AUTH}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Error en la autenticación")
      if (data.success && data.data) {
        login(data.data.jwt, data.data.primerInicio)
      } else {
        setError(data.message || "Error en la autenticación")
      }
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .login-root {
            min-height: 100vh !important;
          }
          .login-left {
            display: none !important;
          }
          .login-right {
            flex: none !important;
            flex-basis: 100% !important;
            width: 100% !important;
            min-height: 100vh !important;
            padding: 1.25rem !important;
          }
          .login-card {
            max-width: 100% !important;
            padding: 1.75rem !important;
            border-radius: 1rem !important;
            box-shadow: 0 10px 30px rgba(0,0,0,0.12) !important;
          }
          .login-logo {
            width: 130px !important;
            height: 130px !important;
            margin-bottom: 0.75rem !important;
          }
          .login-title {
            font-size: 1.25rem !important;
          }
        }
      `}</style>

      <div
        className="login-root"
        style={{ display: "flex", minHeight: "100vh", width: "100vw", overflow: "hidden" }}
      >
        {/* ── IZQUIERDA: foto del hospital ── */}
        <div
          className="login-left"
          style={{
            flex: "0 0 50%",
            backgroundImage: "url('/login-bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
          }}
        >
          {/* overlay suave para que el texto resalte */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(15,30,70,0.45)",
            }}
          />
          {/* texto centrado */}
          <div
            className="login-left-text"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "2rem",
            }}
          >
            <div
              style={{
                background: "rgba(10,20,60,0.50)",
                backdropFilter: "blur(6px)",
                borderRadius: "1rem",
                padding: "2.5rem 2rem",
                textAlign: "center",
                border: "1px solid rgba(255,255,255,0.15)",
                maxWidth: "380px",
                width: "100%",
              }}
            >
              <h1
                style={{
                  color: "#fff",
                  fontSize: "2.2rem",
                  fontWeight: 800,
                  margin: 0,
                  lineHeight: 1.1,
                  textShadow: "0 2px 8px rgba(0,0,0,0.7)",
                }}
              >
                HOSPITAL
              </h1>
              <h2
                style={{
                  color: "#fff",
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  marginTop: "0.5rem",
                  textShadow: "0 2px 6px rgba(0,0,0,0.7)",
                }}
              >
                JOSÉ AGURTO TELLO DE CHOSICA
              </h2>
              <div
                style={{
                  height: "3px",
                  width: "60px",
                  background: "#FACC15",
                  borderRadius: "99px",
                  margin: "1rem auto",
                }}
              />
              <p
                style={{
                  color: "rgba(255,255,255,0.9)",
                  fontSize: "1rem",
                  margin: 0,
                  textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                }}
              >
                ATENCIÓN EMERGENCIAS 24 HORAS
              </p>
            </div>
          </div>
        </div>

        {/* ── DERECHA: formulario ── */}
        <div
          className="login-right"
          style={{
            flex: "0 0 50%",
            background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
        >
          <div
            className="login-card"
            style={{
              background: "#fff",
              borderRadius: "1.25rem",
              boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
              padding: "2.5rem",
              width: "100%",
              maxWidth: "420px",
            }}
          >
            {/* logo */}
            <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
              <img
                className="login-logo"
                src="/hjatch-logo.jpg"
                alt="HJATCH"
                style={{
                  width: "90px",
                  height: "90px",
                  objectFit: "contain",
                  margin: "0 auto 1rem",
                  display: "block",
                }}
              />
              <h1
                className="login-title"
                style={{
                  color: "#1e3a8a",
                  fontSize: "1.4rem",
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                SISTEMA DE ADMISIÓN WEB
              </h1>
              <p style={{ color: "#2563eb", fontSize: "0.85rem", margin: "0.4rem 0 0" }}>
                Hospital José Agurto Tello de Chosica
              </p>
            </div>

            <form onSubmit={handleLogin} autoComplete="off">
              <p
                style={{
                  textAlign: "center",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "1.5rem",
                }}
              >
                Ingreso al sistema
              </p>

              {/* usuario */}
              <div style={{ marginBottom: "1.25rem" }}>
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Documento de Identidad
                </Label>
                <div style={{ position: "relative", marginTop: "0.35rem" }}>
                  <User
                    style={{
                      position: "absolute",
                      left: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#3b82f6",
                      width: "18px",
                      height: "18px",
                    }}
                  />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Documento de Identidad"
                    value={credentials.username}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                    style={{ paddingLeft: "2.5rem", height: "48px" }}
                    autoComplete="off"
                    required
                  />
                </div>
              </div>

              {/* contraseña */}
              <div style={{ marginBottom: "1.5rem" }}>
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Contraseña
                </Label>
                <div style={{ position: "relative", marginTop: "0.35rem" }}>
                  <Lock
                    style={{
                      position: "absolute",
                      left: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#3b82f6",
                      width: "18px",
                      height: "18px",
                    }}
                  />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Contraseña"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    style={{ paddingLeft: "2.5rem", height: "48px" }}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              {error && (
                <p style={{ color: "#dc2626", fontSize: "0.85rem", textAlign: "center", marginBottom: "1rem" }}>
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                style={{
                  width: "100%",
                  height: "48px",
                  background: "linear-gradient(90deg,#1d4ed8,#1e40af)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  border: "none",
                  borderRadius: "0.6rem",
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}
              >
                {isLoading ? "PROCESANDO..." : "INGRESAR AL SISTEMA"}
              </Button>
            </form>

            <p style={{ textAlign: "center", fontSize: "0.7rem", color: "#9ca3af", marginTop: "1.75rem" }}>
              © Derechos Reservados HJATCH - UEI - 2026
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
