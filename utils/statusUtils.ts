/**
 * Resolves the business status from the emergency status code
 * @param status Emergency status code from the database
 * @returns Object with mode and status information
 */
export function resolveStatus(status: string | undefined) {
  if (!status) {
    return { mode: "edit", isReadOnly: false, statusText: "Registrado" };
  }

  switch (status) {
    case "1":
      return { mode: "edit", isReadOnly: false, statusText: "Registrado" };
    case "2":
      return { mode: "edit", isReadOnly: false, statusText: "En Proceso" };
    case "3":
      return { mode: "read", isReadOnly: true, statusText: "Completado" };
    case "4":
      return { mode: "read", isReadOnly: true, statusText: "Cerrado" };
    case "5":
      return { mode: "read", isReadOnly: true, statusText: "CERRADO" };
    case "6":
      return { mode: "read", isReadOnly: true, statusText: "INGRESO" };
    case "0":
      return { mode: "read", isReadOnly: true, statusText: "Anulado" };
    default:
      return { mode: "read", isReadOnly: true, statusText: "Desconocido" };
  }
}
