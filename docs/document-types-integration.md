# Document Types Integration

This document describes the implementation of dynamic document types in the Hospital Management System.

## Overview

Document types (TIPO_DOCUMENTO) are now fetched dynamically from the database instead of using hardcoded values. This ensures consistency across the application and allows for easier management of document types.

## Implementation Details

### Backend

1. **Service Layer**
   - Created `tipoDocumentoService.ts` in `services/hospitalizacion/` to handle database operations
   - Implemented methods to fetch all active document types and get document type by code
   - Used Prisma client for database access

2. **API Endpoint**
   - Created API route at `/api/tipo-documento` to serve document types data
   - Supports optional search and code query parameters
   - Returns JSON data with proper error handling

### Frontend

1. **Components Updated**
   - `PatientInfoCardEmergency`: Now displays document type dynamically from API data
   - `EmergencyFormRefactored`: Fetches document types from API and uses them throughout the form
   - `AdditionalFieldsSection`: Uses document types from API for accompanying person fields

2. **Data Flow**
   - Document types are fetched once on component mount
   - Stored in component state for use throughout the form
   - Loading states and fallback options implemented for better UX

## Usage

To use document types in a component:

```typescript
// 1. Import useState and useEffect
import { useState, useEffect } from 'react';

// 2. Define state for document types
const [tiposDocumento, setTiposDocumento] = useState<any[]>([]);
const [loadingTiposDocumento, setLoadingTiposDocumento] = useState(false);

// 3. Fetch document types on component mount
useEffect(() => {
  const fetchTiposDocumento = async () => {
    try {
      setLoadingTiposDocumento(true);
      const response = await fetch('/api/tipo-documento');
      if (!response.ok) throw new Error('Error fetching document types');
      const data = await response.json();
      setTiposDocumento(data.items || []);
    } catch (error) {
      console.error('Error loading document types:', error);
    } finally {
      setLoadingTiposDocumento(false);
    }
  };
  
  fetchTiposDocumento();
}, []);

// 4. Use document types in your component
// Example: Populate a select dropdown
{loadingTiposDocumento ? (
  <Spinner size="sm" />
) : (
  <Select
    value={selectedDocumentType}
    onValueChange={(value) => setSelectedDocumentType(value)}
  >
    {tiposDocumento.map((tipo) => (
      <SelectItem key={tipo.TIPO_DOCUMENTO} value={tipo.TIPO_DOCUMENTO}>
        {tipo.NOMBRE}
      </SelectItem>
    ))}
  </Select>
)}
```

## API Reference

### GET /api/tipo-documento

Fetches all active document types.

**Query Parameters:**
- `search` (optional): Filter document types by name
- `code` (optional): Get document type by specific code

**Response:**
```json
{
  "items": [
    {
      "TIPO_DOCUMENTO": "01",
      "NOMBRE": "DNI",
      "ACTIVO": "1"
    },
    {
      "TIPO_DOCUMENTO": "02",
      "NOMBRE": "Carnet de Extranjería",
      "ACTIVO": "1"
    }
  ]
}
```
