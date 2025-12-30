import { baseApi } from "./baseApi";
import type {
  User,
  UsersQueryParams,
  UsersResponse,
  CreateUserDto,
  UpdateUserDto,
} from "@/types/user";

export type {
  User,
  UsersQueryParams,
  UsersResponse,
  CreateUserDto,
  UpdateUserDto,
};

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<UsersResponse, UsersQueryParams | void>({
      query: (params = {}) => ({
        url: "/users",
        params,
      }),
      transformResponse: (response: UsersResponse) => {
        return {
          ...response,
          data: response.data.map((user) => ({
            ...user,
            roles: (user.roles || [])
              .map((r: any) =>
                r && typeof r === "object" && "role" in r ? r.role : r
              )
              .filter((r: any) => r && r.id && r.name),
            permissions: (user.permissions || [])
              .map((p: any) =>
                p && typeof p === "object" && "permission" in p
                  ? p.permission
                  : p
              )
              .filter((p: any) => p && p.id && p.name),
          })),
        };
      },
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
      transformResponse: (response: User) => ({
        ...response,
        roles: (response.roles || [])
          .map((r: any) =>
            r && typeof r === "object" && "role" in r ? r.role : r
          )
          .filter((r: any) => r && r.id && r.name),
        permissions: (response.permissions || [])
          .map((p: any) =>
            p && typeof p === "object" && "permission" in p ? p.permission : p
          )
          .filter((p: any) => p && p.id && p.name),
      }),
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
        "Auth",
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
