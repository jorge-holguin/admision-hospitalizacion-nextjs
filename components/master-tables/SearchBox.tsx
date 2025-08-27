import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";

// Debounce helper function
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface SearchBoxProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchType: string;
  setSearchType: (type: string) => void;
  handleSearch: () => void;
  isLoading: boolean;
  isSearching: boolean;
  searchTypes: Array<{
    value: string;
    label: string;
    minLength?: number;
  }>;
  handleFilterChange: (filter: any) => void;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  searchTerm,
  setSearchTerm,
  searchType,
  setSearchType,
  handleSearch,
  isLoading,
  isSearching,
  searchTypes,
  handleFilterChange,
}) => {
  return (
    <div className="flex items-center space-x-2">
      <div className="w-[200px]">
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={searchType}
          onChange={(e) => {
            setSearchType(e.target.value);
            setSearchTerm(""); // Clear search term when changing search type
          }}
        >
          {searchTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
      <div className="relative flex-1">
        {/* Search icon (always visible) */}
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />

        <Input
          placeholder={`Buscar por ${
            searchTypes.find((t) => t.value === searchType)?.label || searchType
          }`}
          className="pl-8 pr-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={isLoading}
        />

        {/* Single clear button */}
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              handleFilterChange({});
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            disabled={isLoading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>
      <Button
        type="submit"
        onClick={handleSearch}
        disabled={isLoading || isSearching}
      >
        {isLoading || isSearching ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Buscando...
          </>
        ) : (
          "Buscar"
        )}
      </Button>
    </div>
  );
};
