import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { serializeBigInt } from '@/lib/utils'

export async function GET(req: NextRequest) {
  try {
    console.log('Testing filiacion2 database view fields')
    
    // Use a test ID that exists in your database
    const testId = '1'
    const safeId = testId.replace(/'/g, "''")
    
    // Direct query to the database view
    const query = `SELECT TOP 1 * FROM V_FILIACION2 WHERE PACIENTE = '${safeId}'`
    console.log('Executing query:', query)
    
    const result = await prisma.$queryRawUnsafe(query)
    
    if (!result || !Array.isArray(result) || result.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No data found for the test ID'
      })
    }
    
    const record = {...result[0]}
    
    // Check if the required fields are present
    const requiredFields = ['TIPO_DOCUMENTO', 'LOCALIDAD', 'TELEFONO2', 'SEGURO']
    const fieldStatus = {}
    
    requiredFields.forEach(field => {
      fieldStatus[field] = {
        present: record[field] !== undefined,
        value: record[field]
      }
    })
    
    // Log all available fields
    const allFields = Object.keys(record)
    
    return NextResponse.json({
      success: true,
      fieldStatus,
      allFields,
      // Include a sample of the data for verification
      sampleData: serializeBigInt({
        PACIENTE: record.PACIENTE,
        HISTORIA: record.HISTORIA,
        NOMBRES: record.NOMBRES,
        // Include the fields we're checking
        TIPO_DOCUMENTO: record.TIPO_DOCUMENTO,
        LOCALIDAD: record.LOCALIDAD,
        TELEFONO2: record.TELEFONO2,
        SEGURO: record.SEGURO
      })
    })
  } catch (error) {
    console.error('Error testing filiacion fields:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      error: error instanceof Error ? error.stack : 'No stack trace available'
    }, { status: 500 })
  }
}
