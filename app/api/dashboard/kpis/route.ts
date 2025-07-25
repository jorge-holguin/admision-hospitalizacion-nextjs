import { NextResponse } from 'next/server';
import { dashboardService } from '@/services/dashboardService';

export async function GET() {
  try {
    // Obtener todos los KPIs en paralelo para mejorar el rendimiento
    const [
      totalCitas,
      totalHospitalizaciones,
      nuevosIngresosHoy,
      totalAltasMedicas
    ] = await Promise.all([
      dashboardService.getTotalCitas(),
      dashboardService.getTotalHospitalizaciones(),
      dashboardService.getNuevosIngresosHoy(),
      dashboardService.getTotalAltasMedicas()
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalCitas: totalCitas.TotalRegistros || 0,
        totalHospitalizaciones: totalHospitalizaciones.TotalRegistros || 0,
        nuevosIngresosHoy: nuevosIngresosHoy.TotalRegistros || 0,
        totalAltasMedicas: totalAltasMedicas.TotalRegistros || 0
      }
    });
  } catch (error: any) {
    console.error('Error al obtener KPIs del dashboard:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error al obtener KPIs del dashboard' 
      },
      { status: 500 }
    );
  }
}
