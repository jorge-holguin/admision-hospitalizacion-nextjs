"use client"

import React, { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface DataTableProps<T> {
  data: T[]
  columns: {
    key: string
    header: string
    cell?: (item: T) => React.ReactNode
  }[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  isLoading?: boolean
  getRowClassName?: (item: T, index: number) => string
}

export function DataTable<T>({
  data,
  columns,
  pagination,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  getRowClassName,
}: DataTableProps<T>) {
  const { page, pageSize, total, totalPages } = pagination

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPagesToShow = 5
    
    if (totalPages <= maxPagesToShow) {
      // If total pages is less than max to show, display all pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Always include first page
      pageNumbers.push(1)
      
      // Calculate start and end of page range around current page
      let startPage = Math.max(2, page - 1)
      let endPage = Math.min(totalPages - 1, page + 1)
      
      // Adjust if we're near the start
      if (page <= 3) {
        endPage = Math.min(totalPages - 1, 4)
      }
      
      // Adjust if we're near the end
      if (page >= totalPages - 2) {
        startPage = Math.max(2, totalPages - 3)
      }
      
      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pageNumbers.push("ellipsis-start")
      }
      
      // Add pages in range
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i)
      }
      
      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push("ellipsis-end")
      }
      
      // Always include last page
      if (totalPages > 1) {
        pageNumbers.push(totalPages)
      }
    }
    
    return pageNumbers
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="rounded-md border overflow-x-auto table-responsive">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key} className="font-bold text-gray-900">{column.header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center font-medium text-gray-700"
                  >
                    Cargando datos...
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center font-medium text-gray-700"
                  >
                    No se encontraron resultados.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => (
                  <TableRow
                    key={index}
                    className={cn(
                      "border-b",
                      getRowClassName ? getRowClassName(item, index) : ""
                    )}
                  >
                    {columns.map((column) => (
                      <TableCell key={`${index}-${column.key}`} className="font-medium text-gray-800">
                        {column.cell
                          ? column.cell(item)
                          : (item as any)[column.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 pt-2">
        <div className="flex flex-col sm:flex-row items-center gap-2 text-sm font-medium text-gray-700">
          <div>
            Mostrando {data.length > 0 ? (page - 1) * pageSize + 1 : 0} a{" "}
            {Math.min(page * pageSize, total)} de {total} registros
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">Registros por página:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => onPageSizeChange(parseInt(value))}
            >
              <SelectTrigger className="h-8 w-full sm:w-[70px] font-medium">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (page > 1) onPageChange(page - 1)
                }}
                aria-disabled={page === 1}
                className={page === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>

            {getPageNumbers().map((pageNumber, i) => {
              if (pageNumber === "ellipsis-start" || pageNumber === "ellipsis-end") {
                return (
                  <PaginationItem key={`ellipsis-${i}`}>
                    <span className="flex flex-wrap h-9 w-9 items-center justify-center">
                      ...
                    </span>
                  </PaginationItem>
                )
              }
              
              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      onPageChange(pageNumber as number)
                    }}
                    isActive={pageNumber === page}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              )
            })}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (page < totalPages) onPageChange(page + 1)
                }}
                aria-disabled={page === totalPages}
                className={
                  page === totalPages ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </CardFooter>
    </Card>
  )
}
