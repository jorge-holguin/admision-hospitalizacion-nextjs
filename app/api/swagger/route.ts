import { NextResponse } from 'next/server';
import { swaggerSpec } from '@/lib/swagger';

/**
 * GET /api/swagger
 * Retorna la especificación OpenAPI/Swagger en formato JSON
 * Útil para herramientas externas como Postman, Insomnia, etc.
 */
export async function GET() {
  return NextResponse.json(swaggerSpec, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
