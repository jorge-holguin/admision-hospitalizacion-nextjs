import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Plus } from "lucide-react";
import { SearchBox } from "../SearchBox";
import { useConsultorios } from "@/hooks/master-tables/useConsultorios";
import { useDebounce } from "../SearchBox";
import { useToast } from "@/hooks/use-toast";
import DeleteConfirmationDialog from "@/components/ui/DeleteConfirmationDialog";
import { DataTable } from "@/components/ui/data-table";

interface ConsultoriosTableProps {
  onEdit: (consultorio: any) => void;
  onNew: () => void;
}

export const ConsultoriosTable: React.FC<ConsultoriosTableProps> = ({ onEdit, onNew }) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("nombre");
  const [isSearching, setIsSearching] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [consultorioToDelete, setConsultorioToDelete] = useState<string | null>(null);

  const {
    data,
    pagination,
    isLoading,
    error,
    handlePageChange,
    handleFilterChange,
    deleteConsultorio,
  } = useConsultorios();

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      return;
    }

    setIsSearching(true);
    handleFilterChange({
      [searchType]: searchTerm,
    });
    setIsSearching(false);
  };

  React.useEffect(() => {
    if (debouncedSearchTerm !== undefined) {
      handleSearch();
    }
  }, [debouncedSearchTerm, searchType]);

  const confirmDelete = (id: string) => {
    setConsultorioToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (consultorioToDelete) {
      const result = await deleteConsultorio(consultorioToDelete);
      
      if (result.success) {
        toast({
          title: "Consultorio eliminado",
          description: "El consultorio ha sido eliminado correctamente",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo eliminar el consultorio",
          variant: "destructive",
        });
      }
      
      setDeleteDialogOpen(false);
      setConsultorioToDelete(null);
    }
  };

  const searchTypes = [
    { value: "nombre", label: "Nombre", minLength: 3 },
    { value: "codigo", label: "Código", minLength: 2 },
    { value: "especialidad", label: "Especialidad", minLength: 3 },
  ];

  // Definir las columnas para el DataTable
  const columns = [
    { key: "CONSULTORIO", header: "Código" },
    { key: "NOMBRE", header: "Nombre" },
    { key: "ABREVIATURA", header: "Abreviatura" },
    { key: "ESPECIALIDAD", header: "Especialidad" },
    { key: "TIPO", header: "Tipo" },
    { key: "ORDEN", header: "Orden" },
    { 
      key: "ROL", 
      header: "Programa Rol",
      cell: (consultorio: any) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          consultorio.ROL === "1" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
        }`}>
          {consultorio.ROL === "1" ? "Sí" : "No"}
        </span>
      )
    },
    { 
      key: "MUESTRAROL", 
      header: "Muestra Rol",
      cell: (consultorio: any) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          consultorio.MUESTRAROL === "1" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"
        }`}>
          {consultorio.MUESTRAROL === "1" ? "Sí" : "No"}
        </span>
      )
    },
    { 
      key: "ACTIVO", 
      header: "Estado",
      cell: (consultorio: any) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            consultorio.ACTIVO === "1"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {consultorio.ACTIVO === "1" ? "Activo" : "Inactivo"}
        </span>
      )
    },
    { 
      key: "actions", 
      header: "Acciones",
      cell: (consultorio: any) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(consultorio)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => confirmDelete(consultorio.CONSULTORIO)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  // Función para cambiar el tamaño de página
  const handlePageSizeChange = (newPageSize: number) => {
    handleFilterChange({
      ...pagination,
      pageSize: newPageSize,
      page: 1 // Resetear a la primera página cuando cambia el tamaño
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h2 className="text-xl font-bold">Consultorios</h2>
        <Button onClick={onNew} className="flex flex-wrap items-center gap-1 w-full sm:w-auto">
          <Plus className="h-4 w-4" /> Nuevo Consultorio
        </Button>
      </div>

      <SearchBox
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchType={searchType}
        setSearchType={setSearchType}
        handleSearch={handleSearch}
        isLoading={isLoading}
        isSearching={isSearching}
        searchTypes={searchTypes}
        handleFilterChange={handleFilterChange}
      />

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <DataTable
        data={data}
        columns={columns}
        pagination={{
          page: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          totalPages: Math.ceil(pagination.total / pagination.pageSize)
        }}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        isLoading={isLoading}
      />

      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Consultorio"
        description="¿Está seguro que desea eliminar este consultorio? Esta acción no se puede deshacer."
      />
    </div>
  );
};
