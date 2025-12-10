import { useState, useRef } from "react";
import { Upload, X, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface UploadedFile {
  id?: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  sizeInBytes: number;
  preview?: string;
}

interface FileUploaderProps {
  label: string;
  accept: string;
  multiple?: boolean;
  maxFiles?: number;
  value: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  disabled?: boolean;
  required?: boolean;
}

export function FileUploader({
  label,
  accept,
  multiple = false,
  maxFiles,
  value = [],
  onChange,
  disabled = false,
  required = false,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImage = (mimeType: string) => mimeType.startsWith("image/");
  const isPdf = (mimeType: string) => mimeType === "application/pdf";

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    const maxAllowed = maxFiles ? maxFiles - value.length : filesArray.length;
    const filesToProcess = filesArray.slice(0, maxAllowed);

    const newFiles: UploadedFile[] = await Promise.all(
      filesToProcess.map(async (file) => {
        const preview = isImage(file.type)
          ? await readFileAsDataURL(file)
          : undefined;

        return {
          fileUrl: URL.createObjectURL(file),
          fileName: file.name,
          mimeType: file.type,
          sizeInBytes: file.size,
          preview,
        };
      })
    );

    onChange([...value, ...newFiles]);
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index);
    onChange(newFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const canAddMore = !maxFiles || value.length < maxFiles;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {canAddMore && (
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            isDragging
              ? "border-green-500 bg-green-50"
              : "border-gray-300 hover:border-green-400",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 mb-1">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-gray-500">
            {accept.includes("image") && accept.includes("pdf")
              ? "Images or PDF"
              : accept.includes("image")
              ? "Images only"
              : "PDF only"}
            {maxFiles && ` (${value.length}/${maxFiles})`}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={disabled}
          />
        </div>
      )}

      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mt-3">
          {value.map((file, index) => (
            <div
              key={index}
              className="relative border rounded-lg overflow-hidden group"
            >
              {isImage(file.mimeType) && file.preview ? (
                <img
                  src={file.preview}
                  alt={file.fileName}
                  className="w-full h-32 object-cover"
                />
              ) : isPdf(file.mimeType) ? (
                <div className="w-full h-32 bg-gray-100 flex flex-col items-center justify-center">
                  <FileText className="w-12 h-12 text-red-500 mb-2" />
                  <span className="text-xs text-gray-600 px-2 text-center truncate w-full">
                    {file.fileName}
                  </span>
                </div>
              ) : (
                <div className="w-full h-32 bg-gray-100 flex flex-col items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                  <span className="text-xs text-gray-600">{file.fileName}</span>
                </div>
              )}

              <div className="p-2 bg-white">
                <p className="text-xs text-gray-600 truncate">
                  {file.fileName}
                </p>
                <p className="text-xs text-gray-400">
                  {formatFileSize(file.sizeInBytes)}
                </p>
              </div>

              {!disabled && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeFile(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
