export interface FilterField {
  name: string;
  label: string;
  type: "select" | "text";
  options?: { label: string; value: string }[];
  placeholder?: string;
  className?: string;
}

export interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "ghost";
  disabled?: boolean;
}
