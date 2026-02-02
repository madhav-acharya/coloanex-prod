import type { LucideIcon } from "lucide-react";

export interface Field {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  type?: string;
}

export interface PaginationProps {
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

export interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  isLoading?: boolean;
}

export interface DataCardProps {
  id: string;
  title: string;
  subtitle?: string;
  metadata?: string;
  icon?: LucideIcon;
  onView?: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  viewTitle?: string;
  editTitle?: string;
  deleteTitle?: string;
}
