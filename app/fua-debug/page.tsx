"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

export default function FuaDebugPage() {
  const [patientId, setPatientId] = useState('')
  const [debugResult, setDebugResult] = useState<any>(null)
  const [rawQueryResult, setRawQueryResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('queries')

  const handleDebug = async () => {
    if (!patientId) return
    
    setLoading(true)
    try {
      // Obtener consultas SQL
      const response = await fetch(`/api/fua/check?patientId=${patientId}&debug=true`)
      const data = await response.json()
      setDebugResult(data)
      
      // Obtener resultados directos
      const rawResponse = await fetch(`/api/fua/check?patientId=${patientId}&rawQuery=true`)
      const rawData = await rawResponse.json()
      setRawQueryResult(rawData)
      
    } catch (error) {
      console.error('Error:', error)
      setDebugResult({ error: 'Error al obtener datos de depuración' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Depuración de Validación FUA</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Herramienta de Depuración FUA</CardTitle>
          <CardDescription>Ingrese el ID del paciente para verificar el estado de sus FUAs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="ID del Paciente"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleDebug} 
              disabled={loading || !patientId}
            >
              {loading ? 'Cargando...' : 'Verificar FUAs'}
            </Button>
          </div>
          
          {(debugResult || rawQueryResult) && (
            <Tabs defaultValue="queries" className="mt-6" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="queries">Consultas SQL</TabsTrigger>
                <TabsTrigger value="results">Resultados</TabsTrigger>
              </TabsList>
              
              <TabsContent value="queries" className="mt-4">
                {debugResult && (
                  <div>
                    <h3 className="font-semibold mb-2">Consulta para FUAs activos:</h3>
                    <Textarea
                      value={debugResult.activeFuaQuery || 'No disponible'}
                      readOnly
                      className="h-40 font-mono text-sm"
                    />
                    
                    <h3 className="font-semibold mt-4 mb-2">Consulta para todos los FUAs del paciente:</h3>
                    <Textarea
                      value={debugResult.allFuasQuery || 'No disponible'}
                      readOnly
                      className="h-40 font-mono text-sm"
                    />
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="results" className="mt-4">
                {rawQueryResult && (
                  <div>
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Información de tiempo:</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">Hora actual:</p>
                          <p className="text-sm">{rawQueryResult.currentTime}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">3 horas atrás:</p>
                          <p className="text-sm">{rawQueryResult.threeHoursAgo}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">
                        FUAs activos en las últimas 3 horas: 
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${rawQueryResult.activeFuas?.length > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {rawQueryResult.activeFuas?.length || 0}
                        </span>
                      </h3>
                      
                      {rawQueryResult.activeFuas?.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID_CUENTA</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PACIENTE</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FECHA_ATENCION</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HORA_ATENCION</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ESTADO</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rawQueryResult.activeFuas.map((fua: any, index: number) => (
                                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                  <td className="px-4 py-2 text-sm">{fua.ID_CUENTA}</td>
                                  <td className="px-4 py-2 text-sm">{fua.PACIENTE}</td>
                                  <td className="px-4 py-2 text-sm">{fua.FECHA_ATENCION?.toString()}</td>
                                  <td className="px-4 py-2 text-sm">{fua.HORA_ATENCION}</td>
                                  <td className="px-4 py-2 text-sm">{fua.ESTADO}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No se encontraron FUAs activos en las últimas 3 horas</p>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">
                        Todos los FUAs del paciente: 
                        <Badge className="ml-2">{rawQueryResult.allFuas?.length || 0}</Badge>
                      </h3>
                      
                      {rawQueryResult.allFuas?.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID_CUENTA</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PACIENTE</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FECHA_ATENCION</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HORA_ATENCION</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ESTADO</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rawQueryResult.allFuas.map((fua: any, index: number) => (
                                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                  <td className="px-4 py-2 text-sm">{fua.ID_CUENTA}</td>
                                  <td className="px-4 py-2 text-sm">{fua.PACIENTE}</td>
                                  <td className="px-4 py-2 text-sm">{fua.FECHA_ATENCION?.toString()}</td>
                                  <td className="px-4 py-2 text-sm">{fua.HORA_ATENCION}</td>
                                  <td className="px-4 py-2 text-sm">{fua.ESTADO}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No se encontraron FUAs para este paciente</p>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
      
      <div className="text-sm text-gray-500">
        <p>Esta herramienta permite depurar la validación de FUAs para un paciente específico.</p>
        <p>Puede ver tanto las consultas SQL utilizadas como los resultados directos de la base de datos.</p>
      </div>
    </div>
  )
}
