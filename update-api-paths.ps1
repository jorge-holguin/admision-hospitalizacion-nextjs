# Script para actualizar todas las rutas de API a la nueva estructura

$rootPath = "c:\Users\desarrollo06\Pictures\hospital-management-system"

# Definir los reemplazos
$replacements = @{
    # EMERGENCY
    '/api/emergencia/patient/' = '/api/emergency/patient/'
    '/api/emergencia/paciente/' = '/api/emergency/patient/'
    '/api/emergencia/crear' = '/api/emergency'
    '/api/emergencia/activa/' = '/api/emergency/active/'
    '/api/emergencia/' = '/api/emergency/'
    '/api/forma-ingreso' = '/api/emergency/admission-types'
    '/api/motivo-emergencia' = '/api/emergency/reasons'
    'asegurar-cuenta' = 'assign-account'
    
    # HOSPITALIZATION
    '/api/hospitaliza/orden-hospitalizacion/paciente/' = '/api/hospitalization/patient/'
    '/api/hospitaliza/orden-hospitalizacion' = '/api/hospitalization'
    '/api/hospitalizacion/patient/' = '/api/hospitalization/patient/'
    '/api/hospitalizacion/' = '/api/hospitalization/'
    '/api/origen-hospitalizacion' = '/api/hospitalization/origins'
    '/api/diagnosticos' = '/api/hospitalization/diagnostics'
    
    # APPOINTMENTS
    '/api/citas/search-by-documento' = '/api/appointments/search-by-document'
    '/api/citas/search-by-nombres' = '/api/appointments/search-by-name'
    '/api/tipo-cita' = '/api/appointments/types'
    '/api/citas/seguros' = '/api/appointments/insurances'
    '/api/citas/entidad-sis' = '/api/appointments/sis-entities'
    
    # FILIATION
    '/api/filiacion2' = '/api/filiation/search'
    
    # MASTER-TABLES
    '/api/especialidad' = '/api/master-tables/specialties'
    '/api/tipo' = '/api/master-tables/consultorio-types'
    '/api/medicos/sugerir-codigo' = '/api/master-tables/medicos/suggest-code'
    '/api/master-tables/consultorios/search/by-especialidad' = '/api/master-tables/consultorios/by-specialty'
    '/api/consultorio/by-especialidad' = '/api/master-tables/consultorios/by-specialty'
    '/api/consultorio' = '/api/master-tables/consultorios/search'
    '/api/medicos' = '/api/master-tables/medicos/search'
    
    # UTILS
    '/api/tipo-documento' = '/api/utils/document-types'
    '/api/seguros' = '/api/utils/insurances'
    
    # ACCOUNTS
    '/api/cuenta/search-by-insurance/' = '/api/accounts/search-by-insurance/'
    '/api/cuenta/validate' = '/api/accounts/validate'
    '/api/cuenta/' = '/api/accounts/'
}

# Función para actualizar archivos
function Update-Files {
    param (
        [string]$path,
        [hashtable]$replacements
    )
    
    # Obtener todos los archivos .ts y .tsx
    $files = Get-ChildItem -Path $path -Include *.ts,*.tsx -Recurse -File
    
    $totalFiles = $files.Count
    $updatedFiles = 0
    
    Write-Host "Encontrados $totalFiles archivos para procesar..." -ForegroundColor Cyan
    
    foreach ($file in $files) {
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        $originalContent = $content
        $fileUpdated = $false
        
        # Aplicar todos los reemplazos
        foreach ($key in $replacements.Keys) {
            if ($content -match [regex]::Escape($key)) {
                $content = $content -replace [regex]::Escape($key), $replacements[$key]
                $fileUpdated = $true
            }
        }
        
        # Si el contenido cambió, guardar el archivo
        if ($fileUpdated) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
            $updatedFiles++
            Write-Host "Actualizado: $($file.FullName)" -ForegroundColor Green
        }
    }
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Resumen:" -ForegroundColor Yellow
    Write-Host "  Total de archivos procesados: $totalFiles" -ForegroundColor White
    Write-Host "  Archivos actualizados: $updatedFiles" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Cyan
}

# Ejecutar la actualización
Write-Host "`nIniciando actualizacion de rutas de API...`n" -ForegroundColor Yellow
Update-Files -path $rootPath -replacements $replacements
Write-Host "Actualizacion completada!`n" -ForegroundColor Green
