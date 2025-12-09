import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export function Pagination({
  currentPage,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  total,
  limit,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}: PaginationProps) {
  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, total);

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const half = Math.floor(maxVisiblePages / 2);
      let start = Math.max(1, currentPage - half);
      const end = Math.min(totalPages, start + maxVisiblePages - 1);

      if (end - start + 1 < maxVisiblePages) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }

      if (start > 1) {
        pages.push(1);
        if (start > 2) {
          pages.push("...");
        }
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages) {
        if (end < totalPages - 1) {
          pages.push("...");
        }
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = generatePageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
      <div className="text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {total} results
      </div>
      <div className="flex items-center gap-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={!hasPreviousPage}
          className={cn(
            hasPreviousPage ? "cursor-pointer" : "cursor-not-allowed opacity-50"
          )}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPreviousPage}
          className={cn(
            hasPreviousPage ? "cursor-pointer" : "cursor-not-allowed opacity-50"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pageNumbers.map((page, index) => (
          <Button
            key={index}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (typeof page === "number") {
                onPageChange(page);
              }
            }}
            disabled={page === "..." || page === currentPage}
            className={cn(
              "min-w-8",
              page === currentPage
                ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                : page === "..."
                ? "cursor-not-allowed"
                : "cursor-pointer"
            )}
          >
            {page}
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
          className={cn(
            hasNextPage ? "cursor-pointer" : "cursor-not-allowed opacity-50"
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={!hasNextPage}
          className={cn(
            hasNextPage ? "cursor-pointer" : "cursor-not-allowed opacity-50"
          )}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>

        {onPageSizeChange && (
          <>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Per page
              </span>
              <Select
                value={limit.toString()}
                onValueChange={(value) => onPageSizeChange(Number(value))}
              >
                <SelectTrigger className="w-[70px] h-9 cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
