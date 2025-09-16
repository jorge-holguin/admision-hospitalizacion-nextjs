// Función para cargar y combinar las definiciones de Swagger
async function loadSwaggerDefinitions() {
  const ui = window.ui; // Referencia a la instancia de SwaggerUI
  
  try {
    // Cargar definiciones de citas
    const citasResponse = await fetch('/swagger-citas.json');
    const citasData = await citasResponse.json();
    
    // Cargar definiciones de emergencias
    const emergenciasResponse = await fetch('/swagger-emergencias.json');
    const emergenciasData = await emergenciasResponse.json();
    
    // Cargar definiciones de hospitalización
    const hospitalizacionResponse = await fetch('/swagger-hospitalizacion.json');
    const hospitalizacionData = await hospitalizacionResponse.json();
    
    // Cargar definiciones de tablas maestras
    const tablasMaestrasResponse = await fetch('/swagger-tablas-maestras.json');
    const tablasMaestrasData = await tablasMaestrasResponse.json();
    
    // Cargar definiciones de filiación
    const filiacionResponse = await fetch('/swagger-filiacion.json');
    const filiacionData = await filiacionResponse.json();
    
    // Combinar todas las definiciones
    const combinedSpec = {
      ...ui.specSelectors.specJson().toJS(),
      paths: {
        ...ui.specSelectors.specJson().toJS().paths,
        ...citasData.paths,
        ...emergenciasData.paths,
        ...hospitalizacionData.paths,
        ...tablasMaestrasData.paths,
        ...filiacionData.paths
      },
      components: {
        schemas: {
          ...citasData.components?.schemas,
          ...emergenciasData.components?.schemas,
          ...hospitalizacionData.components?.schemas,
          ...tablasMaestrasData.components?.schemas,
          ...filiacionData.components?.schemas
        }
      }
    };
    
    // Actualizar la especificación de Swagger UI
    ui.specActions.updateSpec(JSON.stringify(combinedSpec));
    
    console.log('Todas las definiciones de API cargadas correctamente');
  } catch (error) {
    console.error('Error cargando definiciones de API:', error);
  }
}

// Exportar la función para usarla en swagger.html
window.loadSwaggerDefinitions = loadSwaggerDefinitions;
