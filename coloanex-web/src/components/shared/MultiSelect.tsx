import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  id: string;
  name: string;
  description?: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

export function MultiSelect({
  options,
  selectedIds,
  onChange,
  placeholder = "Select items...",
  label,
  disabled = false,
  isLoading = false,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (optionId: string) => {
    if (selectedIds.includes(optionId)) {
      onChange(selectedIds.filter((id) => id !== optionId));
    } else {
      onChange([...selectedIds, optionId]);
    }
  };

  const handleRemove = (optionId: string) => {
    onChange(selectedIds.filter((id) => id !== optionId));
  };

  const selectedOptions = options.filter((opt) => selectedIds.includes(opt.id));

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}

      <div className="relative" ref={dropdownRef}>
        {/* Dropdown Trigger */}
        <Button
          type="button"
          variant="outline"
          onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
          disabled={disabled || isLoading}
          className="w-full justify-between cursor-pointer"
        >
          <span className="text-gray-500">
            {selectedOptions.length > 0
              ? `${selectedOptions.length} selected`
              : placeholder}
          </span>
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform",
              isOpen && "transform rotate-180"
            )}
          />
        </Button>

        {/* Dropdown Menu */}
        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-md shadow-lg">
            <ScrollArea className="max-h-[300px]">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  Loading...
                </div>
              ) : options.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No options available
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {options.map((option) => {
                    const isSelected = selectedIds.includes(option.id);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleToggle(option.id)}
                        className={cn(
                          "w-full flex items-start gap-3 p-2 rounded-md text-left transition-colors cursor-pointer",
                          isSelected
                            ? "bg-green-50 hover:bg-green-100"
                            : "hover:bg-gray-50"
                        )}
                      >
                        <div
                          className={cn(
                            "w-4 h-4 mt-0.5 border rounded flex items-center justify-center shrink-0",
                            isSelected
                              ? "bg-green-600 border-green-600"
                              : "border-gray-300"
                          )}
                        >
                          {isSelected && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className={cn(
                              "text-sm font-medium",
                              isSelected ? "text-green-700" : "text-gray-900"
                            )}
                          >
                            {option.name}
                          </div>
                          {option.description && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              {option.description}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Selected Items as Badges */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md border border-gray-200">
          {selectedOptions.map((option) => (
            <Badge
              key={option.id}
              variant="secondary"
              className="pl-3 pr-1 py-1 flex items-center gap-1 bg-green-100 text-green-700 hover:bg-green-200"
            >
              <span className="text-sm">{option.name}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(option.id)}
                  className="ml-1 hover:bg-green-300 rounded-full p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
