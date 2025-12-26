export interface CloudinaryFile {
  url: string;
  publicId: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
}

export interface UploadResponse {
  success: boolean;
  data: CloudinaryFile | CloudinaryFile[];
}

export interface UploadedFile {
  url: string;
  publicId?: string;
  fileName: string;
  mimeType: string;
  sizeInBytes: number;
}
