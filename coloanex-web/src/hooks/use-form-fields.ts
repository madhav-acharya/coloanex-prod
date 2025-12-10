import { useState, useCallback } from "react";

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

export function useFormFields(initialFields: Field[]) {
  const [fields, setFields] = useState<Field[]>(initialFields);

  const updateField = useCallback((fieldId: string, value: string) => {
    setFields((prev) =>
      prev.map((field) => (field.id === fieldId ? { ...field, value } : field))
    );
  }, []);

  const resetFields = useCallback(() => {
    setFields(initialFields);
  }, [initialFields]);

  const setFieldValues = useCallback((values: Record<string, string>) => {
    setFields((prev) =>
      prev.map((field) => ({
        ...field,
        value: values[field.id] ?? field.value,
      }))
    );
  }, []);

  const getFieldValues = useCallback(() => {
    return fields.reduce((acc, field) => {
      acc[field.id] = field.value;
      return acc;
    }, {} as Record<string, string>);
  }, [fields]);

  const isValid = useCallback(() => {
    return fields
      .filter((field) => field.required)
      .every((field) => field.value.trim());
  }, [fields]);

  return {
    fields,
    updateField,
    resetFields,
    setFieldValues,
    getFieldValues,
    isValid,
  };
}
