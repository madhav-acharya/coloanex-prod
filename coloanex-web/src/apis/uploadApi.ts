import { baseApi } from "./baseApi";

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

export const uploadApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadSingle: builder.mutation<CloudinaryFile, FormData>({
      query: (formData) => ({
        url: "/cloudinary-uploads/single",
        method: "POST",
        body: formData,
        formData: true,
      }),
      transformResponse: (response: UploadResponse) =>
        response.data as CloudinaryFile,
    }),

    uploadMultiple: builder.mutation<CloudinaryFile[], FormData>({
      query: (formData) => ({
        url: "/cloudinary-uploads/multiple",
        method: "POST",
        body: formData,
        formData: true,
      }),
      transformResponse: (response: UploadResponse) =>
        response.data as CloudinaryFile[],
    }),
  }),
});

export const { useUploadSingleMutation, useUploadMultipleMutation } = uploadApi;
