import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas protegidas que requieren autenticación
const protectedRoutes = [
  '/dashboard',
  '/filiation',
  '/master-tables',
  '/appointments',
  '/emergency',
  '/hospitalization',
  '/change-password'
]

// Rutas públicas que no requieren autenticación
const publicRoutes = [
  '/',
  '/login'
]

/**
 * Decodifica un JWT token y verifica si es válido
 */
function decodeToken(token: string): { exp?: number } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const payload = parts[1]
    const decodedPayload = Buffer.from(payload, 'base64').toString('utf-8')
    const tokenData = JSON.parse(decodedPayload)
    
    return tokenData
  } catch (error) {
    console.error('Error decoding token:', error)
    return null
  }
}

/**
 * Verifica si el token JWT es válido y no ha expirado
 */
function isValidToken(token: string): boolean {
  const decoded = decodeToken(token)
  if (!decoded || !decoded.exp) return false
  
  // Verificar si el token ha expirado
  const currentTime = Math.floor(Date.now() / 1000)
  return decoded.exp > currentTime
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Verificar si la ruta actual es protegida
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // Verificar si la ruta actual es pública
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route
  )
  
  // Obtener el token de autenticación de las cookies o headers
  // Next.js almacena en localStorage en el cliente, pero necesitamos verificar en el servidor
  // Por eso usaremos cookies para el middleware
  const token = request.cookies.get('authToken')?.value
  
  // Si es una ruta protegida y no hay token válido, redirigir al login
  if (isProtectedRoute) {
    if (!token || !isValidToken(token)) {
      const loginUrl = new URL('/', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }
  
  // Si es una ruta pública (login) y el usuario ya está autenticado, redirigir al dashboard
  if (isPublicRoute && pathname === '/' && token && isValidToken(token)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return NextResponse.next()
}

// Configurar qué rutas deben pasar por el middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)',
  ],
}
