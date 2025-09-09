import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Plus } from "lucide-react";
import { SearchBox } from "../SearchBox";
import { useMedicos } from "@/hooks/master-tables/useMedicos";
import { useDebounce } from "../SearchBox";
import { useToast } from "@/hooks/use-toast";
import DeleteConfirmationDialog from "@/components/ui/DeleteConfirmationDialog";
import { DataTable } from "@/components/ui/data-table";

interface MedicosTableProps {
  onEdit: (medico: any) => void;
  onNew: () => void;
}

export const MedicosTable: React.FC<MedicosTableProps> = ({ onEdit, onNew }) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("nombre");
  const [isSearching, setIsSearching] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [medicoToDelete, setMedicoToDelete] = useState<string | null>(null);

  const {
    data,
    pagination,
    isLoading,
    error,
    handlePageChange,
    handleFilterChange,
    deleteMedico,
    refreshData,
  } = useMedicos();

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
    setMedicoToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (medicoToDelete) {
      const result = await deleteMedico(medicoToDelete);
      
      if (result.success) {
        toast({
          title: "Médico eliminado",
          description: "El médico ha sido eliminado correctamente",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo eliminar el médico",
          variant: "destructive",
        });
      }
      
      setDeleteDialogOpen(false);
      setMedicoToDelete(null);
    }
  };

  const searchTypes = [
    { value: "nombre", label: "Nombre", minLength: 3 },
    { value: "dni", label: "DNI", minLength: 8 },
    { value: "colegio", label: "Colegio", minLength: 3 },
    { value: "especialidad", label: "Especialidad", minLength: 3 },
  ];

  // Definir las columnas para el DataTable (usando campos reales del API)
  const columns = [
    { key: "MEDICO", header: "Código" },
    { key: "NOMBRE", header: "Apellidos y Nombres" },
    { key: "DNI", header: "DNI" },
    {
      key: "ABREVIATURA",
      header: "Tipo",
      cell: (medico: any) => medico.ABREVIATURA || "MED",
    },
    { key: "COLEGIO", header: "Colegiatura" },
    {
      key: "ESPECIALIDAD",
      header: "Especialidad",
      cell: (medico: any) => medico.ESPECIALIDAD || "",
    },
    {
      key: "CONSULTORIO",
      header: "Consultorio",
      cell: (medico: any) => (medico.CONSULTORIO ? String(medico.CONSULTORIO).trim() : ""),
    },
    {
      key: "CONTRATO",
      header: "Condición",
      cell: (medico: any) => medico.CONTRATO || "NINGUNO",
    },
    { 
      key: "ACTIVO", 
      header: "Estado",
      cell: (medico: any) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            medico.ACTIVO === "1"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {medico.ACTIVO === "1" ? "Activo" : "Inactivo"}
        </span>
      )
    },
    { 
      key: "actions", 
      header: "Acciones",
      cell: (medico: any) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(medico)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => confirmDelete(medico.MEDICO)}
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
        <h2 className="text-xl font-bold">Médicos</h2>
        <Button onClick={onNew} className="flex items-center gap-1">
          <Plus className="h-4 w-4" /> Nuevo Médico
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
        title="Eliminar Médico"
        description="¿Está seguro que desea eliminar este médico? Esta acción no se puede deshacer."
      />
    </div>
  );
};
