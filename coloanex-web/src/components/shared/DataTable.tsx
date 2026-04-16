import { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import { Column } from "@/types/components";
import { Skeleton } from "@/components/ui/skeleton";

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  onRowClick?: (row: T) => void;
  actions?: {
    label: string;
    icon?: ReactNode;
    onClick: (row: T) => void;
    variant?: "default" | "destructive";
    show?: (row: T) => boolean;
  }[];
  selectable?: boolean;
  selectedRows?: Set<string>;
  onSelectionChange?: (selected: Set<string>) => void;
  getRowId?: (row: T) => string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (key: string) => void;
}

export function DataTable<T>({
  data,
  columns,
  isLoading,
  emptyMessage = "No data found",
  emptyIcon,
  onRowClick,
  actions,
  selectable,
  selectedRows = new Set(),
  onSelectionChange,
  getRowId = (row: T) => (row as { id: string }).id,
  sortBy,
  onSort,
}: DataTableProps<T>) {
  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      const allIds = new Set(data.map((row) => getRowId(row)));
      onSelectionChange(allIds);
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (!onSelectionChange) return;
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    onSelectionChange(newSelected);
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50 border-b border-border/70">
            <TableRow>
              {selectable && <TableHead className="w-[50px]"></TableHead>}
              {columns.map((column) => (
                <TableHead key={column.key} style={{ width: column.width }}>
                  {column.label}
                </TableHead>
              ))}
              {actions && actions.length > 0 && <TableHead className="w-[100px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {selectable && (
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <Skeleton className="h-4 w-4" />
                    </div>
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    <Skeleton className="h-4 w-full max-w-[120px]" />
                  </TableCell>
                ))}
                {actions && actions.length > 0 && (
                  <TableCell>
                    <Skeleton className="h-8 w-8 ml-auto" />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader className="bg-muted/50 border-b border-border/70">
          <TableRow className="hover:bg-transparent">
            {selectable && (
              <TableHead className="w-[50px]">
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={
                      data.length > 0 &&
                      data.every((row) => selectedRows.has(getRowId(row)))
                    }
                    onCheckedChange={handleSelectAll}
                    className="cursor-pointer"
                    aria-label="Select all rows"
                  />
                </div>
              </TableHead>
            )}
            {columns.map((column) => (
              <TableHead key={column.key} style={{ width: column.width }}>
                {column.sortable && onSort ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 cursor-pointer"
                    onClick={() => onSort(column.key)}
                  >
                    {column.label}
                    <ArrowUpDown
                      className={`ml-2 h-4 w-4 ${
                        sortBy === column.key ? "text-primary" : ""
                      }`}
                    />
                  </Button>
                ) : (
                  column.label
                )}
              </TableHead>
            ))}
            {actions && actions.length > 0 && (
              <TableHead className="w-[100px]">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={
                  columns.length +
                  (selectable ? 1 : 0) +
                  (actions && actions.length > 0 ? 1 : 0)
                }
                className="h-64 text-center"
              >
                <div className="flex flex-col items-center justify-center">
                  {emptyIcon && <div className="mb-4">{emptyIcon}</div>}
                  <p className="text-muted-foreground">{emptyMessage}</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => {
              const rowId = getRowId(row);
              return (
                <TableRow
                  key={rowId}
                  className={onRowClick ? "cursor-pointer" : ""}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.has(rowId)}
                        onCheckedChange={(checked) =>
                          handleSelectRow(rowId, checked as boolean)
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="cursor-pointer"
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={`${rowId}-${column.key}`}>
                      {column.render
                        ? column.render(row)
                        : String(
                            (row as Record<string, unknown>)[column.key] || "",
                          )}
                    </TableCell>
                  ))}
                  {actions && actions.length > 0 && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="cursor-pointer"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {actions.map((action) => {
                            if (action.show && !action.show(row)) return null;

                            const actionStyle: React.CSSProperties = {};
                            if (action.variant === "destructive" || action.label.toLowerCase() === "delete" || action.label.toLowerCase() === "logout") {
                              actionStyle.color = 'var(--color-danger)';
                            } else if (action.label === "View") {
                              actionStyle.color = 'var(--color-info)';
                            } else if (action.label === "Edit") {
                              actionStyle.color = 'var(--color-primary)';
                            }

                            return (
                              <DropdownMenuItem
                                key={action.label}
                                onClick={() => action.onClick(row)}
                                className="cursor-pointer"
                                style={actionStyle}
                              >
                                {action.icon && (
                                  <span className="mr-2">{action.icon}</span>
                                )}
                                {action.label}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// Export table components for direct use
export {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Badge,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
};
