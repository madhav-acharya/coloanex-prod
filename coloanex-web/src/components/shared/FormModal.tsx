import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormLabel } from "@/components/ui/form-label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Messages } from "@/components/shared/Messages";
import { FileUploader } from "@/components/shared/FileUploader";
import { FormField, FileField, FormSection, Message } from "@/types/components";
import { modalEnter } from "@/utils/anime";
import { cn } from "@/lib/utils";

interface FormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  sections?: FormSection[];
  onFieldChange: (fieldId: string, value: string) => void;
  onSubmit: () => Promise<void>;
  submitText?: string;
  cancelText?: string;
  isSubmitting?: boolean;
  messages?: Message[];
  children?: React.ReactNode;
  isReadOnly?: boolean;
  className?: string;
}

export function FormModal({
  open,
  onOpenChange,
  title,
  description,
  sections = [],
  onFieldChange,
  onSubmit,
  submitText = "Save",
  cancelText = "Cancel",
  isSubmitting = false,
  messages = [],
  children,
  isReadOnly = false,
  className,
}: FormModalProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open && contentRef.current) {
      modalEnter(contentRef.current);
    }
  }, [open]);

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

  const allFields = sections
    .filter((section) => section.condition !== false)
    .flatMap((section) => section.fields || []);

  const isFormValid = allFields
    .filter((field) => field.required)
    .every((field) => field.value && field.value.trim());

  const visibleSections = sections.filter(
    (section) => section.condition !== false,
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={!isSubmitting}
        className={cn(
          "flex flex-col p-0 gap-0 max-h-[90dvh] w-[calc(100vw-24px)] sm:max-w-2xl overflow-hidden",
          className,
        )}
      >
        <div ref={contentRef} className="flex flex-col max-h-[90dvh]">
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
            <DialogHeader className="shrink-0 px-6 pt-6 pb-3 text-left">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>

            <Messages messages={messages} className="px-6" />

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 min-h-0">
              {children}

              {visibleSections.map((section, sectionIndex) => (
                <div key={sectionIndex}>
                  {(sectionIndex > 0 || children) && (
                    <Separator className="mb-6" />
                  )}

                  {section.customContent ? (
                    <div>{section.customContent}</div>
                  ) : (
                    <div className="space-y-4">
                      {section.title && (
                        <h3 className="text-sm font-semibold text-foreground">
                          {section.title}
                        </h3>
                      )}

                      {section.fields && section.fields.length > 0 && (
                        <div className="space-y-4">
                          {section.fields.map((field: FormField) => (
                            <div key={field.id} className="space-y-2">
                              <FormLabel
                                htmlFor={field.id}
                                required={field.required}
                              >
                                {field.label}
                              </FormLabel>
                              {field.type === "select" && field.options ? (
                                <Select
                                  value={field.value || undefined}
                                  onValueChange={(value) =>
                                    handleFieldChange(field.id, value)
                                  }
                                  disabled={
                                    field.disabled || isSubmitting || isReadOnly
                                  }
                                >
                                  <SelectTrigger id={field.id}>
                                    <SelectValue
                                      placeholder={
                                        field.placeholder || "Select..."
                                      }
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {field.options.map((option) => (
                                      <SelectItem
                                        key={option.value}
                                        value={option.value}
                                      >
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
                                  disabled={
                                    field.disabled || isSubmitting || isReadOnly
                                  }
                                  required={field.required}
                                  readOnly={isReadOnly}
                                />
                              ) : field.type === "switch" ? (
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id={field.id}
                                    checked={Boolean(field.value)}
                                    onCheckedChange={(checked) =>
                                      handleFieldChange(
                                        field.id,
                                        String(checked),
                                      )
                                    }
                                    disabled={
                                      field.disabled ||
                                      isSubmitting ||
                                      isReadOnly
                                    }
                                  />
                                </div>
                              ) : (
                                <Input
                                  id={field.id}
                                  type={field.type || "text"}
                                  value={field.value}
                                  onChange={(e) =>
                                    handleFieldChange(field.id, e.target.value)
                                  }
                                  placeholder={field.placeholder}
                                  disabled={
                                    field.disabled || isSubmitting || isReadOnly
                                  }
                                  required={field.required}
                                  readOnly={isReadOnly}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {section.fileFields && section.fileFields.length > 0 && (
                        <div className="space-y-4">
                          {section.fileFields.map(
                            (fileField: FileField, fIndex: number) => (
                              <FileUploader
                                key={fIndex}
                                label={fileField.label}
                                accept={fileField.accept}
                                multiple={fileField.multiple}
                                maxFiles={fileField.maxFiles}
                                folder={fileField.folder}
                                value={fileField.value}
                                onChange={fileField.onChange}
                                required={fileField.required}
                                disabled={isReadOnly}
                              />
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <DialogFooter className="shrink-0 border-t border-border/50 bg-card px-6 py-4">
              {!isReadOnly ? (
                <>
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
                    className="cursor-pointer bg-primary text-primary-foreground"
                    disabled={isSubmitting || !isFormValid}
                  >
                    {isSubmitting ? "Saving..." : submitText}
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  className="cursor-pointer"
                >
                  Close
                </Button>
              )}
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { FormModal as FormSheet };
