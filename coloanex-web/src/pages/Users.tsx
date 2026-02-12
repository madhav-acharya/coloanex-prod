import { useState, useEffect, useMemo } from "react";
import { Users as UsersIcon, Eye, Edit, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Pagination } from "@/components/ui/pagination";
import { DataTable } from "@/components/shared/DataTable";
import type { Column } from "@/types/components";
import { FormSheet } from "@/components/shared/FormSheet";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useFormFields } from "@/hooks/use-form-fields";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import type { Message } from "@/types/components";
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  type User,
  type UsersQueryParams,
} from "@/apis/usersApi";
import { useGetTenantsQuery } from "@/apis/tenantsApi";
import { useAuth } from "@/hooks/useAuth";
import {
  extractUserRoleIds,
  extractUserPermissionIds,
  extractUserRoles,
  extractUserPermissions,
  extractRolePermissions,
  getAdditionalPermissionIds,
} from "@/lib/permissions";

export default function Users() {
  const { toast } = useToast();
  const { isAuthenticated, user: currentUser } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [showTenantFields, setShowTenantFields] = useState(false);
  const [tenantFormData, setTenantFormData] = useState({
    tenantName: "",
    tenantContactEmail: "",
    tenantContactPhone: "",
    tenantAddress: "",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const [filters, setFilters] = useState<UsersQueryParams>({
    page: 1,
    limit: 10,
    search: "",
    sortBy: "fullName",
    sortOrder: "asc",
    roleId: undefined,
  });

  const { fields, updateField, resetFields, setFieldValues } = useFormFields([
    {
      id: "fullName",
      label: "Full Name",
      value: "",
      placeholder: "e.g., John Doe",
      required: true,
    },
    {
      id: "email",
      label: "Email",
      value: "",
      placeholder: "user@example.com",
      type: "email",
      required: true,
    },
    {
      id: "phone",
      label: "Phone",
      value: "",
      placeholder: "+977-1234567890",
      type: "tel",
      required: true,
    },
    {
      id: "password",
      label: "Password",
      value: "",
      placeholder: "Minimum 8 characters",
      type: "password",
      required: true,
    },
  ]);

  const {
    data: usersData,
    isLoading,
    error: usersError,
  } = useGetUsersQuery(filters, { skip: !isAuthenticated });
  const { data: tenantsData, isLoading: isLoadingTenants } = useGetTenantsQuery(
    { limit: 100 },
    { skip: !sheetOpen || !isAuthenticated },
  );
  const [createUser, { isLoading: isCreating, error: createError }] =
    useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating, error: updateError }] =
    useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  const users = usersData?.data || [];
  const tenants = tenantsData?.data || [];

  const KNOWN_ROLES = [
    {
      id: "super-admin",
      name: "Super Admin",
      description: "Full system access",
    },
    { id: "admin", name: "Admin", description: "Tenant administration" },
    { id: "lender", name: "Lender", description: "Lending operations" },
    { id: "borrower", name: "Borrower", description: "Borrowing services" },
  ];

  const extractedRolesMap = useMemo(() => {
    const rolesMap = new Map<
      string,
      { id: string; name: string; description?: string }
    >();

    KNOWN_ROLES.forEach((role) => {
      rolesMap.set(role.name, role);
    });

    if (currentUser) {
      extractUserRoles(currentUser as any).forEach((role) => {
        rolesMap.set(role.name, role);
      });
    }

    users.forEach((user) => {
      extractUserRoles(user).forEach((role) => {
        rolesMap.set(role.name, role);
      });
    });

    return rolesMap;
  }, [users, currentUser]);

  const extractedPermissionsMap = useMemo(() => {
    const permsMap = new Map<
      string,
      { id: string; name: string; description?: string }
    >();

    if (currentUser) {
      extractUserPermissions(currentUser as any).forEach((perm) => {
        permsMap.set(perm.id, perm);
      });
    }

    return permsMap;
  }, [currentUser]);

  const allRoles = useMemo(
    () => Array.from(extractedRolesMap.values()),
    [extractedRolesMap],
  );
  const allPermissions = useMemo(
    () => Array.from(extractedPermissionsMap.values()),
    [extractedPermissionsMap],
  );

  const currentUserRoles = extractUserRoles(currentUser as any);
  const isSuperAdmin = currentUserRoles.some((r) => r.name === "Super Admin");
  const isAdmin = currentUserRoles.some((r) => r.name === "Admin");
  const isLender = currentUserRoles.some((r) => r.name === "Lender");

  const roles = allRoles.filter((role) => {
    if (isSuperAdmin) {
      return role.name !== "Super Admin";
    } else if (isAdmin) {
      return role.name !== "Super Admin" && role.name !== "Admin";
    } else if (isLender) {
      return (
        role.name !== "Super Admin" &&
        role.name !== "Admin" &&
        role.name !== "Lender"
      );
    }
    return false;
  });

  const currentUserPermissions = extractUserPermissions(currentUser as any);
  const permissions = isSuperAdmin
    ? allPermissions
    : allPermissions.filter((perm) =>
        currentUserPermissions.some((userPerm) => userPerm.id === perm.id),
      );

  useEffect(() => {
    if (usersError) {
      const error = usersError as {
        status?: number;
        data?: { message?: string };
      };
      const errorMessage =
        error.status === 403
          ? "You don't have permission to view users. Please contact your administrator."
          : error.data?.message || "Failed to load users";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [usersError, toast]);

  const messages = useMemo<Message[]>(() => {
    if (createError || updateError) {
      const error = (createError || updateError) as {
        data?: { message?: string };
      };
      return [
        {
          type: "error",
          description:
            error.data?.message || "An error occurred. Please try again.",
        },
      ];
    }
    return [];
  }, [createError, updateError]);

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handlePageSizeChange = (limit: number) => {
    setFilters((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handleFilterChange = (name: string, value: string) => {
    if (name === "role") {
      setFilters((prev) => ({
        ...prev,
        roleId: value === "all" ? undefined : value,
        page: 1,
      }));
    }
  };

  const handleSort = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: key,
      sortOrder:
        prev.sortBy === key && prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  };

  const handleCreateClick = () => {
    setSelectedUser(null);
    setIsReadOnly(false);
    resetFields();
    setSelectedRoles([]);
    setSelectedPermissions([]);
    const shouldAutoSetTenant = (isAdmin || isLender) && currentUser?.tenantId;
    setSelectedTenant(shouldAutoSetTenant ? currentUser.tenantId : "");
    setShowTenantFields(false);
    setTenantFormData({
      tenantName: "",
      tenantContactEmail: "",
      tenantContactPhone: "",
      tenantAddress: "",
    });
    const passwordField = fields.find((f) => f.id === "password");
    if (passwordField) {
      passwordField.required = true;
      passwordField.placeholder = "Minimum 8 characters";
    }
    setSheetOpen(true);
  };

  const handleViewClick = (user: User) => {
    setSelectedUser(user);
    setIsReadOnly(true);
    setFieldValues({
      fullName: user.fullName,
      email: user.email || "",
      phone: user.phone || "",
      password: "",
    });
    setSelectedRoles(extractUserRoleIds(user));
    setSelectedPermissions(extractUserPermissionIds(user));
    setSheetOpen(true);
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setIsReadOnly(false);
    setFieldValues({
      fullName: user.fullName,
      email: user.email || "",
      phone: user.phone || "",
      password: "",
    });
    const passwordField = fields.find((f) => f.id === "password");
    if (passwordField) {
      passwordField.required = false;
      passwordField.placeholder = "Leave empty to keep unchanged";
    }
    setSelectedRoles(extractUserRoleIds(user));
    setSelectedPermissions(extractUserPermissionIds(user));
    setSelectedTenant(user.tenantId || "");
    setSheetOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setIsDeletingUser(true);
    try {
      await deleteUser(userToDelete.id).unwrap();
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleSubmit = async () => {
    const fieldValues = fields.reduce(
      (acc, field) => {
        acc[field.id] = field.value;
        return acc;
      },
      {} as Record<string, string>,
    );

    try {
      if (selectedUser) {
        const updateData: Record<string, unknown> = {
          fullName: fieldValues.fullName,
          email: fieldValues.email || undefined,
          phone: fieldValues.phone || undefined,
          roleIds: selectedRoles.filter((id) => id && id.trim() !== ""),
          permissionIds: selectedPermissions.filter(
            (id) => id && id.trim() !== "",
          ),
          tenantId: selectedTenant || undefined,
          id: selectedUser.id,
        };

        if (fieldValues.password && fieldValues.password.trim() !== "") {
          updateData.password = fieldValues.password;
        }

        await updateUser({
          id: selectedUser.id,
          data: updateData as Partial<User> & { id: string },
        }).unwrap();
        toast({
          title: "Success",
          description: "User updated successfully",
        });
      } else {
        const createData = {
          fullName: fieldValues.fullName,
          email: fieldValues.email || undefined,
          phone: fieldValues.phone || undefined,
          password: fieldValues.password,
          roleIds: selectedRoles.filter((id) => id && id.trim() !== ""),
          permissionIds: selectedPermissions.filter(
            (id) => id && id.trim() !== "",
          ),
          tenantId: selectedTenant || undefined,
          ...(showTenantFields && {
            tenantName: tenantFormData.tenantName,
            tenantContactEmail: tenantFormData.tenantContactEmail,
            tenantContactPhone: tenantFormData.tenantContactPhone,
            tenantAddress: tenantFormData.tenantAddress,
          }),
        };
        await createUser(createData).unwrap();
        toast({
          title: "Success",
          description: "User created successfully",
        });
      }
      setSheetOpen(false);
      setSelectedUser(null);
      resetFields();
      setSelectedRoles([]);
      setSelectedPermissions([]);
      setSelectedTenant("");
    } catch {
      return;
    }
  };

  const columns: Column<User>[] = [
    {
      key: "fullName",
      label: "Full Name",
      sortable: true,
      width: "25%",
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      width: "20%",
      render: (user) => user.email || "-",
    },
    {
      key: "phone",
      label: "Phone",
      width: "12%",
      render: (user) => user.phone || "-",
    },
    {
      key: "roles",
      label: "Roles",
      width: "18%",
      render: (user) => {
        const maxVisible = 2;
        const roles = (user.roles || [])
          .map((r) => (typeof r === "object" && "role" in r ? r.role : r))
          .filter(
            (r) => r && typeof r === "object" && "id" in r && "name" in r,
          );
        const visibleRoles = roles.slice(0, maxVisible);
        const remainingCount = roles.length - maxVisible;

        return (
          <div className="flex flex-wrap gap-1">
            {roles.length > 0 ? (
              <>
                {visibleRoles.map((role: { id: string; name: string }) => (
                  <Badge key={role.id} variant="outline" className="text-xs">
                    {role.name}
                  </Badge>
                ))}
                {remainingCount > 0 && (
                  <Badge variant="outline" className="text-xs">
                    +{remainingCount} more
                  </Badge>
                )}
              </>
            ) : (
              <span className="text-muted-foreground text-sm">No roles</span>
            )}
          </div>
        );
      },
    },
    {
      key: "permissions",
      label: "Permissions",
      width: "18%",
      render: (user) => {
        const maxVisible = 2;
        const permissions = (user.permissions || [])
          .map((p) =>
            typeof p === "object" && "permission" in p ? p.permission : p,
          )
          .filter(
            (p) => p && typeof p === "object" && "id" in p && "name" in p,
          );
        const visiblePermissions = permissions.slice(0, maxVisible);
        const remainingCount = permissions.length - maxVisible;

        return (
          <div className="flex flex-wrap gap-1">
            {permissions.length > 0 ? (
              <>
                {visiblePermissions.map(
                  (permission: { id: string; name: string }) => (
                    <Badge
                      key={permission.id}
                      variant="outline"
                      className="text-xs"
                    >
                      {permission.name}
                    </Badge>
                  ),
                )}
                {remainingCount > 0 && (
                  <Badge variant="outline" className="text-xs">
                    +{remainingCount} more
                  </Badge>
                )}
              </>
            ) : (
              <span className="text-muted-foreground text-sm">None</span>
            )}
          </div>
        );
      },
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      width: "12%",
      render: (user) => new Date(user.createdAt).toLocaleDateString(),
    },
  ];

  // Define filter fields
  const filterFields = [
    {
      name: "role",
      label: "Role",
      type: "select" as const,
      options: roles.map((role) => ({
        label: role.name,
        value: role.id,
      })),
      placeholder: "Filter by role",
    },
  ];

  const filterValues = {
    role: filters.roleId || "all",
  };

  return (
    <DashboardLayout
      title="Users"
      description="Manage system users"
      searchPlaceholder="Search users..."
      searchValue={filters.search}
      onSearchChange={handleSearchChange}
      filters={filterFields}
      filterValues={filterValues}
      onFilterChange={handleFilterChange}
      actionLabel="Add User"
      onActionClick={handleCreateClick}
    >
      <DataTable
        data={users}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No users found"
        emptyIcon={<UsersIcon className="w-12 h-12 text-gray-400" />}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        onSort={handleSort}
        actions={[
          {
            label: "View",
            icon: <Eye className="w-4 h-4" />,
            onClick: handleViewClick,
          },
          {
            label: "Edit",
            icon: <Edit className="w-4 h-4" />,
            onClick: handleEditClick,
          },
          {
            label: "Delete",
            icon: <Trash2 className="w-4 h-4" />,
            onClick: handleDeleteClick,
            variant: "destructive" as const,
          },
        ]}
      />

      <div className="mt-6">
        <Pagination
          currentPage={usersData?.currentPage || 1}
          totalPages={usersData?.totalPages || 1}
          hasNextPage={usersData?.hasNextPage || false}
          hasPreviousPage={usersData?.hasPreviousPage || false}
          total={usersData?.total || 0}
          limit={usersData?.limit || 10}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      {/* Form Sheet */}
      <FormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={
          isReadOnly ? "View User" : selectedUser ? "Edit User" : "Create User"
        }
        description={
          isReadOnly
            ? "View user details, roles, and permissions"
            : selectedUser
              ? "Update the user details and permissions"
              : "Add a new user to the system"
        }
        sections={[
          {
            title: "User Information",
            fields: fields,
          },
        ]}
        onFieldChange={updateField}
        onSubmit={handleSubmit}
        submitText={selectedUser ? "Update User" : "Create User"}
        isSubmitting={isCreating || isUpdating}
        messages={messages}
        isReadOnly={isReadOnly}
      >
        <div className="space-y-4">
          {!isReadOnly && isSuperAdmin && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Tenant
                {selectedRoles.some((roleId) => {
                  const role = allRoles.find((r) => r.id === roleId);
                  return (
                    role?.name?.toLowerCase() === "admin" ||
                    role?.name?.toLowerCase() === "lender"
                  );
                }) && <span className="text-red-500 ml-1">*</span>}
              </label>
              {selectedRoles.some((roleId) => {
                const role = allRoles.find((r) => r.id === roleId);
                return role?.name?.toLowerCase() === "admin";
              }) ? (
                <>
                  <Select
                    value={selectedTenant}
                    onValueChange={setSelectedTenant}
                    disabled={isLoadingTenants || isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select existing tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.name || tenant.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Admin must select an existing tenant
                  </p>
                </>
              ) : selectedRoles.some((roleId) => {
                  const role = allRoles.find((r) => r.id === roleId);
                  return role?.name?.toLowerCase() === "lender";
                }) ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="radio"
                      id="existing-tenant"
                      name="tenant-option"
                      checked={!showTenantFields}
                      onChange={() => {
                        setShowTenantFields(false);
                        setTenantFormData({
                          tenantName: "",
                          tenantContactEmail: "",
                          tenantContactPhone: "",
                          tenantAddress: "",
                        });
                      }}
                      className="cursor-pointer"
                    />
                    <label
                      htmlFor="existing-tenant"
                      className="text-sm cursor-pointer"
                    >
                      Select existing tenant
                    </label>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="radio"
                      id="new-tenant"
                      name="tenant-option"
                      checked={showTenantFields}
                      onChange={() => {
                        setShowTenantFields(true);
                        setSelectedTenant("");
                      }}
                      className="cursor-pointer"
                    />
                    <label
                      htmlFor="new-tenant"
                      className="text-sm cursor-pointer"
                    >
                      Create new lender organization
                    </label>
                  </div>
                  {!showTenantFields ? (
                    <Select
                      value={selectedTenant}
                      onValueChange={setSelectedTenant}
                      disabled={isLoadingTenants || isReadOnly}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tenant" />
                      </SelectTrigger>
                      <SelectContent>
                        {tenants.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.name || tenant.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="space-y-3 p-4 border rounded-md bg-gray-50">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Organization Name{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={tenantFormData.tenantName}
                          onChange={(e) =>
                            setTenantFormData({
                              ...tenantFormData,
                              tenantName: e.target.value,
                            })
                          }
                          placeholder="Enter organization name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Contact Email <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="email"
                          value={tenantFormData.tenantContactEmail}
                          onChange={(e) =>
                            setTenantFormData({
                              ...tenantFormData,
                              tenantContactEmail: e.target.value,
                            })
                          }
                          placeholder="organization@example.com"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Contact Phone
                        </label>
                        <Input
                          type="tel"
                          value={tenantFormData.tenantContactPhone}
                          onChange={(e) =>
                            setTenantFormData({
                              ...tenantFormData,
                              tenantContactPhone: e.target.value,
                            })
                          }
                          placeholder="Organization phone"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Address
                        </label>
                        <Input
                          value={tenantFormData.tenantAddress}
                          onChange={(e) =>
                            setTenantFormData({
                              ...tenantFormData,
                              tenantAddress: e.target.value,
                            })
                          }
                          placeholder="Organization address"
                        />
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Lender can create new organization or select existing tenant
                  </p>
                </>
              ) : (
                <>
                  <Select
                    value={selectedTenant}
                    onValueChange={setSelectedTenant}
                    disabled={isLoadingTenants || isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.name || tenant.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Tenant assignment is required for Admin and Lender users
                  </p>
                </>
              )}
            </div>
          )}
          {!isReadOnly && (isAdmin || isLender) && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Tenant
              </label>
              <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                <p className="text-sm text-gray-700">
                  {currentUser?.tenant?.name || "No tenant assigned"}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Users will be assigned to your tenant automatically
              </p>
            </div>
          )}
          {isReadOnly ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Assigned Roles
                </label>
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md border border-gray-200 min-h-[60px]">
                  {(() => {
                    const userRoles = extractUserRoles(selectedUser);
                    return userRoles.length > 0 ? (
                      userRoles.map((roleData) => (
                        <Badge
                          key={roleData.id}
                          variant="secondary"
                          className="bg-green-100 text-green-700"
                        >
                          {roleData.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        No roles assigned
                      </span>
                    );
                  })()}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Role-Based Permissions
                </label>
                <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-md border border-blue-200 min-h-[60px]">
                  {(() => {
                    const userRoles = extractUserRoles(selectedUser);
                    const selectedRoleObjects = allRoles.filter((r) =>
                      userRoles.some((ur) => ur.id === r.id),
                    );
                    const rolePermissions =
                      extractRolePermissions(selectedRoleObjects);
                    const userPermissions =
                      extractUserPermissions(selectedUser);
                    const roleBasedPerms = userPermissions.filter((perm) =>
                      rolePermissions.has(perm.id),
                    );

                    return roleBasedPerms.length > 0 ? (
                      roleBasedPerms.map((permData) => (
                        <Badge
                          key={permData.id}
                          variant="secondary"
                          className="bg-blue-100 text-blue-700"
                        >
                          {permData.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        No role-based permissions
                      </span>
                    );
                  })()}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Additional Permissions
                </label>
                <div className="flex flex-wrap gap-2 p-3 bg-purple-50 rounded-md border border-purple-200 min-h-[60px]">
                  {(() => {
                    const userRoles = extractUserRoles(selectedUser);
                    const selectedRoleObjects = allRoles.filter((r) =>
                      userRoles.some((ur) => ur.id === r.id),
                    );
                    const rolePermissions =
                      extractRolePermissions(selectedRoleObjects);
                    const userPermissions =
                      extractUserPermissions(selectedUser);
                    const additionalPerms = userPermissions.filter(
                      (perm) => !rolePermissions.has(perm.id),
                    );

                    return additionalPerms.length > 0 ? (
                      additionalPerms.map((permData) => (
                        <Badge
                          key={permData.id}
                          variant="secondary"
                          className="bg-purple-100 text-purple-700"
                        >
                          {permData.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        No additional permissions
                      </span>
                    );
                  })()}
                </div>
              </div>
            </>
          ) : (
            <>
              <MultiSelect
                label="Roles"
                placeholder="Assign roles to this user"
                options={roles.map((r) => ({
                  id: r.id,
                  name: r.name,
                  description: r.description || undefined,
                }))}
                selectedIds={selectedRoles}
                onChange={setSelectedRoles}
                disabled={isReadOnly}
              />
              <MultiSelect
                label="Additional Permissions"
                placeholder="Grant specific permissions beyond role permissions"
                options={permissions.map((p) => ({
                  id: p.id,
                  name: p.name,
                  description: p.description || undefined,
                }))}
                selectedIds={selectedPermissions}
                onChange={setSelectedPermissions}
                disabled={isReadOnly}
              />
            </>
          )}
        </div>
      </FormSheet>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Delete User"
        description="This will permanently delete this user. This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        isLoading={isDeletingUser}
      />
    </DashboardLayout>
  );
}
