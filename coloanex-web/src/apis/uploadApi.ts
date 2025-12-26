import { baseApi } from "./baseApi";
import { CloudinaryFile, UploadResponse } from "@/types/upload";

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
