import { NextRequest, NextResponse } from 'next/server';
import emergenciaService from '@/services/emergencia/emergenciaService';

/**
 * GET /api/emergencia
 * Endpoint para listar emergencias
 * Parámetros opcionales:
 * - month: Mes (1-12)
 * - year: Año (ej. 2025)
 * - search: Término de búsqueda
 * - page: Número de página (por defecto: 1)
 * - pageSize: Tamaño de página (por defecto: 10)
 * Si no se proporcionan mes y año, se usará el mes y año actual
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const search = searchParams.get('search');
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '10';
    
    // Convertir parámetros de paginación a números
    const pageNum = parseInt(page, 10);
    const pageSizeNum = parseInt(pageSize, 10);
    
    // Validar parámetros de paginación
    if (isNaN(pageNum) || isNaN(pageSizeNum) || pageNum < 1 || pageSizeNum < 1) {
      return NextResponse.json(
        { error: 'Parámetros de paginación inválidos' },
        { status: 400 }
      );
    }
    
    let emergencias;
    let total = 0;
    
    // Si se proporcionan mes y año, filtrar por esos valores
    if (month && year) {
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(year, 10);
      
      // Validar que los parámetros sean números válidos
      if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
        return NextResponse.json(
          { error: 'Parámetros de mes o año inválidos' },
          { status: 400 }
        );
      }
      
      // Obtener datos con paginación
      const result = await emergenciaService.listarEmergenciasPaginadas({
        month: monthNum,
        year: yearNum,
        searchTerm: search || undefined,
        page: pageNum,
        pageSize: pageSizeNum
      });
      
      emergencias = result.data;
      total = result.total;
    } else {
      // Si no se proporcionan parámetros de mes/año, usar el mes y año actual
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // getMonth() devuelve 0-11
      const currentYear = currentDate.getFullYear();
      
      // Obtener datos con paginación
      const result = await emergenciaService.listarEmergenciasPaginadas({
        month: currentMonth,
        year: currentYear,
        searchTerm: search || undefined,
        page: pageNum,
        pageSize: pageSizeNum
      });
      
      emergencias = result.data;
      total = result.total;
    }
    
    // Calcular el número total de páginas
    const totalPages = Math.ceil(total / pageSizeNum);
    
    return NextResponse.json({
      success: true,
      data: emergencias,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total,
        totalPages
      }
    });
  } catch (error: any) {
    console.error('Error en API de emergencia:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Error al listar emergencias' 
      },
      { status: 500 }
    );
  }
}
