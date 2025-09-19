'use client';

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function TablePagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  className = '',
}: TablePaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalItems <= itemsPerPage) {
    return null;
  }

  // Calculate visible page numbers with ellipsis
  const getPageNumbers = () => {
    const range: (number | string)[] = [];

    // Always show first page
    range.push(1);

    // Show ellipsis if current page is far from start
    if (currentPage > 3) {
      range.push('...');
    }

    // Show pages around current page
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== totalPages) {
        range.push(i);
      }
    }

    // Show ellipsis if current page is far from end
    if (currentPage < totalPages - 2) {
      range.push('...');
    }

    // Always show last page if different from first
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  };

  return (
    <div
      className={`w-full flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 ${className}`}
    >
      <div className="text-xs text-muted-foreground w-full">
        Mostrando{' '}
        <span className="font-medium">
          {startItem}-{endItem}
        </span>{' '}
        de <span className="font-medium">{totalItems}</span> registros
      </div>

      <Pagination className="w-full flex justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationLink
              href="#"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                if (currentPage > 1) onPageChange(currentPage - 1);
              }}
              className={cn(
                'h-9 w-9 p-0 flex items-center justify-center',
                currentPage === 1 ? 'pointer-events-none opacity-40' : 'hover:bg-accent'
              )}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Anterior</span>
            </PaginationLink>
          </PaginationItem>

          {getPageNumbers().map((pageNum, index) =>
            pageNum === '...' ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <span className="px-2 text-muted-foreground">...</span>
              </PaginationItem>
            ) : (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  href="#"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    onPageChange(pageNum as number);
                  }}
                  isActive={currentPage === pageNum}
                  className={cn(
                    'h-9 w-9 p-0 flex items-center justify-center',
                    'hover:bg-accent transition-colors',
                    currentPage === pageNum ? 'font-semibold' : ''
                  )}
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationLink
              href="#"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                if (currentPage < totalPages) onPageChange(currentPage + 1);
              }}
              className={cn(
                'h-9 w-9 p-0 flex items-center justify-center',
                currentPage === totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-accent'
              )}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Siguiente</span>
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
