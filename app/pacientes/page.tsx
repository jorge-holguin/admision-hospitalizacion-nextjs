'use client';

import { useState, useEffect } from 'react';
import { usePaciente } from '@/hooks/usePaciente';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, X, RefreshCw } from 'lucide-react';

export default function PacientesPage() {
  const {
    pacientes,
    loading,
    error,
    pagination,
    searchType,
    searchTerm,
    handleSearchChange,
    handleSearchTypeChange,
    changePage,
    changePageSize,
    clearSearch,
    refreshData,
  } = usePaciente();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="container mx-auto py-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Gestión de Pacientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="flex gap-2">
                <Select value={searchType} onValueChange={(value) => handleSearchTypeChange(value as any)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Buscar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="historia">Historia Clínica</SelectItem>
                    <SelectItem value="documento">DNI/Documento</SelectItem>
                    <SelectItem value="nombres">Nombres/Apellidos</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative flex-1">
                  <Input
                    placeholder={`Buscar por ${searchType === 'historia' ? 'historia clínica' : searchType === 'documento' ? 'DNI/documento' : 'nombres o apellidos'}`}
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={clearSearch}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Button variant="outline" size="icon" onClick={refreshData}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Select value={pagination.pageSize.toString()} onValueChange={(value) => changePageSize(Number(value))}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Registros por página" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 por página</SelectItem>
                  <SelectItem value="25">25 por página</SelectItem>
                  <SelectItem value="50">50 por página</SelectItem>
                  <SelectItem value="100">100 por página</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filtros activos */}
          {(searchTerm) && (
            <div className="flex gap-2 mb-4">
              <span className="text-sm text-muted-foreground">Filtros activos:</span>
              {searchTerm && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {searchType === 'historia' ? 'Historia: ' : searchType === 'documento' ? 'Documento: ' : 'Nombres: '}
                  {searchTerm}
                  <X className="h-3 w-3 cursor-pointer" onClick={clearSearch} />
                </Badge>
              )}
            </div>
          )}

          {/* Estado de carga */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Cargando pacientes...</span>
            </div>
          )}

          {/* Mensaje de error */}
          {error && !loading && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
              <p>Error al cargar los datos: {error}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={refreshData}>
                Reintentar
              </Button>
            </div>
          )}

          {/* Tabla de datos */}
          {!loading && !error && (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Historia</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>Nombres</TableHead>
                      <TableHead>Apellidos</TableHead>
                      <TableHead>Sexo</TableHead>
                      <TableHead>Edad</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pacientes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No se encontraron pacientes con los criterios de búsqueda.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pacientes.map((paciente) => (
                        <TableRow key={paciente.PACIENTE}>
                          <TableCell>{paciente.HISTORIA}</TableCell>
                          <TableCell>{paciente.DOCUMENTO}</TableCell>
                          <TableCell>{paciente.NOMBRE}</TableCell>
                          <TableCell>{`${paciente.PATERNO} ${paciente.MATERNO}`}</TableCell>
                          <TableCell>{paciente.SEXO === 'M' ? 'Masculino' : paciente.SEXO === 'F' ? 'Femenino' : paciente.SEXO}</TableCell>
                          <TableCell>{paciente.EDAD}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
              {pacientes.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(pagination.page - 1) * pagination.pageSize + 1} a{' '}
                    {Math.min(pagination.page * pagination.pageSize, pagination.total)} de {pagination.total} registros
                  </p>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => pagination.page > 1 && changePage(pagination.page - 1)}
                          className={pagination.page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const pageNumber = i + 1;
                        return (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              onClick={() => changePage(pageNumber)}
                              isActive={pagination.page === pageNumber}
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      {pagination.totalPages > 5 && (
                        <>
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => changePage(pagination.totalPages)}
                              isActive={pagination.page === pagination.totalPages}
                            >
                              {pagination.totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      )}
                      
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => pagination.page < pagination.totalPages && changePage(pagination.page + 1)}
                          className={pagination.page >= pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
