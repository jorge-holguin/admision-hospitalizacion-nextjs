"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

interface PatientSearchBarProps {
  onSearch: (searchTerm: string, searchType: string) => void
  searchTerm: string
  setSearchTerm: (term: string) => void
}

export function PatientSearchBar({ onSearch, searchTerm, setSearchTerm }: PatientSearchBarProps) {
  const [searchType, setSearchType] = useState("documento")

  const handleSearch = () => {
    onSearch(searchTerm, searchType)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Select value={searchType} onValueChange={setSearchType}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="documento">Documento</SelectItem>
          <SelectItem value="nombre">Nombre</SelectItem>
          <SelectItem value="hc">Historia Clínica</SelectItem>
        </SelectContent>
      </Select>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="text"
          placeholder="Buscar por DNI (mín. 8 dígitos)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-10 h-12 text-lg border-2 border-gray-300 focus:border-blue-500"
        />
      </div>
      <Button 
        onClick={handleSearch}
        className="bg-black hover:bg-gray-800 px-8 w-full sm:w-auto"
      >
        Buscar
      </Button>
    </div>
  )
}
