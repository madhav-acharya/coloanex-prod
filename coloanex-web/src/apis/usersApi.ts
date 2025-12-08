import { baseApi } from "./baseApi";

export interface User {
  id: string;
  email?: string;
  fullName: string;
  phone?: string;
  isActive: boolean;
  lastActiveAt?: string;
  createdAt: string;
  updatedAt: string;
  roles?: Array<{
    id: string;
    name: string;
  }>;
  permissions?: Array<{
    id: string;
    name: string;
  }>;
}

export interface UsersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  roleId?: string;
  sort?: string;
  order?: string;
}

export interface UsersResponse {
  data: User[];
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  currentPage: number;
  limit: number;
}

export interface CreateUserDto {
  fullName: string;
  email?: string;
  phone?: string;
  password: string;
  roleIds?: string[];
  permissionIds?: string[];
  isActive?: boolean;
}

export interface UpdateUserDto {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  roleIds?: string[];
  permissionIds?: string[];
  isActive?: boolean;
}

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<UsersResponse, UsersQueryParams | void>({
      query: (params = {}) => ({
        url: "/users",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "Users" as const,
                id,
              })),
              { type: "Users", id: "LIST" },
            ]
          : [{ type: "Users", id: "LIST" }],
    }),

    getUser: builder.query<User, string>({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: "Users", id }],
    }),

    createUser: builder.mutation<User, CreateUserDto>({
      query: (data) => ({
        url: "/users",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Users", id: "LIST" }],
    }),

    updateUser: builder.mutation<User, { id: string; data: UpdateUserDto }>({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Users", id },
        { type: "Users", id: "LIST" },
      ],
    }),

    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Users", id },
        { type: "Users", id: "LIST" },
      ],
    }),

    banUser: builder.mutation<User, string>({
      query: (id) => ({
        url: `/users/${id}/ban`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Users", id },
        { type: "Users", id: "LIST" },
      ],
    }),

    unbanUser: builder.mutation<User, string>({
      query: (id) => ({
        url: `/users/${id}/unban`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Users", id },
        { type: "Users", id: "LIST" },
      ],
    }),

    activateUser: builder.mutation<User, string>({
      query: (id) => ({
        url: `/users/${id}/activate`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Users", id },
        { type: "Users", id: "LIST" },
      ],
    }),

    deactivateUser: builder.mutation<User, string>({
      query: (id) => ({
        url: `/users/${id}/deactivate`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Users", id },
        { type: "Users", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useBanUserMutation,
  useUnbanUserMutation,
  useActivateUserMutation,
  useDeactivateUserMutation,
} = usersApi;
