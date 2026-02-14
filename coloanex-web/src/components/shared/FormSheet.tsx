import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormLabel } from "@/components/ui/form-label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Sheet as UISheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Messages } from "@/components/shared/Messages";
import { FileUploader } from "@/components/shared/FileUploader";
import { FormField, FileField, FormSection, Message } from "@/types/components";

interface FormSheetProps {
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
}

export function FormSheet({
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
    <UISheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex flex-col h-full !bg-background">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="shrink-0">
            <SheetHeader>
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription>{description}</SheetDescription>
            </SheetHeader>

            <Messages messages={messages} className="px-6" />
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
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
                      <h3 className="text-sm font-semibold">{section.title}</h3>
                    )}

                    {section.fields && section.fields.length > 0 && (
                      <div className="space-y-4">
                        {section.fields.map((field) => (
                          <div key={field.id} className="space-y-2">
                            <FormLabel
                              htmlFor={field.id}
                              required={field.required}
                            >
                              {field.label}
                            </FormLabel>
                            {field.type === "select" && field.options ? (
                              <select
                                id={field.id}
                                value={field.value}
                                onChange={(e) =>
                                  handleFieldChange(field.id, e.target.value)
                                }
                                className="w-full h-10 px-3 py-2 text-sm bg-input text-foreground border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer hover:bg-muted transition-colors"
                                disabled={
                                  field.disabled || isSubmitting || isReadOnly
                                }
                                required={field.required}
                              >
                                <option value="">
                                  {field.placeholder || "Select..."}
                                </option>
                                {field.options.map((option) => (
                                  <option
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </option>
                                ))}
                              </select>
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
                                    handleFieldChange(field.id, String(checked))
                                  }
                                  disabled={
                                    field.disabled || isSubmitting || isReadOnly
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
                        {section.fileFields.map((fileField, fIndex) => (
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
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

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
