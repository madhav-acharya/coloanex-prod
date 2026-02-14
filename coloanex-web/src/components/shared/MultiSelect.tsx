import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, X, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { MultiSelectOption } from "@/types/components";

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
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
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

  const filteredOptions = options.filter((option) =>
    option.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}

      {selectedOptions.length > 0 && (
        <ScrollArea className="max-h-[220px] w-full overflow-auto">
          <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-md border">
            {selectedOptions.map((option) => (
              <span
                key={option.id}
                className="inline-flex items-center pl-3 pr-1 py-1.5 gap-1.5 bg-white dark:bg-green-900/30 text-green-700 dark:text-green-200 border-2 border-green-500 dark:border-green-700/50 hover:bg-green-50 dark:hover:bg-green-900/40 transition-colors shadow-sm rounded-full text-sm font-semibold"
              >
                <span>{option.name}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemove(option.id)}
                    className="ml-1 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-full p-1 cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </button>
                )}
              </span>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Only show dropdown in edit/add mode (when not disabled) */}
      {!disabled && (
        <div className="relative" ref={dropdownRef}>
          {/* Dropdown Trigger */}
          <Button
            type="button"
            variant="outline"
            onClick={() => !isLoading && setIsOpen(!isOpen)}
            disabled={isLoading}
            className="w-full justify-between cursor-pointer"
          >
            <span className="text-muted-foreground">
              {selectedOptions.length > 0
                ? `${selectedOptions.length} selected`
                : placeholder}
            </span>
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform",
                isOpen && "transform rotate-180",
              )}
            />
          </Button>

          {/* Dropdown Menu */}
          {isOpen && !disabled && (
            <div
              className="absolute z-50 w-full mt-2 !bg-popover border rounded-md shadow-lg"
              style={{ backgroundColor: "hsl(var(--popover))" }}
            >
              {/* Search Bar */}
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </div>
              <ScrollArea className="max-h-[250px]">
                {isLoading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Loading...
                  </div>
                ) : filteredOptions.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {searchQuery ? "No results found" : "No options available"}
                  </div>
                ) : (
                  <div className="p-2 space-y-1 max-h-[250px] overflow-y-auto">
                    {filteredOptions.map((option) => {
                      const isSelected = selectedIds.includes(option.id);
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleToggle(option.id)}
                          className={cn(
                            "w-full flex items-start gap-3 p-2 rounded-md text-left transition-colors cursor-pointer",
                            isSelected
                              ? "bg-primary/10 hover:bg-primary/20"
                              : "hover:bg-muted",
                          )}
                        >
                          <div
                            className={cn(
                              "w-4 h-4 mt-0.5 border rounded flex items-center justify-center shrink-0",
                              isSelected
                                ? "bg-primary border-primary"
                                : "border-input",
                            )}
                          >
                            {isSelected && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className={cn(
                                "text-sm font-medium truncate",
                                isSelected ? "text-primary" : "text-foreground",
                              )}
                            >
                              {option.name}
                            </div>
                            {option.description && (
                              <div className="text-xs text-muted-foreground mt-0.5 truncate">
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
      )}
    </div>
  );
}
