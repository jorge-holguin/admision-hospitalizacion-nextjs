'use client'

import dynamic from 'next/dynamic'
import 'swagger-ui-react/swagger-ui.css'
import { swaggerSpec } from '@/lib/swagger'

// Cargar SwaggerUI de forma dinámica para evitar errores de SSR
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-600">Cargando documentación de API...</p>
      </div>
    </div>
  )
})

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header personalizado */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-6 px-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">📋 API Documentation</h1>
              <p className="text-blue-100 mt-1">Sistema de Gestión Hospitalaria - HJATCH</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                v1.0.0
              </span>
              <a 
                href="/dashboard" 
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
              >
                ← Volver al Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido de Swagger */}
      <div className="swagger-wrapper">
        <SwaggerUI 
          spec={swaggerSpec}
          docExpansion="list"
          defaultModelsExpandDepth={1}
          displayRequestDuration={true}
          filter={true}
          showExtensions={true}
          showCommonExtensions={true}
          tryItOutEnabled={true}
        />
      </div>

      {/* Estilos personalizados para Swagger UI */}
      <style jsx global>{`
        .swagger-wrapper {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
        }

        /* Personalizar colores del tema */
        .swagger-ui .topbar {
          display: none;
        }

        .swagger-ui .info {
          margin: 20px 0;
        }

        .swagger-ui .info .title {
          color: #1e40af;
        }

        .swagger-ui .info .description {
          font-size: 14px;
          line-height: 1.6;
        }

        .swagger-ui .info .description h1 {
          font-size: 1.5rem;
          color: #1e40af;
          margin-top: 1rem;
        }

        .swagger-ui .info .description h2 {
          font-size: 1.25rem;
          color: #374151;
          margin-top: 0.75rem;
        }

        /* Tags */
        .swagger-ui .opblock-tag {
          border-bottom: 1px solid #e5e7eb;
          color: #1f2937;
          font-size: 18px;
        }

        .swagger-ui .opblock-tag:hover {
          background: #f9fafb;
        }

        /* Operaciones */
        .swagger-ui .opblock.opblock-get {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.05);
        }

        .swagger-ui .opblock.opblock-get .opblock-summary-method {
          background: #3b82f6;
        }

        .swagger-ui .opblock.opblock-post {
          border-color: #22c55e;
          background: rgba(34, 197, 94, 0.05);
        }

        .swagger-ui .opblock.opblock-post .opblock-summary-method {
          background: #22c55e;
        }

        .swagger-ui .opblock.opblock-put {
          border-color: #f59e0b;
          background: rgba(245, 158, 11, 0.05);
        }

        .swagger-ui .opblock.opblock-put .opblock-summary-method {
          background: #f59e0b;
        }

        .swagger-ui .opblock.opblock-patch {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.05);
        }

        .swagger-ui .opblock.opblock-patch .opblock-summary-method {
          background: #8b5cf6;
        }

        .swagger-ui .opblock.opblock-delete {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.05);
        }

        .swagger-ui .opblock.opblock-delete .opblock-summary-method {
          background: #ef4444;
        }

        /* Botones */
        .swagger-ui .btn.execute {
          background-color: #3b82f6;
          border-color: #3b82f6;
        }

        .swagger-ui .btn.execute:hover {
          background-color: #2563eb;
        }

        .swagger-ui .btn.cancel {
          background-color: #6b7280;
          border-color: #6b7280;
        }

        /* Modelos/Schemas */
        .swagger-ui section.models {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }

        .swagger-ui section.models h4 {
          color: #1f2937;
        }

        .swagger-ui .model-box {
          background: #f9fafb;
        }

        /* Tabla de parámetros */
        .swagger-ui table tbody tr td {
          padding: 12px 8px;
        }

        .swagger-ui .parameter__name {
          font-weight: 600;
          color: #1f2937;
        }

        .swagger-ui .parameter__type {
          color: #6b7280;
        }

        /* Responses */
        .swagger-ui .responses-inner h4 {
          color: #374151;
        }

        .swagger-ui .response-col_status {
          font-weight: 600;
        }

        /* Filtro */
        .swagger-ui .filter-container input {
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 8px 12px;
        }

        .swagger-ui .filter-container input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        /* Autorización */
        .swagger-ui .auth-wrapper {
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .swagger-ui .authorization__btn {
          background: transparent;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 6px 12px;
        }

        .swagger-ui .authorization__btn:hover {
          background: #f3f4f6;
        }

        /* Try it out */
        .swagger-ui .try-out__btn {
          border: 1px solid #3b82f6;
          color: #3b82f6;
          border-radius: 6px;
        }

        .swagger-ui .try-out__btn:hover {
          background: rgba(59, 130, 246, 0.1);
        }

        /* Código de respuesta */
        .swagger-ui .highlight-code {
          border-radius: 6px;
        }

        /* Loading */
        .swagger-ui .loading-container {
          padding: 40px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .swagger-wrapper {
            padding: 10px;
          }
          
          .swagger-ui .opblock-summary {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  )
}
