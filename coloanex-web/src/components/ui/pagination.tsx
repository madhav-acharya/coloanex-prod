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
  className?: string;
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
  className,
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
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 border-t bg-gradient-to-r from-neutral-light/30 to-neutral-light/50", className)}>
      <div className="text-sm font-medium text-neutral-dark">
        Showing{" "}
        <span className="text-primary font-semibold">{startItem}</span> to{" "}
        <span className="text-primary font-semibold">{endItem}</span> of{" "}
        <span className="text-primary font-semibold">{total}</span> results
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={!hasPreviousPage}
          className={cn(
            "border-input hover:bg-muted hover:text-foreground transition-all duration-200",
            hasPreviousPage
              ? "cursor-pointer text-primary"
              : "cursor-not-allowed opacity-40",
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
            "border-input hover:bg-muted hover:text-foreground transition-all duration-200",
            hasPreviousPage
              ? "cursor-pointer text-primary"
              : "cursor-not-allowed opacity-40",
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
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-glow scale-105 cursor-pointer border-primary"
                  : page === "..."
                    ? "cursor-not-allowed border-transparent hover:border-transparent"
                    : "cursor-pointer border-input hover:bg-muted hover:text-foreground text-foreground",
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
            "border-input hover:bg-muted hover:text-foreground transition-all duration-200",
            hasNextPage
              ? "cursor-pointer text-primary"
              : "cursor-not-allowed opacity-40",
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
            "border hover:bg-muted/50 transition-all duration-200",
            hasNextPage
              ? "cursor-pointer text-foreground hover:border-border"
              : "cursor-not-allowed opacity-40",
          )}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>

        {onPageSizeChange && (
          <>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground whitespace-nowrap">
                Per page
              </span>
              <Select
                value={limit.toString()}
                onValueChange={(value) => onPageSizeChange(Number(value))}
              >
                <SelectTrigger className="w-[70px] h-9 cursor-pointer border hover:border-primary/50 focus:ring-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem
                      key={size}
                      value={size.toString()}
                      className="hover:bg-muted focus:bg-muted"
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
