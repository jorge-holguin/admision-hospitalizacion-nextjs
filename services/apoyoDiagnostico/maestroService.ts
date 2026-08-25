/**
 * Servicio para consultar el maestro de exámenes de apoyo diagnóstico
 * y verificar el campo PEDIDO que indica si un examen requiere orden/pedido previo.
 */

export interface MaestroExamen {
  codigo: string
  grupo: string
  descripcion: string
  estado: boolean
  cpms: string | null
  item: string | null
  item2: string | null
  pedido: boolean
}

const APOYO_DIAGNOSTICO_BASE_URL = process.env.NEXT_PUBLIC_API_APOYO_DIAGNOSTICO_URL || 'http://192.168.5.239:9020'

function normalizeMaestroExamen(raw: any): MaestroExamen | null {
  if (!raw || typeof raw !== 'object') return null
  const codigo = (raw.codigo ?? '').toString().trim()
  const cpms = (raw.cpms ?? '').toString().trim()
  const key = codigo || cpms
  if (!key) return null
  const activo = raw.activo ?? raw.estado
  const pedidoRaw = raw.pedido ?? raw.PEDIDO
  return {
    codigo: key,
    cpms: cpms || codigo,
    grupo: (raw.grupo ?? '').toString().trim(),
    descripcion: (raw.descripcion ?? '').toString().trim(),
    estado: activo === true || activo === 1 || activo === '1',
    item: raw.item != null ? String(raw.item) : null,
    item2: raw.item2 != null ? String(raw.item2) : null,
    pedido: pedidoRaw === true || pedidoRaw === 1 || pedidoRaw === '1',
  }
}

/**
 * Consulta un examen del maestro por su código CPMS.
 */
export async function fetchMaestroExamenByCpms(cpms: string): Promise<MaestroExamen | null> {
  if (!cpms?.trim()) return null
  try {
    const base = APOYO_DIAGNOSTICO_BASE_URL.replace(/\/+$/, '')
    const res = await fetch(`${base}/api/maestros/cpms/${encodeURIComponent(cpms.trim())}`)
    if (!res.ok) {
      console.warn(`⚠️ No se pudo consultar maestro para CPMS ${cpms}: ${res.status}`)
      return null
    }
    const json = await res.json()
    const raw: unknown[] = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []
    for (const item of raw) {
      const examen = normalizeMaestroExamen(item)
      if (examen) return examen
    }
    return null
  } catch (error) {
    console.error(`❌ Error consultando maestro para CPMS ${cpms}:`, error)
    return null
  }
}

interface DetalleConCpms {
  cpms?: string
  cpmsDescripcion?: string
  idProcedimiento?: number
}

/**
 * Verifica si algún examen de los detalles tiene el campo PEDIDO = 1.
 * Retorna la lista de exámenes bloqueantes.
 */
export async function verificarExamenesConPedido(
  detalles: DetalleConCpms[]
): Promise<{ bloqueado: boolean; examenes: { cpms: string; descripcion: string }[] }> {
  const examenesBloqueantes: { cpms: string; descripcion: string }[] = []

  const cpmsList = detalles
    .filter((d) => d.cpms?.trim() || d.idProcedimiento)
    .map((d) => ({
      cpms: (d.cpms?.trim() || String(d.idProcedimiento)).trim(),
      descripcion: d.cpmsDescripcion?.trim() || `CPMS ${d.cpms || d.idProcedimiento}`,
    }))

  // Consultar en paralelo
  const resultados = await Promise.all(
    cpmsList.map(async (item) => {
      const maestro = await fetchMaestroExamenByCpms(item.cpms)
      return { ...item, maestro }
    })
  )

  for (const r of resultados) {
    if (r.maestro?.pedido) {
      examenesBloqueantes.push({
        cpms: r.cpms,
        descripcion: r.maestro.descripcion || r.descripcion,
      })
    }
  }

  return {
    bloqueado: examenesBloqueantes.length > 0,
    examenes: examenesBloqueantes,
  }
}
