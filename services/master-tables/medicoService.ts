import { prisma } from '@/lib/prisma';

// Normalizador para filas de Médico provenientes de SQL Server/Prisma
function normalizeMedico(row: any): Medico {
  // ACTIVO puede venir como Decimal/BigInt/objeto; normalizar a '1' o '0'
  const rawActivo = (row?.ACTIVO ?? '').toString();
  const activo = rawActivo === '1' || rawActivo.toUpperCase?.() === 'S' ? '1' : '0';

  return {
    ID_MEDICO: typeof row.ID_MEDICO === 'bigint' ? Number(row.ID_MEDICO) : row.ID_MEDICO,
    MEDICO: row.MEDICO?.toString?.() ?? row.MEDICO,
    NOMBRE: row.NOMBRE?.toString?.() ?? row.NOMBRE,
    DNI: row.DNI?.toString?.() ?? row.DNI,
    EESS: row.EESS?.toString?.() ?? row.EESS,
    ABREVIATURA: row.ABREVIATURA?.toString?.() ?? row.ABREVIATURA,
    COLEGIO: row.COLEGIO?.toString?.() ?? row.COLEGIO,
    COLESP: row.COLESP?.toString?.() ?? row.COLESP,
    ESPECIALIDAD: row.ESPECIALIDAD?.toString?.() ?? row.ESPECIALIDAD,
    CONSULTORIO: row.CONSULTORIO ? String(row.CONSULTORIO).trim() : row.CONSULTORIO,
    CODHIS: row.CODHIS?.toString?.() ?? row.CODHIS,
    CONTRATO: row.CONTRATO?.toString?.() ?? row.CONTRATO,
    ACTIVO: activo,
    IMPCITA: row.IMPCITA?.toString?.() ?? row.IMPCITA,
    PROFESION_COLEGIO: row.PROFESION_COLEGIO?.toString?.() ?? row.PROFESION_COLEGIO,
    FECHNAC: row.FECHNAC?.toString?.() ?? row.FECHNAC,
    GENERO: row.GENERO?.toString?.() ?? row.GENERO,
    ESPECIALIDAD2: row.ESPECIALIDAD2?.toString?.() ?? row.ESPECIALIDAD2,
    CONSULTORIO2: row.CONSULTORIO2?.toString?.() ?? row.CONSULTORIO2,
    PROFESION_COLEGIO2: row.PROFESION_COLEGIO2?.toString?.() ?? row.PROFESION_COLEGIO2,
    // Campos con descripciones (JOINs)
    CONSULTORIO_NOMBRE: row.CONSULTORIO_NOMBRE?.toString?.() ?? row.CONSULTORIO_NOMBRE,
    ESPECIALIDAD_NOMBRE: row.ESPECIALIDAD_NOMBRE?.toString?.() ?? row.ESPECIALIDAD_NOMBRE,
    PROFESION_NOMBRE: row.PROFESION_NOMBRE?.toString?.() ?? row.PROFESION_NOMBRE,
    COLEGIO_NOMBRE: row.COLEGIO_NOMBRE?.toString?.() ?? row.COLEGIO_NOMBRE,
    CONSULTORIO2_NOMBRE: row.CONSULTORIO2_NOMBRE?.toString?.() ?? row.CONSULTORIO2_NOMBRE,
    ESPECIALIDAD2_NOMBRE: row.ESPECIALIDAD2_NOMBRE?.toString?.() ?? row.ESPECIALIDAD2_NOMBRE,
    PROFESION_COLEGIO2_NOMBRE: row.PROFESION_COLEGIO2_NOMBRE?.toString?.() ?? row.PROFESION_COLEGIO2_NOMBRE,
    // Legacy fields for compatibility
    NOMBRES: row.NOMBRES?.toString?.() ?? row.NOMBRES,
    APATERNO: row.APATERNO?.toString?.() ?? row.APATERNO,
    AMATERNO: row.AMATERNO?.toString?.() ?? row.AMATERNO,
    TIPO_DOCUMENTO: row.TIPO_DOCUMENTO?.toString?.() ?? row.TIPO_DOCUMENTO,
    PAIS: row.PAIS?.toString?.() ?? row.PAIS,
    USUARIO: row.USUARIO?.toString?.() ?? row.USUARIO,
  } as Medico;
}

export interface Medico {
  ID_MEDICO?: number;
  MEDICO: string;
  NOMBRE: string;
  DNI?: string;
  EESS?: string;
  ABREVIATURA?: string;
  COLEGIO?: string;
  COLESP?: string;
  ESPECIALIDAD?: string;
  CONSULTORIO?: string;
  CODHIS?: string;
  CONTRATO?: string;
  ACTIVO: string;
  IMPCITA?: string;
  PROFESION_COLEGIO?: string;
  FECHNAC?: string;
  GENERO?: string;
  ESPECIALIDAD2?: string;
  CONSULTORIO2?: string;
  PROFESION_COLEGIO2?: string;
  // Campos con descripciones (JOINs)
  CONSULTORIO_NOMBRE?: string;
  ESPECIALIDAD_NOMBRE?: string;
  PROFESION_NOMBRE?: string;
  COLEGIO_NOMBRE?: string;
  CONSULTORIO2_NOMBRE?: string;
  ESPECIALIDAD2_NOMBRE?: string;
  PROFESION_COLEGIO2_NOMBRE?: string;
  // Legacy fields for compatibility
  NOMBRES?: string;
  APATERNO?: string;
  AMATERNO?: string;
  TIPO_DOCUMENTO?: string;
  PAIS?: string;
  USUARIO?: string;
  [key: string]: any;
}

