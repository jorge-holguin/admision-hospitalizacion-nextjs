"use client"

import { useState, useEffect } from "react"
import { FiliacionFilter } from "@/services/hospitalizacion/filiacionService"

interface Filiacion {
  PACIENTE: string
  HISTORIA?: string
  NOMBRES?: string
  SEXO?: string
  DOCUMENTO?: string
  PATERNO?: string
  MATERNO?: string
  NOMBRE?: string
  FECHA_NACIMIENTO?: Date
  EDAD?: number
  DIRECCION?: string
  TELEFONO1?: string
  NOMBRE_SEGURO?: string
  [key: string]: any // Allow for other properties
}

interface PaginationState {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

interface FiliacionResponse {
  data: Filiacion[]
  pagination: PaginationState
}

interface CountResult {
  count: number;
  isLoading: boolean;
  error: string | null;
}

export function useFiliacion() {
  const [data, setData] = useState<Filiacion[]>([])
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FiliacionFilter>({})
  const [countResult, setCountResult] = useState<CountResult>({
    count: 0,
    isLoading: false,
    error: null
  })

  const fetchFiliacion = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Build query parameters
      const params = new URLSearchParams()
      params.append("page", pagination.page.toString())
      params.append("pageSize", pagination.pageSize.toString())

      // Add filter parameters if they exist and are not empty
      if (filter) {
        if (filter.historia && filter.historia.trim() !== '') {
          params.append("historia", filter.historia.trim())
        }

        if (filter.documento && filter.documento.trim() !== '') {
          params.append("documento", filter.documento.trim())
        }

        if (filter.nombres && filter.nombres.trim() !== '') {
          params.append("nombres", filter.nombres.trim())
        }
      }

      const response = await fetch(`/api/filiacion?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || errorData.details || "Error al obtener datos de filiación")
      }

      const result: FiliacionResponse = await response.json()
      
      if (!result.data || !Array.isArray(result.data)) {
        throw new Error("Formato de respuesta inválido")
      }
      
      setData(result.data)
      setPagination(result.pagination)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      setError(errorMessage)
      console.error("Error fetching filiacion data:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch data when pagination or filters change
  useEffect(() => {
    fetchFiliacion()
  }, [pagination.page, pagination.pageSize, filter])

  const handlePageChange = (page: number) => {
    setPagination((prev: PaginationState) => ({ ...prev, page }))
  }

  const handlePageSizeChange = (pageSize: number) => {
    setPagination((prev: PaginationState) => ({ ...prev, page: 1, pageSize }))
  }

  const handleFilterChange = (newFilter: FiliacionFilter) => {
    setFilter(newFilter)
    setPagination((prev: PaginationState) => ({ ...prev, page: 1 })) // Reset to first page
  }

  const fetchCount = async (countFilter: FiliacionFilter = {}) => {
    setCountResult((prev: CountResult) => ({ ...prev, isLoading: true, error: null }))

    try {
      // Build query parameters
      const params = new URLSearchParams()

      // Add filter parameters if they exist and are not empty
      if (countFilter) {
        if (countFilter.historia && countFilter.historia.trim() !== '') {
          params.append("historia", countFilter.historia.trim())
        }

        if (countFilter.documento && countFilter.documento.trim() !== '') {
          params.append("documento", countFilter.documento.trim())
        }

        if (countFilter.nombres && countFilter.nombres.trim() !== '') {
          params.append("nombres", countFilter.nombres.trim())
        }
      }

      console.log('Fetching count with params:', params.toString())
      const response = await fetch(`/api/filiacion/count?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || errorData.details || "Error al contar registros de filiación")
      }

      const result = await response.json()
      setCountResult((prev: CountResult) => ({ ...prev, count: result.count || 0, isLoading: false }))
      return result.count || 0
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      setCountResult((prev: CountResult) => ({ ...prev, error: errorMessage, isLoading: false }))
      console.error("Error counting filiacion data:", err)
      return 0
    }
  }

  const refreshData = () => {
    fetchFiliacion()
  }

  return {
    data,
    pagination,
    isLoading,
    error,
    countResult,
    handlePageChange,
    handlePageSizeChange,
    handleFilterChange,
    fetchCount,
    refreshData,
  }
}
