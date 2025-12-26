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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 border-t bg-gradient-to-r from-neutral-light/30 to-neutral-light/50">
      <div className="text-sm font-medium text-neutral-dark">
        Showing{" "}
        <span className="text-green-600 font-semibold">{startItem}</span> to{" "}
        <span className="text-green-600 font-semibold">{endItem}</span> of{" "}
        <span className="text-green-600 font-semibold">{total}</span> results
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={!hasPreviousPage}
          className={cn(
            "border-green-200 hover:bg-green-50 hover:border-green-400 transition-all duration-200",
            hasPreviousPage
              ? "cursor-pointer text-green-700"
              : "cursor-not-allowed opacity-40"
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
            "border-green-200 hover:bg-green-50 hover:border-green-400 transition-all duration-200",
            hasPreviousPage
              ? "cursor-pointer text-green-700"
              : "cursor-not-allowed opacity-40"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1">
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
              disabled={page === "..."}
              className={cn(
                "min-w-9 font-semibold transition-all duration-200",
                page === currentPage
                  ? "bg-green-600 hover:bg-green-700 text-white hover:shadow-lg scale-105 cursor-pointer border-green-600"
                  : page === "..."
                  ? "cursor-not-allowed border-transparent hover:border-transparent"
                  : "cursor-pointer border-green-200 hover:bg-green-50 hover:border-green-400 hover:text-green-700 text-neutral-dark"
              )}
            >
              {page}
            </Button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
          className={cn(
            "border-green-200 hover:bg-green-50 hover:border-green-400 transition-all duration-200",
            hasNextPage
              ? "cursor-pointer text-green-700"
              : "cursor-not-allowed opacity-40"
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
            "border-gray-300 hover:bg-gray-100 transition-all duration-200",
            hasNextPage
              ? "cursor-pointer text-gray-700 hover:border-gray-400"
              : "cursor-not-allowed opacity-40"
          )}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>

        {onPageSizeChange && (
          <>
            <div className="h-6 w-px bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Per page
              </span>
              <Select
                value={limit.toString()}
                onValueChange={(value) => onPageSizeChange(Number(value))}
              >
                <SelectTrigger className="w-[70px] h-9 cursor-pointer border-gray-300 hover:border-gray-400 focus:ring-green-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem
                      key={size}
                      value={size.toString()}
                      className="hover:bg-green-50 focus:bg-green-50"
                    >
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
