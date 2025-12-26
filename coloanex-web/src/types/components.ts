import { ReactNode } from "react";
import { UploadedFile } from "./upload";

export type MessageType = "success" | "error" | "warning" | "info";

export interface Message {
  id?: string;
  type: MessageType;
  title?: string;
  description: string;
}

export interface MultiSelectOption {
  id: string;
  name: string;
  description?: string;
}

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => ReactNode;
  width?: string;
}

export interface FormField {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  type?: string;
  options?: { value: string; label: string }[];
}

export interface FileField {
  label: string;
  accept: "image" | "pdf" | "image,pdf";
  multiple?: boolean;
  maxFiles?: number;
  folder: string;
  value: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  required?: boolean;
}

export interface FormSection {
  title?: string;
  fields?: FormField[];
  fileFields?: FileField[];
  condition?: boolean;
  customContent?: ReactNode;
}
