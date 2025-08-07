import { PrismaClient, Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export interface HospitalizaData {
  IDHOSPITALIZACION: string;
  PACIENTE: string;
  NOMBRES: string;
  CONSULTORIO1: string;
  HORA1: string;
  FECHA1: string | Date;
  ORIGEN: string;
  SEGURO: string;
  MEDICO1: string;
  ESTADO: string;
  USUARIO: string;
  USUARIO_IMP?: string | null;
  DIAGNOSTICO: string;
  EDAD: string;
  ORIGENID: string;
  ACOMPANANTE_NOMBRE?: string;
  ACOMPANANTE_TELEFONO?: string;
  ACOMPANANTE_DIRECCION?: string;
}

class HospitalizaService {
  /**
   * Obtiene el último IDHOSPITALIZACION y genera uno nuevo incrementándolo
   */
  async getNextHospitalizacionId(): Promise<string> {
    try {
      // Buscar el último registro ordenado por IDHOSPITALIZACION de forma descendente
      // Usar raw query para evitar problemas con el ordenamiento de strings
      const result = await prisma.$queryRaw`
        SELECT TOP 1 IDHOSPITALIZACION 
        FROM HOSPITALIZA 
        ORDER BY LEN(IDHOSPITALIZACION) DESC, IDHOSPITALIZACION DESC
      `;
      
      // Convertir el resultado a un array para facilitar el manejo
      const records = result as any[];
      
      if (!records || records.length === 0) {
        // Si no hay registros, comenzar con un ID base
        console.log('No se encontraron registros de hospitalización, usando ID base');
        return '2500000001';
      }
      
      // Obtener el último ID
      const lastId = records[0].IDHOSPITALIZACION;
      console.log('Último ID de hospitalización encontrado:', lastId);
      
      // Asegurarse de que es un número y luego incrementarlo
      const lastIdNumber = parseInt(lastId, 10);
      if (isNaN(lastIdNumber)) {
        console.log('El ID no es un número válido, usando ID base');
        return '2500000001';
      }
      
      const nextId = lastIdNumber + 1;
      console.log('Siguiente ID de hospitalización generado:', nextId);
      
      // Devolver como string
      return nextId.toString();
    } catch (error) {
      console.error('Error al obtener el siguiente ID de hospitalización:', error);
      // Devolver un ID por defecto en caso de error
      return '2500000001';
    }
  }

  /**
   * Crea un nuevo registro de hospitalización
   */
  async create(data: HospitalizaData) {
    try {
      // Si no se proporciona un IDHOSPITALIZACION, generar uno nuevo
      if (!data.IDHOSPITALIZACION) {
        data.IDHOSPITALIZACION = await this.getNextHospitalizacionId();
      }
      
      // Convertir la fecha al formato correcto si es un string
      let fecha1 = data.FECHA1;
      if (typeof fecha1 === 'string') {
        // Verificar el formato de la fecha
        if (fecha1.includes('-')) {
          // Formato YYYY-MM-DD
          fecha1 = new Date(fecha1);
        } else if (fecha1.includes('/')) {
          // Formato DD/MM/YYYY
          const [day, month, year] = fecha1.split('/').map(Number);
          fecha1 = new Date(year, month - 1, day);
        } else {
          // Formato YYYYMMDD
          const year = parseInt(fecha1.substring(0, 4));
          const month = parseInt(fecha1.substring(4, 6)) - 1;
          const day = parseInt(fecha1.substring(6, 8));
          fecha1 = new Date(year, month, day);
        }
      }

      // Crear el registro en la base de datos usando SQL raw para evitar problemas con OFFSET
      // Preparar los campos y valores para la inserción
      const fields = [
        'IDHOSPITALIZACION', 'PACIENTE', 'NOMBRES', 'CONSULTORIO1', 'HORA1', 
        'FECHA1', 'ORIGEN', 'SEGURO', 'MEDICO1', 'ESTADO', 'USUARIO', 'USUARIO_IMP',
        'DIAGNOSTICO', 'EDAD', 'ORIGENID'
      ];
      
      // Añadir campos opcionales si existen
      if (data.ACOMPANANTE_NOMBRE) fields.push('ACOMPANANTE_NOMBRE');
      if (data.ACOMPANANTE_TELEFONO) fields.push('ACOMPANANTE_TELEFONO');
      if (data.ACOMPANANTE_DIRECCION) fields.push('ACOMPANANTE_DIRECCION');
      
      // Formatear la fecha para SQL Server (YYYYMMDD)
      const fechaSQL = fecha1 instanceof Date ? 
        `${fecha1.getFullYear()}${String(fecha1.getMonth() + 1).padStart(2, '0')}${String(fecha1.getDate()).padStart(2, '0')}` : 
        '20250731'; // Fecha por defecto si hay algún problema
      
      console.log('Fecha recibida:', data.FECHA1);
      console.log('Fecha convertida a objeto Date:', fecha1);
      console.log('Fecha formateada para SQL Server:', fechaSQL);
      
      // Construir la consulta SQL
      const fieldsStr = fields.join(', ');
      const placeholders = fields.map(() => '?').join(', ');
      
      // Preparar los valores en el mismo orden que los campos
      const values = [
        data.IDHOSPITALIZACION,
        data.PACIENTE,
        data.NOMBRES,
        data.CONSULTORIO1,
        data.HORA1,
        fechaSQL,
        data.ORIGEN,
        data.SEGURO,
        data.MEDICO1,
        data.ESTADO,
        data.USUARIO,
        data.USUARIO_IMP || data.USUARIO, // Usar USUARIO como valor predeterminado si USUARIO_IMP no está definido
        data.DIAGNOSTICO,
        data.EDAD,
        data.ORIGENID
      ];
      
      // Añadir valores opcionales en el mismo orden
      if (data.ACOMPANANTE_NOMBRE) values.push(data.ACOMPANANTE_NOMBRE);
      if (data.ACOMPANANTE_TELEFONO) values.push(data.ACOMPANANTE_TELEFONO);
      if (data.ACOMPANANTE_DIRECCION) values.push(data.ACOMPANANTE_DIRECCION);
      
      // Crear una consulta SQL con valores interpolados directamente
      // Esto es menos seguro que los marcadores de posición, pero SQL Server tiene limitaciones
      const valuesStr = values.map((v, index) => {
        if (v === null || v === undefined) return 'NULL';
        // Si es el campo FECHA1 (que es el 6to campo), usar formato especial para SQL Server
        if (index === 5) {
          // Para FECHA1, usamos el formato YYYYMMDD sin comillas
          return fechaSQL;
        }
        if (typeof v === 'string') return `N'${v.replace(/'/g, "''")}'`; // Escapar comillas simples
        if (typeof v === 'object' && v !== null && 'toISOString' in v) return `'${(v as Date).toISOString()}'`;
        return v; // Números y otros tipos
      }).join(', ');
      
      // Construir la consulta SQL completa para depuración
      const sqlCompleto = `INSERT INTO HOSPITALIZA (${fieldsStr}) VALUES (${valuesStr});`;
      console.log('Consulta SQL completa:', sqlCompleto);
      
      // Para SQL Server 2008 R2, intentemos usar un formato diferente para la fecha
      // Reemplazar el valor de FECHA1 en valuesStr con un formato compatible con SQL Server 2008
      const fechaSQLServer = `CONVERT(DATETIME, '${fechaSQL}', 112)`; // 112 es el código para formato YYYYMMDD
      
      // Encontrar la posición del valor de fecha en valuesStr y reemplazarlo
      const valuesArray = valuesStr.split(', ');
      if (valuesArray.length > 5) { // FECHA1 es el 6to campo (índice 5)
        valuesArray[5] = fechaSQLServer;
      }
      const nuevoValuesStr = valuesArray.join(', ');
      
      console.log('Valores modificados para SQL Server 2008:', nuevoValuesStr);
      
      // Ejecutar la consulta SQL raw con los valores interpolados y CONVERT para la fecha
      await prisma.$executeRaw`
        INSERT INTO HOSPITALIZA (${Prisma.raw(fieldsStr)})
        VALUES (${Prisma.raw(nuevoValuesStr)});
      `;
      
      // Buscar el registro recién creado para devolverlo usando SQL raw en lugar de findUnique
      // para evitar problemas con OFFSET en SQL Server 2008 R2
      const idHospitalizacion = data.IDHOSPITALIZACION;
      console.log('Buscando registro creado con ID:', idHospitalizacion);
      
      const resultados = await prisma.$queryRaw`
        SELECT TOP 1 * FROM HOSPITALIZA 
        WHERE IDHOSPITALIZACION = ${idHospitalizacion}
      `;
      
      // Convertir el resultado a un objeto similar al que devolvería findUnique
      const result = Array.isArray(resultados) && resultados.length > 0 ? resultados[0] : null;
      console.log('Registro encontrado:', result ? 'Sí' : 'No');

      return result;
    } catch (error) {
      console.error('Error al crear hospitalización:', error);
      throw error;
    }
  }

  /**
   * Obtiene un registro de hospitalización por su ID
   */
  async findById(id: string) {
    try {
      const hospitalizacion = await prisma.hOSPITALIZA.findUnique({
        where: {
          IDHOSPITALIZACION: id
        }
      });
      return hospitalizacion;
    } catch (error) {
      console.error('Error al buscar hospitalización:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los registros de hospitalización
   */
  async findAll() {
    try {
      const hospitalizaciones = await prisma.hOSPITALIZA.findMany();
      return hospitalizaciones;
    } catch (error) {
      console.error('Error al obtener hospitalizaciones:', error);
      throw error;
    }
  }
  
  /**
   * Obtiene el siguiente ID de hospitalización para mostrar en el frontend
   */
  async getNextId() {
    try {
      const nextId = await this.getNextHospitalizacionId();
      return { nextId };
    } catch (error) {
      console.error('Error al obtener el siguiente ID:', error);
      throw error;
    }
  }
  
  /**
   * Elimina un registro de hospitalización por su ID
   */
  async deleteById(id: string) {
    try {
      console.log(`Eliminando hospitalización con ID: ${id}`);
      
      // Usar SQL raw para evitar problemas con SQL Server 2008 R2
      const resultado = await prisma.$executeRaw`
        DELETE FROM HOSPITALIZA 
        WHERE IDHOSPITALIZACION = ${id}
      `;
      
      console.log(`Resultado de eliminación: ${resultado}`);
      return { success: true, message: `Hospitalización ${id} eliminada correctamente` };
    } catch (error) {
      console.error(`Error al eliminar hospitalización ${id}:`, error);
      throw error;
    }
  }
}

export default new HospitalizaService();
