import apiClient from "./client";

export const usersApi = {
  getCurrentUser: async (): Promise<any> => {
    const { data } = await apiClient.get("/auth/me");
    return data;
  },

  updateProfile: async (profileData: {
    fullName?: string;
    phone?: string;
    dateOfBirth?: string;
    address?: string;
    profileImage?: string;
  }): Promise<any> => {
    const { data } = await apiClient.patch("/users/profile", profileData);
    return data;
  },

  updateUserById: async (
    userId: string,
    userData: {
      fullName?: string;
      phone?: string;
      dateOfBirth?: string;
      address?: string;
      profileImage?: string;
    }
  ): Promise<any> => {
    const { data } = await apiClient.patch(`/users/${userId}`, userData);
    return data;
  },

  uploadProfileImage: async (imageFile: any): Promise<string> => {
    const formData = new FormData();
    formData.append("file", {
      uri: imageFile.uri,
      name: "profile.jpg",
      type: "image/jpeg",
    } as any);
    formData.append("category", "profile");

    const { data } = await apiClient.post(
      "/cloudinary-uploads/single",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return data.url;
  },

  changePassword: async (passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<any> => {
    const { data } = await apiClient.patch(
      "/users/change-password",
      passwordData
    );
    return data;
  },

  updateNotificationSettings: async (settings: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    smsNotifications?: boolean;
  }): Promise<any> => {
    const { data } = await apiClient.patch(
      "/users/notification-settings",
      settings
    );
    return data;
  },
};
