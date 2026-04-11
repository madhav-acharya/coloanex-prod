import { Platform } from "react-native";
import apiClient from "@/api/client";

export interface CloudinaryUploadResponse {
  url: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

const uriToBlob = async (uri: string): Promise<Blob> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  return blob;
};

export const uploadToCloudinary = async (
  imageUri: string,
  fileName: string = "image.jpg",
  mimeType: string = "image/jpeg"
): Promise<CloudinaryUploadResponse> => {
  try {
    const formData = new FormData();

    if (Platform.OS === "web") {
      const blob = await uriToBlob(imageUri);
      formData.append("file", blob, fileName);
    } else {
      formData.append("file", {
        uri: imageUri,
        name: fileName,
        type: mimeType,
      } as any);
    }

    const response = await apiClient.post(
      `/cloudinary-uploads/single`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Upload failed");
  }
};

export const uploadMultipleToCloudinary = async (
  files: { uri: string; name: string; type: string }[]
): Promise<CloudinaryUploadResponse[]> => {
  try {
    const formData = new FormData();

    if (Platform.OS === "web") {
      const blobPromises = files.map(async (file) => {
        const blob = await uriToBlob(file.uri);
        return { blob, name: file.name };
      });
      const blobs = await Promise.all(blobPromises);
      blobs.forEach((item) => {
        formData.append("files", item.blob, item.name);
      });
    } else {
      files.forEach((file) => {
        formData.append("files", {
          uri: file.uri,
          name: file.name,
          type: file.type,
        } as any);
      });
    }

    const response = await apiClient.post(
      `/cloudinary-uploads/multiple`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Upload failed");
  }
};
