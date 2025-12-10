import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormLabel } from "@/components/ui/form-label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet as UISheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Messages, type Message } from "@/components/shared/Messages";

interface Field {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  type?: string;
  options?: { value: string; label: string }[];
}

interface FormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  fields: Field[];
  onFieldChange: (fieldId: string, value: string) => void;
  onSubmit: () => Promise<void>;
  submitText?: string;
  cancelText?: string;
  isSubmitting?: boolean;
  messages?: Message[];
  children?: React.ReactNode;
  isReadOnly?: boolean;
}

export function FormSheet({
  open,
  onOpenChange,
  title,
  description,
  fields,
  onFieldChange,
  onSubmit,
  submitText = "Save",
  cancelText = "Cancel",
  isSubmitting = false,
  messages = [],
  children,
  isReadOnly = false,
}: FormSheetProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit();
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    onFieldChange(fieldId, value);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen);
    }
  };

  const isFormValid = fields
    .filter((field) => field.required)
    .every((field) => field.value.trim());

  return (
    <UISheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex flex-col h-full bg-white">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Fixed Header */}
          <div className="shrink-0">
            <SheetHeader>
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription>{description}</SheetDescription>
            </SheetHeader>

            <Messages messages={messages} className="px-6" />
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {fields.map((field) => (
              <div key={field.id} className="grid gap-2">
                <FormLabel
                  htmlFor={field.id}
                  required={field.required}
                  optional={field.required === false}
                >
                  {field.label}
                </FormLabel>
                {field.type === "select" && field.options ? (
                  <Select
                    value={field.value}
                    onValueChange={(value) =>
                      handleFieldChange(field.id, value)
                    }
                    disabled={field.disabled || isSubmitting || isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={field.placeholder || "Select..."}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === "textarea" ? (
                  <Textarea
                    id={field.id}
                    value={field.value}
                    onChange={(e) =>
                      handleFieldChange(field.id, e.target.value)
                    }
                    placeholder={field.placeholder}
                    disabled={field.disabled || isSubmitting || isReadOnly}
                    required={field.required}
                    rows={3}
                    readOnly={isReadOnly}
                  />
                ) : (
                  <Input
                    id={field.id}
                    type={field.type || "text"}
                    value={field.value}
                    onChange={(e) =>
                      handleFieldChange(field.id, e.target.value)
                    }
                    placeholder={field.placeholder}
                    disabled={field.disabled || isSubmitting || isReadOnly}
                    required={field.required}
                    readOnly={isReadOnly}
                  />
                )}
              </div>
            ))}
            {children}
          </div>

          {/* Fixed Footer */}
          {!isReadOnly && (
            <div className="shrink-0 border-t bg-background">
              <SheetFooter className="p-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isSubmitting}
                  className="cursor-pointer"
                >
                  {cancelText}
                </Button>
                <Button
                  type="submit"
                  className="cursor-pointer bg-green-500 hover:bg-green-600 border-green-500 hover:border-green-600 text-white"
                  disabled={isSubmitting || !isFormValid}
                >
                  {isSubmitting ? "Saving..." : submitText}
                </Button>
              </SheetFooter>
            </div>
          )}
          {isReadOnly && (
            <div className="shrink-0 border-t bg-background">
              <SheetFooter className="p-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  className="cursor-pointer"
                >
                  Close
                </Button>
              </SheetFooter>
            </div>
          )}
        </form>
      </SheetContent>
    </UISheet>
  );
}
