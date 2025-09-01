import { NextResponse } from 'next/server';

/**
 * API endpoint para obtener la fecha y hora actual del servidor
 * Esto evita problemas de zona horaria en el cliente
 */
export async function GET() {
  try {
    // Obtener la fecha y hora actual del servidor
    const now = new Date();
    
    // Obtener año, mes y día en la zona horaria local del servidor
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    
    // Formatear la fecha como YYYY-MM-DD usando valores locales
    const currentDate = `${year}-${month}-${day}`;
    
    // Formatear la hora como HH:MM en formato de 24 horas
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;
    
    // Formatear la hora en formato 12 horas (AM/PM)
    const hour12 = now.getHours() % 12 || 12;
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    const formattedTime12 = `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    
    // Registrar los valores para depuración
    console.log(`Fecha y hora del servidor: ${now}`);
    console.log(`Fecha formateada: ${currentDate}`);
    console.log(`Hora formateada: ${currentTime}`);
    
    return NextResponse.json({
      success: true,
      date: currentDate,
      time: currentTime,
      time12: formattedTime12,
      timestamp: now.getTime(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      fullDateTime: now.toISOString()
    });
  } catch (error) {
    console.error('Error al obtener fecha y hora:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener fecha y hora' },
      { status: 500 }
    );
  }
}
