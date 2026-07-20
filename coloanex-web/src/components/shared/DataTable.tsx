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
import { GlassCard } from "@/components/shared/GlassCard";

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

  const renderActions = (row: T) => {
    if (!actions || actions.length === 0) return null;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="cursor-pointer min-h-11 min-w-11"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actions.map((action) => {
            if (action.show && !action.show(row)) return null;
            const actionStyle: React.CSSProperties = {};
            if (
              action.variant === "destructive" ||
              action.label.toLowerCase() === "delete" ||
              action.label.toLowerCase() === "logout"
            ) {
              actionStyle.color = "var(--color-danger)";
            } else if (action.label === "View") {
              actionStyle.color = "var(--color-info)";
            } else if (action.label === "Edit") {
              actionStyle.color = "var(--color-primary)";
            }
            return (
              <DropdownMenuItem
                key={action.label}
                onClick={() => action.onClick(row)}
                className="cursor-pointer"
                style={actionStyle}
              >
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  if (isLoading) {
    return (
      <>
        <div className="md:hidden space-y-3">
          {[...Array(4)].map((_, i) => (
            <GlassCard key={i} className="p-4 space-y-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </GlassCard>
          ))}
        </div>
        <div className="hidden md:block border border-border/60 rounded-xl overflow-hidden bg-card">
          <Table>
            <TableHeader className="bg-muted/50 border-b border-border/70">
              <TableRow>
                {selectable && <TableHead className="w-[50px]"></TableHead>}
                {columns.map((column) => (
                  <TableHead key={column.key} style={{ width: column.width }}>
                    {column.label}
                  </TableHead>
                ))}
                {actions && actions.length > 0 && (
                  <TableHead className="w-[100px]"></TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {selectable && (
                    <TableCell>
                      <Skeleton className="h-4 w-4 mx-auto" />
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
      </>
    );
  }

  if (data.length === 0) {
    return (
      <GlassCard className="flex flex-col items-center justify-center py-16 px-4">
        {emptyIcon && <div className="mb-4 text-muted-foreground">{emptyIcon}</div>}
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      </GlassCard>
    );
  }

  return (
    <>
      <div className="md:hidden space-y-3">
        {data.map((row) => {
          const rowId = getRowId(row);
          return (
            <GlassCard
              key={rowId}
              className="p-4 space-y-3"
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              <div className="flex items-start justify-between gap-2">
                {selectable ? (
                  <Checkbox
                    checked={selectedRows.has(rowId)}
                    onCheckedChange={(checked) =>
                      handleSelectRow(rowId, checked as boolean)
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 cursor-pointer"
                  />
                ) : (
                  <div />
                )}
                {renderActions(row)}
              </div>
              <div className="space-y-2.5">
                {columns.map((column) => (
                  <div
                    key={`${rowId}-${column.key}`}
                    className="flex items-start justify-between gap-3"
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0 pt-0.5">
                      {column.label}
                    </span>
                    <div className="text-sm text-foreground text-right min-w-0 break-words">
                      {column.render
                        ? column.render(row)
                        : String(
                            (row as Record<string, unknown>)[column.key] || "—",
                          )}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          );
        })}
      </div>

      <div className="hidden md:block border border-border/60 rounded-xl overflow-hidden bg-card">
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
            {data.map((row) => {
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
                      {renderActions(row)}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

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
