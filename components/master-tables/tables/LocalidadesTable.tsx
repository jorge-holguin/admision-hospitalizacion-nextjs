import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Plus } from "lucide-react";
import { SearchBox } from "../SearchBox";
import { useLocalidades } from "@/hooks/master-tables/useLocalidades";
import { useDebounce } from "../SearchBox";
import { useToast } from "@/hooks/use-toast";
import DeleteConfirmationDialog from "@/components/ui/DeleteConfirmationDialog";
import { DataTable } from "@/components/ui/data-table";

interface LocalidadesTableProps {
  onEdit: (localidad: any) => void;
  onNew: () => void;
}

export const LocalidadesTable: React.FC<LocalidadesTableProps> = ({ onEdit, onNew }) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("nombre");
  const [isSearching, setIsSearching] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [localidadToDelete, setLocalidadToDelete] = useState<string | null>(null);

  const {
    data,
    pagination,
    isLoading,
    error,
    handlePageChange,
    handleFilterChange,
    deleteLocalidad,
  } = useLocalidades();

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      handleFilterChange({});
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
    setLocalidadToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (localidadToDelete) {
      const result = await deleteLocalidad(localidadToDelete);
      
      if (result.success) {
        toast({
          title: "Localidad eliminada",
          description: "La localidad ha sido eliminada correctamente",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo eliminar la localidad",
          variant: "destructive",
        });
      }
      
      setDeleteDialogOpen(false);
      setLocalidadToDelete(null);
    }
  };

  const searchTypes = [
    { value: "nombre", label: "Nombre", minLength: 3 },
    { value: "codigo", label: "Código", minLength: 2 },
    { value: "ubigeo", label: "UBIGEO", minLength: 3 },
  ];

  // Definir las columnas para el DataTable
  const columns = [
    { key: "LOCALIDAD", header: "Código" },
    { key: "NOMBRE", header: "Nombre" },
    { key: "UBIGEO", header: "UBIGEO" },
    { 
      key: "ACTIVO", 
      header: "Estado",
      cell: (localidad: any) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            localidad.ACTIVO === "S"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {localidad.ACTIVO === "S" ? "Activo" : "Inactivo"}
        </span>
      )
    },
    { 
      key: "actions", 
      header: "Acciones",
      cell: (localidad: any) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(localidad)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => confirmDelete(localidad.LOCALIDAD)}
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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Localidades</h2>
        <Button onClick={onNew} className="flex items-center gap-1">
          <Plus className="h-4 w-4" /> Nueva Localidad
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
        title="Eliminar Localidad"
        description="¿Está seguro que desea eliminar esta localidad? Esta acción no se puede deshacer."
      />
    </div>
  );
};
