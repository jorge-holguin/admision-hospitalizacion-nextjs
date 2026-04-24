"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronDown, Search, X } from "lucide-react"
import {
  listarEspecialidades,
  type EspecialidadItem,
} from "@/services/insurance/insuranceAuditService"

interface EspecialidadSelectorProps {
  value: string // "" = todas
  onChange: (value: string) => void
  label?: string
}

export function EspecialidadSelector({
  value,
  onChange,
  label = "Especialidad",
}: EspecialidadSelectorProps) {
  const [especialidades, setEspecialidades] = useState<EspecialidadItem[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cargar especialidades una vez al montar (catálogo estático)
  useEffect(() => {
    let active = true
    setLoading(true)
    listarEspecialidades()
      .then((lista) => {
        if (!active) return
        setEspecialidades(lista)
        if (value && !lista.some((e) => e.especialidadId === value)) {
          onChange("")
        }
      })
      .catch(() => {
        if (active) setEspecialidades([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filtered = especialidades.filter(
    (esp) =>
      esp.nombre.toLowerCase().includes(search.toLowerCase()) ||
      esp.especialidadId.toLowerCase().includes(search.toLowerCase())
  )

  const getDisplayText = () => {
    if (loading) return "Cargando..."
    if (especialidades.length === 0) return "Sin especialidades disponibles"
    if (!value) return "Todas las especialidades"
    const esp = especialidades.find((e) => e.especialidadId === value)
    return esp ? `${esp.especialidadId} - ${esp.nombre}` : value
  }

  const handleSelect = (id: string) => {
    onChange(id)
    setOpen(false)
    setSearch("")
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-[#114C5F] mb-2">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 border border-[#9CD2D3] rounded-md bg-white text-sm text-[#114C5F] hover:border-[#4F9BB6] transition-all h-[38px]"
      >
        <span className="truncate">{getDisplayText()}</span>
        <ChevronDown
          className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-72 overflow-hidden">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar especialidad..."
                className="w-full pl-7 pr-7 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#4F9BB6]"
                autoFocus
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>
          <div className="overflow-y-auto max-h-52 p-1">
            <button
              type="button"
              onClick={() => handleSelect("")}
              className={`w-full text-left px-2 py-1.5 hover:bg-gray-50 rounded text-sm font-medium text-[#114C5F] ${
                !value ? "bg-blue-50" : ""
              }`}
            >
              Todas las especialidades
            </button>
            {filtered.map((esp) => (
              <button
                type="button"
                key={esp.especialidadId}
                onClick={() => handleSelect(esp.especialidadId)}
                className={`w-full text-left px-2 py-1.5 hover:bg-gray-50 rounded text-sm ${
                  value === esp.especialidadId ? "bg-blue-50" : ""
                }`}
              >
                <span className="font-mono text-xs text-gray-500 mr-1">
                  {esp.especialidadId}
                </span>
                <span className="truncate">{esp.nombre}</span>
              </button>
            ))}
            {filtered.length === 0 && !loading && (
              <p className="text-sm text-gray-500 text-center py-2">
                Sin resultados
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
