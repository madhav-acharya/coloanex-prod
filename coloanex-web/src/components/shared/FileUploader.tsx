import { useState, useRef } from "react";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useUploadSingleMutation,
  useUploadMultipleMutation,
} from "@/apis/uploadApi";
import { toast } from "sonner";
import { UploadedFile } from "@/types/upload";

interface FileUploaderProps {
  label: string;
  accept: "image" | "pdf" | "image,pdf";
  multiple?: boolean;
  maxFiles?: number;
  value: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  disabled?: boolean;
  required?: boolean;
  folder?: string;
  maxSizeInMB?: number;
}

export function FileUploader({
  label,
  accept,
  multiple = false,
  maxFiles = 1,
  value = [],
  onChange,
  disabled = false,
  required = false,
  folder = "coloanex",
  maxSizeInMB = 5,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadSingle, { isLoading: isUploadingSingle }] =
    useUploadSingleMutation();
  const [uploadMultiple, { isLoading: isUploadingMultiple }] =
    useUploadMultipleMutation();

  const isUploading = isUploadingSingle || isUploadingMultiple;

  const getFileType = (): "image" | "pdf" | "document" => {
    if (accept === "image") return "image";
    if (accept === "pdf") return "pdf";
    return "image";
  };

  const getAcceptString = (): string => {
    if (accept === "image") return "image/jpeg,image/jpg,image/png,image/webp";
    if (accept === "pdf") return "application/pdf";
    return "image/jpeg,image/jpg,image/png,image/webp,application/pdf";
  };

  const isImage = (mimeType: string) => mimeType.startsWith("image/");
  const isPdf = (mimeType: string) => mimeType === "application/pdf";

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);

    if (!multiple && filesArray.length > 1) {
      toast.error("Only one file is allowed");
      return;
    }

    if (maxFiles && value.length + filesArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} file${maxFiles > 1 ? "s" : ""} allowed`);
      return;
    }

    const fileType = getFileType();
    const validFiles = filesArray.filter((file) => {
      if (fileType === "image" && !isImage(file.type)) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      if (fileType === "pdf" && !isPdf(file.type)) {
        toast.error(`${file.name} is not a PDF`);
        return false;
      }
      if (file.size > maxSizeInMB * 1024 * 1024) {
        toast.error(`${file.name} exceeds ${maxSizeInMB}MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    try {
      if (multiple || validFiles.length > 1) {
        const formData = new FormData();
        validFiles.forEach((file) => formData.append("files", file));
        if (folder) formData.append("folder", folder);
        if (fileType) formData.append("fileType", fileType);
        if (maxSizeInMB) formData.append("maxSizeInMB", maxSizeInMB.toString());
        formData.append("maxFiles", maxFiles.toString());

        const uploadedFiles = await uploadMultiple(formData).unwrap();

        const newFiles: UploadedFile[] = uploadedFiles.map(
          (uploaded, index) => ({
            url: uploaded.url,
            publicId: uploaded.publicId,
            fileName: validFiles[index].name,
            mimeType: validFiles[index].type,
            sizeInBytes: uploaded.bytes,
          })
        );

        onChange([...value, ...newFiles]);
        toast.success(
          `${newFiles.length} file${
            newFiles.length > 1 ? "s" : ""
          } uploaded successfully`
        );
      } else {
        const formData = new FormData();
        formData.append("file", validFiles[0]);
        if (folder) formData.append("folder", folder);
        if (fileType) formData.append("fileType", fileType);
        if (maxSizeInMB) formData.append("maxSizeInMB", maxSizeInMB.toString());

        const uploaded = await uploadSingle(formData).unwrap();

        const newFile: UploadedFile = {
          url: uploaded.url,
          publicId: uploaded.publicId,
          fileName: validFiles[0].name,
          mimeType: validFiles[0].type,
          sizeInBytes: uploaded.bytes,
        };

        onChange([...value, newFile]);
        toast.success("File uploaded successfully");
      }
    } catch (error) {
      const err = error as { data?: { message?: string } };
      toast.error(err.data?.message || "Upload failed");
    }
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

  const canAddMore = value.length < maxFiles;
  const isSingleFile = maxFiles === 1;

  if (isSingleFile && value.length === 1) {
    const file = value[0];
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative border-2 border-dashed rounded-lg overflow-hidden group w-full h-40">
          {isImage(file.mimeType) ? (
            <img
              src={file.url}
              alt={file.fileName}
              className="w-full h-full object-cover"
            />
          ) : isPdf(file.mimeType) ? (
            <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center">
              <FileText className="w-16 h-16 text-red-500 mb-2" />
              <span className="text-sm text-gray-600 px-2 text-center truncate w-full">
                {file.fileName}
              </span>
              <span className="text-xs text-gray-400 mt-1">
                {formatFileSize(file.sizeInBytes)}
              </span>
            </div>
          ) : null}

          {!disabled && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => removeFile(0)}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {value.length > 0 && multiple && (
        <div className="grid grid-cols-3 gap-2">
          {value.map((file, index) => (
            <div
              key={index}
              className="relative border rounded-lg overflow-hidden group h-24"
            >
              {isImage(file.mimeType) ? (
                <img
                  src={file.url}
                  alt={file.fileName}
                  className="w-full h-full object-cover"
                />
              ) : isPdf(file.mimeType) ? (
                <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center p-2">
                  <FileText className="w-8 h-8 text-red-500 mb-1" />
                  <span className="text-xs text-gray-600 text-center truncate w-full">
                    {file.fileName}
                  </span>
                </div>
              ) : null}

              {!disabled && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeFile(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {canAddMore && (
        <div
          onClick={() =>
            !disabled && !isUploading && fileInputRef.current?.click()
          }
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            isDragging
              ? "border-green-500 bg-green-50"
              : "border-gray-300 hover:border-green-400",
            (disabled || isUploading) && "opacity-50 cursor-not-allowed"
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 mx-auto mb-2 text-green-500 animate-spin" />
              <p className="text-sm text-gray-600">Uploading...</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600 mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                {accept === "image" && "Images only"}
                {accept === "pdf" && "PDF only"}
                {accept === "image,pdf" && "Images or PDF"}
                {maxFiles > 1 && ` (${value.length}/${maxFiles})`}
              </p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={getAcceptString()}
            multiple={multiple && maxFiles > 1}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={disabled || isUploading}
          />
        </div>
      )}
    </div>
  );
}
