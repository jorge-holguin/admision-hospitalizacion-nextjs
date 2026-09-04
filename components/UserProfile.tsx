"use client"

import { useEffect, useState } from "react"
import { User } from "lucide-react"
import { useAuth } from "./AuthProvider"

export function UserProfile() {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="flex items-center gap-4 min-w-0">
        <div className="text-right min-w-0">
          <p className="text-sm font-medium truncate">Cargando...</p>
          <p className="text-xs opacity-90 truncate">Usuario</p>
        </div>
        <User className="w-8 h-8 bg-blue-500 text-white rounded-full p-1 shrink-0" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4 min-w-0">
      <div className="text-right min-w-0">
        <p className="text-sm font-medium truncate">{user.nombreCompleto}</p>
        <p className="text-xs opacity-90 truncate">{user.puesto}</p>
      </div>
      <User className="w-8 h-8 bg-blue-500 text-white rounded-full p-1 shrink-0" />
    </div>
  )
}
