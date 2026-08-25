"use client"

import { useState, useEffect } from "react"
import { FiliacionFilter } from "@/services/hospitalizacion/filiacionService"
import { API_ENDPOINTS, API_SPRING_URL } from "@/lib/api-config"

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
          const tipoDoc = (filter.tipoDocumento || 'D').trim()
          const numeroDoc = filter.documento.trim()

          // Validaciones específicas para DNI
          if (tipoDoc === 'D' || tipoDoc === 'DNI') {
            if (numeroDoc.length > 8) {
              throw new Error('El DNI debe tener como máximo 8 dígitos')
            }
            if (!/^\d{1,8}$/.test(numeroDoc)) {
              throw new Error('El DNI debe contener solo hasta 8 dígitos numéricos')
            }
          }

          params.append("documento", numeroDoc)
        }

        if (filter.nombres && filter.nombres.trim() !== '') {
          params.append("nombres", filter.nombres.trim())
        }
      }

      // Documento → nueva API optimizada
      let url
      if (filter.documento && filter.documento.trim() !== '' && !filter.historia) {
        const tipoDoc = (filter.tipoDocumento || 'D').trim()
        const p = new URLSearchParams({ tipoDocumento: tipoDoc, documento: filter.documento.trim() })
        url = `${API_ENDPOINTS.filiation.searchByDocument}?${p}`
      } else if (filter.nombres && filter.nombres.trim() !== '' && !filter.historia) {
        url = `${API_ENDPOINTS.filiation.searchByName}?nombres=${encodeURIComponent(filter.nombres.trim())}`
      } else {
        url = `${API_ENDPOINTS.filiation.search}?${params.toString()}`
      }

      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000) // 10 segundos de timeout
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || errorData.details || "Error al obtener datos de filiación")
      }

      const contentLength = response.headers.get('content-length')
      if (response.status === 204 || contentLength === '0' || !response.body) {
        setData([])
        setPagination(prev => ({ ...prev, total: 0, totalPages: 0 }))
        return
      }

      const raw = await response.json().catch((err) => {
        console.error('Error parseando respuesta JSON:', err)
        return null
      })

      // Normalizar respuesta: nueva API devuelve objeto único, array o { data: [...] }
      let list: any[]
      if (Array.isArray(raw)) {
        list = raw
      } else if (Array.isArray(raw?.data)) {
        list = raw.data
      } else if (Array.isArray(raw?.pacientes)) {
        list = raw.pacientes
      } else if (Array.isArray(raw?.content)) {
        list = raw.content
      } else if (raw && !raw.error && (raw.PACIENTE || raw.paciente)) {
        list = [raw]
      } else {
        list = []
      }

      const syntheticPagination = raw?.pagination ?? {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: list.length,
        totalPages: Math.ceil(list.length / pagination.pageSize),
      }

      setData(list)
      setPagination(syntheticPagination)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      setError(errorMessage)
      console.error("Error fetching filiacion data:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch data when pagination or filters change (only if we have filters)
  useEffect(() => {
    // Solo hacer la llamada si tenemos filtros activos
    const hasActiveFilters = filter && (
      (filter.historia && filter.historia.trim() !== '') ||
      (filter.documento && filter.documento.trim() !== '') ||
      (filter.nombres && filter.nombres.trim() !== '')
    );
    
    if (hasActiveFilters) {
      fetchFiliacion()
    }
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

  // Función manual para buscar (llamar explícitamente)
  const search = async (searchFilter?: FiliacionFilter) => {
    if (searchFilter) {
      setFilter(searchFilter)
      setPagination((prev: PaginationState) => ({ ...prev, page: 1 }))
    }
    await fetchFiliacion()
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
      // Nota: El endpoint de count puede no existir en la API Spring Boot
      // Usamos el search normal y contamos los resultados
      const url = `${API_ENDPOINTS.filiation.search}?${params.toString()}`
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || errorData.details || "Error al contar registros de filiación")
      }

      const result = await response.json()
      // La API Spring Boot devuelve array directo o {data: [...]}
      const data = Array.isArray(result) ? result : (result.data || [])
      const count = data.length
      setCountResult((prev: CountResult) => ({ ...prev, count, isLoading: false }))
      return count
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
    search,
  }
}