export interface MedicoFilters {
  search?: string;
  consultorio?: string;
  nombre?: string;
  dni?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Server-side service for API routes
export const medicoServerService = {
  async getMedicos(
    page: number = 1,
    pageSize: number = 10,
    filters: MedicoFilters = {}
  ): Promise<PaginatedResponse<Medico>> {
    const skip = (page - 1) * pageSize;
    const startRow = skip + 1;
    const endRow = page * pageSize;
    const { search, consultorio, nombre, dni } = filters;

    try {
      let totalResult: any;
      let medicos: any;

      if (search && !consultorio && !nombre && !dni) {
        // Búsqueda general
        totalResult = await prisma.$queryRaw`
          SELECT COUNT(*) as total FROM MEDICO 
          WHERE NOMBRE LIKE ${`%${search}%`} 
          OR MEDICO LIKE ${`%${search}%`}
          OR DNI LIKE ${`%${search}%`}
        `;
        medicos = await prisma.$queryRaw`
          WITH CTE AS (
            SELECT 
              M.ID_MEDICO, M.MEDICO, M.NOMBRE, M.DNI, M.EESS, M.ABREVIATURA, M.COLEGIO, M.COLESP,
              M.ESPECIALIDAD, M.CONSULTORIO, M.CODHIS, M.CONTRATO, M.ACTIVO, M.IMPCITA, M.PROFESION_COLEGIO,
              M.FECHNAC, M.GENERO, M.ESPECIALIDAD2, M.CONSULTORIO2, M.PROFESION_COLEGIO2,
              M.NOMBRES, M.APATERNO, M.AMATERNO, M.TIPO_DOCUMENTO, M.PAIS, M.USUARIO,
              C.NOMBRE AS CONSULTORIO_NOMBRE,
              E.NOMBRE AS ESPECIALIDAD_NOMBRE,
              P.Profesion AS PROFESION_NOMBRE,
              P.Colegio AS COLEGIO_NOMBRE,
              C2.NOMBRE AS CONSULTORIO2_NOMBRE,
              E2.NOMBRE AS ESPECIALIDAD2_NOMBRE,
              P2.Profesion AS PROFESION_COLEGIO2_NOMBRE,
              ROW_NUMBER() OVER (ORDER BY M.NOMBRE) AS RowNum
            FROM MEDICO M
            LEFT JOIN CONSULTORIO C ON M.CONSULTORIO = C.Consultorio
            LEFT JOIN ESPECIALIDAD E ON M.ESPECIALIDAD = E.ESPECIALIDAD
            LEFT JOIN ProfesionesColegio P ON M.PROFESION_COLEGIO = P.id_profesion
            LEFT JOIN CONSULTORIO C2 ON M.CONSULTORIO2 = C2.Consultorio
            LEFT JOIN ESPECIALIDAD E2 ON M.ESPECIALIDAD2 = E2.ESPECIALIDAD
            LEFT JOIN ProfesionesColegio P2 ON M.PROFESION_COLEGIO2 = P2.id_profesion
            WHERE M.NOMBRE LIKE ${`%${search}%`} 
              OR M.MEDICO LIKE ${`%${search}%`}
              OR M.DNI LIKE ${`%${search}%`}
          )
          SELECT * FROM CTE
          WHERE RowNum BETWEEN ${startRow} AND ${endRow}
          ORDER BY RowNum
        `;
      } else if (!search && consultorio && !nombre && !dni) {
        // Filtro por consultorio
        totalResult = await prisma.$queryRaw`
          SELECT COUNT(*) as total FROM MEDICO WHERE CONSULTORIO = ${consultorio}
        `;
        medicos = await prisma.$queryRaw`
          WITH CTE AS (
            SELECT 
              M.ID_MEDICO, M.MEDICO, M.NOMBRE, M.DNI, M.EESS, M.ABREVIATURA, M.COLEGIO, M.COLESP,
              M.ESPECIALIDAD, M.CONSULTORIO, M.CODHIS, M.CONTRATO, M.ACTIVO, M.IMPCITA, M.PROFESION_COLEGIO, M.FECHNAC, M.GENERO, M.ESPECIALIDAD2, M.CONSULTORIO2, M.PROFESION_COLEGIO2,
              M.NOMBRES, M.APATERNO, M.AMATERNO, M.TIPO_DOCUMENTO, M.PAIS, M.USUARIO,
              C.NOMBRE AS CONSULTORIO_NOMBRE,
              E.NOMBRE AS ESPECIALIDAD_NOMBRE,
              P.Profesion AS PROFESION_NOMBRE,
              P.Colegio AS COLEGIO_NOMBRE,
              C2.NOMBRE AS CONSULTORIO2_NOMBRE,
              E2.NOMBRE AS ESPECIALIDAD2_NOMBRE,
              P2.Profesion AS PROFESION_COLEGIO2_NOMBRE,
              ROW_NUMBER() OVER (ORDER BY M.NOMBRE) AS RowNum
            FROM MEDICO M
            LEFT JOIN CONSULTORIO C ON M.CONSULTORIO = C.Consultorio
            LEFT JOIN ESPECIALIDAD E ON M.ESPECIALIDAD = E.ESPECIALIDAD
            LEFT JOIN ProfesionesColegio P ON M.PROFESION_COLEGIO = P.id_profesion
            LEFT JOIN CONSULTORIO C2 ON M.CONSULTORIO2 = C2.Consultorio
            LEFT JOIN ESPECIALIDAD E2 ON M.ESPECIALIDAD2 = E2.ESPECIALIDAD
            LEFT JOIN ProfesionesColegio P2 ON M.PROFESION_COLEGIO2 = P2.id_profesion
            WHERE M.CONSULTORIO = ${consultorio}
          )
          SELECT * FROM CTE
          WHERE RowNum BETWEEN ${startRow} AND ${endRow}
          ORDER BY RowNum
        `;
      } else if (!search && !consultorio && nombre && !dni) {
        // Filtro por nombre
        totalResult = await prisma.$queryRaw`
          SELECT COUNT(*) as total FROM MEDICO WHERE NOMBRE LIKE ${`%${nombre}%`}
        `;
        medicos = await prisma.$queryRaw`
          WITH CTE AS (
            SELECT 
              M.ID_MEDICO, M.MEDICO, M.NOMBRE, M.DNI, M.EESS, M.ABREVIATURA, M.COLEGIO, M.COLESP,
              M.ESPECIALIDAD, M.CONSULTORIO, M.CODHIS, M.CONTRATO, M.ACTIVO, M.IMPCITA, M.PROFESION_COLEGIO, M.FECHNAC, M.GENERO, M.ESPECIALIDAD2, M.CONSULTORIO2, M.PROFESION_COLEGIO2,
              M.NOMBRES, M.APATERNO, M.AMATERNO, M.TIPO_DOCUMENTO, M.PAIS, M.USUARIO,
              C.NOMBRE AS CONSULTORIO_NOMBRE,
              E.NOMBRE AS ESPECIALIDAD_NOMBRE,
              P.Profesion AS PROFESION_NOMBRE,
              P.Colegio AS COLEGIO_NOMBRE,
              C2.NOMBRE AS CONSULTORIO2_NOMBRE,
              E2.NOMBRE AS ESPECIALIDAD2_NOMBRE,
              P2.Profesion AS PROFESION_COLEGIO2_NOMBRE,
              ROW_NUMBER() OVER (ORDER BY M.NOMBRE) AS RowNum
            FROM MEDICO M
            LEFT JOIN CONSULTORIO C ON M.CONSULTORIO = C.Consultorio
            LEFT JOIN ESPECIALIDAD E ON M.ESPECIALIDAD = E.ESPECIALIDAD
            LEFT JOIN ProfesionesColegio P ON M.PROFESION_COLEGIO = P.id_profesion
            LEFT JOIN CONSULTORIO C2 ON M.CONSULTORIO2 = C2.Consultorio
            LEFT JOIN ESPECIALIDAD E2 ON M.ESPECIALIDAD2 = E2.ESPECIALIDAD
            LEFT JOIN ProfesionesColegio P2 ON M.PROFESION_COLEGIO2 = P2.id_profesion
            WHERE M.NOMBRE LIKE ${`%${nombre}%`}
          )
          SELECT * FROM CTE
          WHERE RowNum BETWEEN ${startRow} AND ${endRow}
          ORDER BY RowNum
        `;
      } else if (!search && !consultorio && !nombre && dni) {
        // Filtro por DNI
        totalResult = await prisma.$queryRaw`
          SELECT COUNT(*) as total FROM MEDICO WHERE DNI LIKE ${`%${dni}%`}
        `;
        medicos = await prisma.$queryRaw`
          WITH CTE AS (
            SELECT 
              M.ID_MEDICO, M.MEDICO, M.NOMBRE, M.DNI, M.EESS, M.ABREVIATURA, M.COLEGIO, M.COLESP,
              M.ESPECIALIDAD, M.CONSULTORIO, M.CODHIS, M.CONTRATO, M.ACTIVO, M.IMPCITA, M.PROFESION_COLEGIO, M.FECHNAC, M.GENERO, M.ESPECIALIDAD2, M.CONSULTORIO2, M.PROFESION_COLEGIO2,
              M.NOMBRES, M.APATERNO, M.AMATERNO, M.TIPO_DOCUMENTO, M.PAIS, M.USUARIO,
              C.NOMBRE AS CONSULTORIO_NOMBRE,
              E.NOMBRE AS ESPECIALIDAD_NOMBRE,
              P.Profesion AS PROFESION_NOMBRE,
              P.Colegio AS COLEGIO_NOMBRE,
              C2.NOMBRE AS CONSULTORIO2_NOMBRE,
              E2.NOMBRE AS ESPECIALIDAD2_NOMBRE,
              P2.Profesion AS PROFESION_COLEGIO2_NOMBRE,
              ROW_NUMBER() OVER (ORDER BY M.NOMBRE) AS RowNum
            FROM MEDICO M
            LEFT JOIN CONSULTORIO C ON M.CONSULTORIO = C.Consultorio
            LEFT JOIN ESPECIALIDAD E ON M.ESPECIALIDAD = E.ESPECIALIDAD
            LEFT JOIN ProfesionesColegio P ON M.PROFESION_COLEGIO = P.id_profesion
            LEFT JOIN CONSULTORIO C2 ON M.CONSULTORIO2 = C2.Consultorio
            LEFT JOIN ESPECIALIDAD E2 ON M.ESPECIALIDAD2 = E2.ESPECIALIDAD
            LEFT JOIN ProfesionesColegio P2 ON M.PROFESION_COLEGIO2 = P2.id_profesion
            WHERE M.DNI LIKE ${`%${dni}%`}
          )
          SELECT * FROM CTE
          WHERE RowNum BETWEEN ${startRow} AND ${endRow}
          ORDER BY RowNum
        `;
      } else {
        // Sin filtros
        totalResult = await prisma.$queryRaw`SELECT COUNT(*) as total FROM MEDICO`;
        medicos = await prisma.$queryRaw`
          WITH CTE AS (
            SELECT 
              M.ID_MEDICO, M.MEDICO, M.NOMBRE, M.DNI, M.EESS, M.ABREVIATURA, M.COLEGIO, M.COLESP,
              M.ESPECIALIDAD, M.CONSULTORIO, M.CODHIS, M.CONTRATO, M.ACTIVO, M.IMPCITA, M.PROFESION_COLEGIO, M.FECHNAC, M.GENERO, M.ESPECIALIDAD2, M.CONSULTORIO2, M.PROFESION_COLEGIO2,
              M.NOMBRES, M.APATERNO, M.AMATERNO, M.TIPO_DOCUMENTO, M.PAIS, M.USUARIO,
              C.NOMBRE AS CONSULTORIO_NOMBRE,
              E.NOMBRE AS ESPECIALIDAD_NOMBRE,
              P.Profesion AS PROFESION_NOMBRE,
              P.Colegio AS COLEGIO_NOMBRE,
              C2.NOMBRE AS CONSULTORIO2_NOMBRE,
              E2.NOMBRE AS ESPECIALIDAD2_NOMBRE,
              P2.Profesion AS PROFESION_COLEGIO2_NOMBRE,
              ROW_NUMBER() OVER (ORDER BY M.NOMBRE) AS RowNum
            FROM MEDICO M
            LEFT JOIN CONSULTORIO C ON M.CONSULTORIO = C.Consultorio
            LEFT JOIN ESPECIALIDAD E ON M.ESPECIALIDAD = E.ESPECIALIDAD
            LEFT JOIN ProfesionesColegio P ON M.PROFESION_COLEGIO = P.id_profesion
            LEFT JOIN CONSULTORIO C2 ON M.CONSULTORIO2 = C2.Consultorio
            LEFT JOIN ESPECIALIDAD E2 ON M.ESPECIALIDAD2 = E2.ESPECIALIDAD
            LEFT JOIN ProfesionesColegio P2 ON M.PROFESION_COLEGIO2 = P2.id_profesion
          )
          SELECT * FROM CTE
          WHERE RowNum BETWEEN ${startRow} AND ${endRow}
          ORDER BY RowNum
        `;
      }

      const total = Number((totalResult as any)[0].total);

      // Normalizar resultados para el frontend
      const normalized = (medicos as any[]).map(normalizeMedico);

      return {
        data: normalized as Medico[],
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      console.error('Error in medicoServerService.getMedicos:', error);
      throw error;
    }
  },

  async getMedicoById(id: string): Promise<Medico | null> {
    try {
      const medico = await prisma.$queryRaw`
        SELECT 
          M.ID_MEDICO, M.MEDICO, M.NOMBRE, M.DNI, M.EESS, M.ABREVIATURA, M.COLEGIO, M.COLESP,
          M.ESPECIALIDAD, M.CONSULTORIO, M.CODHIS, M.CONTRATO, M.ACTIVO, M.IMPCITA, M.PROFESION_COLEGIO,
          M.FECHNAC, M.GENERO, M.ESPECIALIDAD2, M.CONSULTORIO2, M.PROFESION_COLEGIO2, M.USUARIO,
          M.NOMBRES, M.APATERNO, M.AMATERNO, M.TIPO_DOCUMENTO, M.PAIS,
          C.NOMBRE AS CONSULTORIO_NOMBRE,
          E.NOMBRE AS ESPECIALIDAD_NOMBRE,
          P.Profesion AS PROFESION_NOMBRE,
          P.Colegio AS COLEGIO_NOMBRE,
          C2.NOMBRE AS CONSULTORIO2_NOMBRE,
          E2.NOMBRE AS ESPECIALIDAD2_NOMBRE,
          P2.Profesion AS PROFESION_COLEGIO2_NOMBRE
        FROM MEDICO M
        LEFT JOIN CONSULTORIO C ON M.CONSULTORIO = C.Consultorio
        LEFT JOIN ESPECIALIDAD E ON M.ESPECIALIDAD = E.ESPECIALIDAD
        LEFT JOIN ProfesionesColegio P ON M.PROFESION_COLEGIO = P.id_profesion
        LEFT JOIN CONSULTORIO C2 ON M.CONSULTORIO2 = C2.Consultorio
        LEFT JOIN ESPECIALIDAD E2 ON M.ESPECIALIDAD2 = E2.ESPECIALIDAD
        LEFT JOIN ProfesionesColegio P2 ON M.PROFESION_COLEGIO2 = P2.id_profesion
        WHERE M.MEDICO = ${id}
      `;

      if (!medico || (Array.isArray(medico) && medico.length === 0)) {
        return null;
      }

      const item = Array.isArray(medico) ? medico[0] : medico;
      return normalizeMedico(item);
    } catch (error) {
      console.error(`Error in medicoServerService.getMedicoById(${id}):`, error);
      throw error;
    }
  },

  async createMedico(data: Partial<Medico>): Promise<Medico> {
    try {
      if (!data.MEDICO || String(data.MEDICO).trim() === "") {
        throw new Error('El campo MEDICO es requerido');
      }

      if (!data.NOMBRE || String(data.NOMBRE).trim() === "") {
        throw new Error('El campo NOMBRE es requerido');
      }

      if (!data.DNI || String(data.DNI).trim() === "") {
        throw new Error('El campo DNI es requerido');
      }

      // Check if DNI already exists
      const existing = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM MEDICO WHERE DNI = ${data.DNI}
      `;
      const exists = Number((existing as any)[0].count) > 0;

      if (exists) {
        throw new Error('Ya existe un médico con este DNI');
      }

      // Sanitizar campos opcionales que pueden ser NUMERIC en la BD
      const especialidadVal = (data.ESPECIALIDAD && String(data.ESPECIALIDAD).trim() !== "")
        ? String(data.ESPECIALIDAD).trim()
        : null;
      const consultorioVal = (data.CONSULTORIO && String(data.CONSULTORIO).trim() !== "")
        ? String(data.CONSULTORIO).trim()
        : null;
      
      // ACTIVO es numeric(5) en la BD -> mapear a 1/0
      const parseActivo = (v: any): number => {
        const s = String(v ?? '').trim().toUpperCase();
        if (s === '1' || s === 'S' || s === 'TRUE') return 1;
        if (s === '0' || s === 'N' || s === 'FALSE') return 0;
        return 1; // por defecto activo
      };
      const activoVal = parseActivo(data.ACTIVO);

      // Validate field lengths using exact table structure
      const medicoCode = String(data.MEDICO).trim().substring(0, 3); // MEDICO char(3)
      const nombre = String(data.NOMBRE).substring(0, 50); // NOMBRE varchar(50)
      const colegio = String(data.COLEGIO || "").substring(0, 10); // COLEGIO varchar(10)
      const abreviatura = String(data.ABREVIATURA || "MED").substring(0, 3); // ABREVIATURA varchar(3)
      const colesp = String(data.COLESP || "").substring(0, 50); // COLESP varchar(50)
      const dni = String(data.DNI).substring(0, 8); // DNI varchar(8)
      const codhis = String(data.CODHIS || "").substring(0, 11); // CODHIS varchar(11)
      const eess = String(data.EESS || "0000005947").substring(0, 10); // EESS char(10)
      const contrato = String(data.CONTRATO || "NINGUNO").substring(0, 100); // CONTRATO varchar(100)
      const impcita = String(data.IMPCITA || "N").substring(0, 1); // IMPCITA varchar(1)
      const profesionColegio = (data.PROFESION_COLEGIO && String(data.PROFESION_COLEGIO).trim() !== "") 
        ? String(data.PROFESION_COLEGIO).trim().substring(0, 2) 
        : null; // PROFESION_COLEGIO char(2)
      // Convertir fecha de YYYY-MM-DD a DD/MM/YYYY
      let fechnac = "";
      if (data.FECHNAC && String(data.FECHNAC).trim() !== "") {
        const fechaParts = String(data.FECHNAC).split("-");
        if (fechaParts.length === 3) {
          fechnac = `${fechaParts[2]}/${fechaParts[1]}/${fechaParts[0]}`;
        } else {
          fechnac = String(data.FECHNAC);
        }
      }
      fechnac = fechnac.substring(0, 15); // FECHNAC varchar(15)
      
      const genero = String(data.GENERO || "").substring(0, 1); // GENERO char(1)
      
      // ESPECIALIDAD2 y CONSULTORIO2 no pueden ser NULL, usar "0" como default
      const especialidad2Val = (data.ESPECIALIDAD2 && String(data.ESPECIALIDAD2).trim() !== "" && String(data.ESPECIALIDAD2).trim() !== "0")
        ? String(data.ESPECIALIDAD2).trim().substring(0, 4)
        : "0";
      const consultorio2Val = (data.CONSULTORIO2 && String(data.CONSULTORIO2).trim() !== "" && String(data.CONSULTORIO2).trim() !== "0")
        ? String(data.CONSULTORIO2).trim().substring(0, 6)
        : "0";
      const profesionColegio2 = (data.PROFESION_COLEGIO2 && String(data.PROFESION_COLEGIO2).trim() !== "") 
        ? String(data.PROFESION_COLEGIO2).trim().substring(0, 2) 
        : null; // PROFESION_COLEGIO2 char(2)

      // Log field lengths to identify truncation issues
      console.log('Field lengths:', {
        medicoCode: medicoCode.length,
        nombre: nombre.length,
        colegio: colegio.length,
        especialidadVal: especialidadVal?.length || 0,
        abreviatura: abreviatura.length,
        consultorioVal: consultorioVal?.length || 0,
        colesp: colesp.length,
        dni: dni.length,
        codhis: codhis.length,
        eess: eess.length,
        contrato: contrato.length,
        impcita: impcita.length,
        profesionColegio: profesionColegio?.length || 0,
      });
      
      console.log('PROFESION_COLEGIO value:', {
        original: data.PROFESION_COLEGIO,
        processed: profesionColegio
      });

      // Obtener el DNI del usuario desde data.USUARIO (viene del frontend)
      const usuarioDni = data.USUARIO ? String(data.USUARIO).substring(0, 15) : null;
      
      // Campos individuales de nombre
      const nombres = data.NOMBRES ? String(data.NOMBRES).substring(0, 100) : null; // NOMBRES varchar(100)
      const apaterno = data.APATERNO ? String(data.APATERNO).substring(0, 80) : null; // APATERNO varchar(80)
      const amaterno = data.AMATERNO ? String(data.AMATERNO).substring(0, 80) : null; // AMATERNO varchar(80)
      
      // Campos de documento y país
      const tipoDocumento = data.TIPO_DOCUMENTO ? String(data.TIPO_DOCUMENTO).substring(0, 3) : "D"; // TIPO_DOCUMENTO varchar(3) - "D" para DNI, "CE" para Carnet de Extranjería
      const pais = data.PAIS ? String(data.PAIS).substring(0, 3) : "146"; // PAIS char(3) - 146 = Perú
      
      // Try inserting fields one by one to identify which one causes truncation
      try {
        // Insert the new medico with more conservative field lengths
        await prisma.$executeRaw`
          INSERT INTO Medico(MEDICO,NOMBRE,COLEGIO,ESPECIALIDAD,ABREVIATURA,CONSULTORIO,ACTIVO,COLESP,DNI,CODHIS,EESS,CONTRATO,IMPCITA,PROFESION_COLEGIO,FECHNAC,GENERO,ESPECIALIDAD2,CONSULTORIO2,PROFESION_COLEGIO2,USUARIO,NOMBRES,APATERNO,AMATERNO,TIPO_DOCUMENTO,PAIS) 
          VALUES(
            ${medicoCode}, 
            ${nombre}, 
            ${colegio}, 
            ${especialidadVal ? String(especialidadVal).substring(0, 4) : null}, 
            ${abreviatura}, 
            ${consultorioVal ? String(consultorioVal).substring(0, 6) : null}, 
            ${activoVal}, 
            ${colesp}, 
            ${dni}, 
            ${codhis}, 
            ${eess}, 
            ${contrato}, 
            ${impcita},
            ${profesionColegio},
            ${fechnac},
            ${genero},
            ${especialidad2Val},
            ${consultorio2Val},
            ${profesionColegio2},
            ${usuarioDni},
            ${nombres},
            ${apaterno},
            ${amaterno},
            ${tipoDocumento},
            ${pais}
          )
        `;
      } catch (error) {
        console.error('Error with more conservative field lengths:', error);
        throw error;
      }

      // Insert BITACORA log usando los valores ya truncados correctamente
      const especialidadValLog = especialidadVal ? String(especialidadVal).substring(0, 4) : "";
      const consultorioValLog = consultorioVal ? String(consultorioVal).substring(0, 6) : "";
      
      const sqlStatement = `INSERT INTO Medico(MEDICO,NOMBRE,COLEGIO,ESPECIALIDAD,ABREVIATURA,CONSULTORIO,ACTIVO,COLESP,DNI,CODHIS,EESS,CONTRATO,IMPCITA) VALUES(!${medicoCode}!,!${nombre}!,!${colegio}!,!${especialidadValLog}!,!${abreviatura}!,!${consultorioValLog}!,${activoVal},!${colesp}!,!${dni}!,!${codhis}!,!${eess}!,!${contrato}!,!${impcita}!)`;
      
      // Log para depuración
      console.log('SQL Statement para BITACORA:', sqlStatement);
      
      await prisma.$executeRaw`
        INSERT INTO BITACORA (Transaccion,Fecha,Usuario,UsuarioRed,Pc,Modulo,SentenciaSql,Tabla) 
        VALUES ('INSERT',getdate(),'SYSTEM','SYSTEM','SYSTEM','ADMISION',${sqlStatement},'Medico')
      `;

      // Retornar los valores que se usaron en la inserción
      return {
        MEDICO: medicoCode,
        NOMBRE: nombre,
        DNI: dni,
        EESS: eess,
        ABREVIATURA: abreviatura,
        COLEGIO: colegio,
        COLESP: colesp,
        ESPECIALIDAD: (especialidadVal ? String(especialidadVal).substring(0, 4) : "") as any,
        CONSULTORIO: (consultorioVal ? String(consultorioVal).substring(0, 6) : "") as any,
        CODHIS: codhis,
        CONTRATO: contrato,
        ACTIVO: activoVal === 1 ? "1" : "0",
        IMPCITA: impcita,
        PROFESION_COLEGIO: profesionColegio || "",
        FECHNAC: fechnac,
        GENERO: genero,
        ESPECIALIDAD2: especialidad2Val,
        CONSULTORIO2: consultorio2Val,
        PROFESION_COLEGIO2: profesionColegio2 || "",
        USUARIO: usuarioDni || "",
        NOMBRES: nombres || "",
        APATERNO: apaterno || "",
        AMATERNO: amaterno || "",
        TIPO_DOCUMENTO: tipoDocumento || "D",
        PAIS: pais || "146"
      };
    } catch (error) {
      console.error('Error in medicoServerService.createMedico:', error);
      throw error;
    }
  },

  async updateMedico(id: string, data: Partial<Medico>): Promise<Medico | null> {
    try {
      const existing = await this.getMedicoById(id);
      if (!existing) {
        return null;
      }

      // Sanitizar campos opcionales (posibles NUMERIC) para evitar empty strings
      const especialidadVal = (data.ESPECIALIDAD !== undefined)
        ? (String(data.ESPECIALIDAD).trim() === "" ? null : String(data.ESPECIALIDAD).trim())
        : (existing.ESPECIALIDAD && String(existing.ESPECIALIDAD).trim() !== "" ? String(existing.ESPECIALIDAD).trim() : null);
      const consultorioVal = (data.CONSULTORIO !== undefined)
        ? (String(data.CONSULTORIO).trim() === "" ? null : String(data.CONSULTORIO).trim())
        : (existing.CONSULTORIO && String(existing.CONSULTORIO).trim() !== "" ? String(existing.CONSULTORIO).trim() : null);
      
      const parseActivo = (v: any): number => {
        const s = String(v ?? '').trim().toUpperCase();
        if (s === '1' || s === 'S' || s === 'TRUE') return 1;
        if (s === '0' || s === 'N' || s === 'FALSE') return 0;
        return 1;
      };
      const newActivoVal = data.ACTIVO !== undefined ? parseActivo(data.ACTIVO) : parseActivo(existing.ACTIVO);

      // Aplicar límites exactos de la tabla MEDICO
      const nombre = String(data.NOMBRE || existing.NOMBRE).substring(0, 50); // varchar(50)
      const dni = String(data.DNI || existing.DNI || "").substring(0, 8); // varchar(8)
      const eess = String(data.EESS || existing.EESS || "0000005947").substring(0, 10); // char(10)
      const abreviatura = String(data.ABREVIATURA || existing.ABREVIATURA || "MED").substring(0, 3); // varchar(3)
      const colegio = String(data.COLEGIO || existing.COLEGIO || "").substring(0, 10); // varchar(10)
      const colesp = String(data.COLESP || existing.COLESP || "").substring(0, 50); // varchar(50)
      const especialidadValTruncated = especialidadVal ? String(especialidadVal).substring(0, 4) : null; // char(4)
      const consultorioValTruncated = consultorioVal ? String(consultorioVal).substring(0, 6) : null; // char(6)
      const codhis = String(data.CODHIS ?? existing.CODHIS ?? "").substring(0, 11); // varchar(11)
      const contrato = String(data.CONTRATO ?? existing.CONTRATO ?? "NINGUNO").substring(0, 100); // varchar(100)
      const impcita = String(data.IMPCITA ?? existing.IMPCITA ?? "N").substring(0, 1); // varchar(1)
      const profesionColegio = data.PROFESION_COLEGIO !== undefined 
        ? ((data.PROFESION_COLEGIO && String(data.PROFESION_COLEGIO).trim() !== "") ? String(data.PROFESION_COLEGIO).trim().substring(0, 2) : null)
        : ((existing.PROFESION_COLEGIO && String(existing.PROFESION_COLEGIO).trim() !== "") ? String(existing.PROFESION_COLEGIO).trim().substring(0, 2) : null); // char(2)
      // Convertir fecha de YYYY-MM-DD a DD/MM/YYYY
      let fechnac = "";
      const fechaToConvert = data.FECHNAC ?? existing.FECHNAC ?? "";
      if (fechaToConvert && String(fechaToConvert).trim() !== "") {
        const fechaParts = String(fechaToConvert).split("-");
        if (fechaParts.length === 3) {
          fechnac = `${fechaParts[2]}/${fechaParts[1]}/${fechaParts[0]}`;
        } else {
          fechnac = String(fechaToConvert);
        }
      }
      fechnac = fechnac.substring(0, 15); // varchar(15)
      
      const genero = String(data.GENERO ?? existing.GENERO ?? "").substring(0, 1); // char(1)
      
      // ESPECIALIDAD2 y CONSULTORIO2 no pueden ser NULL, usar "0" como default
      const especialidad2Val = data.ESPECIALIDAD2 !== undefined
        ? ((data.ESPECIALIDAD2 && String(data.ESPECIALIDAD2).trim() !== "" && String(data.ESPECIALIDAD2).trim() !== "0") ? String(data.ESPECIALIDAD2).trim().substring(0, 4) : "0")
        : ((existing.ESPECIALIDAD2 && String(existing.ESPECIALIDAD2).trim() !== "" && String(existing.ESPECIALIDAD2).trim() !== "0") ? String(existing.ESPECIALIDAD2).trim().substring(0, 4) : "0");
      const consultorio2Val = data.CONSULTORIO2 !== undefined
        ? ((data.CONSULTORIO2 && String(data.CONSULTORIO2).trim() !== "" && String(data.CONSULTORIO2).trim() !== "0") ? String(data.CONSULTORIO2).trim().substring(0, 6) : "0")
        : ((existing.CONSULTORIO2 && String(existing.CONSULTORIO2).trim() !== "" && String(existing.CONSULTORIO2).trim() !== "0") ? String(existing.CONSULTORIO2).trim().substring(0, 6) : "0");
      const profesionColegio2 = data.PROFESION_COLEGIO2 !== undefined
        ? ((data.PROFESION_COLEGIO2 && String(data.PROFESION_COLEGIO2).trim() !== "") ? String(data.PROFESION_COLEGIO2).trim().substring(0, 2) : null)
        : ((existing.PROFESION_COLEGIO2 && String(existing.PROFESION_COLEGIO2).trim() !== "") ? String(existing.PROFESION_COLEGIO2).trim().substring(0, 2) : null);
      
      // Log para depuración
      console.log('Field lengths for update:', {
        nombre: nombre.length,
        dni: dni.length,
        eess: eess.length,
        abreviatura: abreviatura.length,
        colegio: colegio.length,
        colesp: colesp.length,
        especialidadVal: especialidadValTruncated?.length || 0,
        consultorioVal: consultorioValTruncated?.length || 0,
        profesionColegio: profesionColegio?.length || 0,
      });
      
      console.log('PROFESION_COLEGIO update value:', {
        original: data.PROFESION_COLEGIO,
        existing: existing.PROFESION_COLEGIO,
        processed: profesionColegio
      });
      
      // Obtener el DNI del usuario desde data.USUARIO (viene del frontend)
      const usuarioDni = data.USUARIO ? String(data.USUARIO).substring(0, 15) : null;
      
      // Campos individuales de nombre
      const nombres = data.NOMBRES !== undefined 
        ? (data.NOMBRES ? String(data.NOMBRES).substring(0, 100) : null)
        : (existing.NOMBRES ? String(existing.NOMBRES).substring(0, 100) : null); // NOMBRES varchar(100)
      const apaterno = data.APATERNO !== undefined
        ? (data.APATERNO ? String(data.APATERNO).substring(0, 80) : null)
        : (existing.APATERNO ? String(existing.APATERNO).substring(0, 80) : null); // APATERNO varchar(80)
      const amaterno = data.AMATERNO !== undefined
        ? (data.AMATERNO ? String(data.AMATERNO).substring(0, 80) : null)
        : (existing.AMATERNO ? String(existing.AMATERNO).substring(0, 80) : null); // AMATERNO varchar(80)
      
      // Campos de documento y país
      const tipoDocumento = data.TIPO_DOCUMENTO !== undefined
        ? String(data.TIPO_DOCUMENTO).substring(0, 3)
        : (existing.TIPO_DOCUMENTO ? String(existing.TIPO_DOCUMENTO).substring(0, 3) : "D"); // TIPO_DOCUMENTO varchar(3) - "D" para DNI, "CE" para Carnet de Extranjería
      const pais = data.PAIS !== undefined
        ? String(data.PAIS).substring(0, 3)
        : (existing.PAIS ? String(existing.PAIS).substring(0, 3) : "146"); // PAIS char(3)
      
      // Update the medico
      await prisma.$executeRaw`
        UPDATE MEDICO 
        SET NOMBRE = ${nombre},
            DNI = ${dni},
            EESS = ${eess},
            ABREVIATURA = ${abreviatura},
            COLEGIO = ${colegio},
            COLESP = ${colesp},
            ESPECIALIDAD = ${especialidadValTruncated},
            CONSULTORIO = ${consultorioValTruncated},
            CODHIS = ${codhis},
            CONTRATO = ${contrato},
            ACTIVO = ${newActivoVal},
            IMPCITA = ${impcita},
            PROFESION_COLEGIO = ${profesionColegio},
            FECHNAC = ${fechnac},
            GENERO = ${genero},
            ESPECIALIDAD2 = ${especialidad2Val},
            CONSULTORIO2 = ${consultorio2Val},
            PROFESION_COLEGIO2 = ${profesionColegio2},
            USUARIO = ${usuarioDni},
            NOMBRES = ${nombres},
            APATERNO = ${apaterno},
            AMATERNO = ${amaterno},
            TIPO_DOCUMENTO = ${tipoDocumento},
            PAIS = ${pais}
        WHERE MEDICO = ${id}
      `;

      // Insert BITACORA log for update con valores truncados
      const sqlStatement = `UPDATE MEDICO SET NOMBRE=!${nombre}!,DNI=!${dni}!,EESS=!${eess}!,ABREVIATURA=!${abreviatura}!,COLEGIO=!${colegio}!,COLESP=!${colesp}!,ESPECIALIDAD=!${especialidadValTruncated || ""}!,CONSULTORIO=!${consultorioValTruncated || ""}!,CODHIS=!${codhis}!,CONTRATO=!${contrato}!,ACTIVO=${newActivoVal},IMPCITA=!${impcita}! WHERE MEDICO=!${id}!`;
      
      // Log para depuración
      console.log('SQL Statement para BITACORA update:', sqlStatement);
      
      await prisma.$executeRaw`
        INSERT INTO BITACORA (Transaccion,Fecha,Usuario,UsuarioRed,Pc,Modulo,SentenciaSql,Tabla) 
        VALUES ('UPDATE',getdate(),'SYSTEM','SYSTEM','SYSTEM','ADMISION',${sqlStatement},'Medico')
      `;

      return await this.getMedicoById(id);
    } catch (error) {
      console.error(`Error in medicoServerService.updateMedico(${id}):`, error);
      throw error;
    }
  },

  async deleteMedico(id: string): Promise<boolean> {
    try {
      const existing = await this.getMedicoById(id);
      if (!existing) {
        return false;
      }

      await prisma.$executeRaw`DELETE FROM MEDICO WHERE MEDICO = ${id}`;
      return true;
    } catch (error) {
      console.error(`Error in medicoServerService.deleteMedico(${id}):`, error);
      throw error;
    }
  }
};
