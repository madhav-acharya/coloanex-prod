import { useState, useEffect, useMemo } from "react";
import { Shield } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Pagination } from "@/components/ui/pagination";
import { DataCard, DataCardGrid } from "@/components/shared/DataCard";
import { FormSheet } from "@/components/shared/FormSheet";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { useToast } from "@/hooks/use-toast";
import { useFormFields } from "@/hooks/use-form-fields";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import type { Message } from "@/types/components";
import {
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  type Role,
  type RolesQueryParams,
} from "@/apis/rolesApi";
import { useGetPermissionsQuery } from "@/apis/permissionsApi";
import { useAuth } from "@/hooks/useAuth";

export default function Roles() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [isDeletingRole, setIsDeletingRole] = useState(false);

  const [filters, setFilters] = useState<RolesQueryParams>({
    page: 1,
    limit: 12,
    search: "",
    sortBy: "name",
    sortOrder: "asc",
  });

  // Form fields setup
  const { fields, updateField, resetFields, setFieldValues } = useFormFields([
    {
      id: "name",
      label: "Role Name",
      value: "",
      placeholder: "e.g., Content Manager",
      required: true,
    },
    {
      id: "description",
      label: "Description",
      value: "",
      placeholder: "Brief description of this role",
      type: "textarea",
    },
  ]);

  const {
    data: rolesData,
    isLoading,
    error: rolesError,
  } = useGetRolesQuery(filters, { skip: !isAuthenticated });
  const { data: permissionsData, isLoading: isLoadingPermissions } =
    useGetPermissionsQuery(
      { limit: 100 },
      { skip: !sheetOpen || !isAuthenticated },
    );
  const [createRole, { isLoading: isCreating, error: createError }] =
    useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating, error: updateError }] =
    useUpdateRoleMutation();
  const [deleteRole] = useDeleteRoleMutation();

  const roles = rolesData?.data || [];
  const permissions = permissionsData?.data || [];

  useEffect(() => {
    if (rolesError) {
      const error = rolesError as {
        status?: number;
        data?: { message?: string };
      };
      const errorMessage =
        error.status === 403
          ? "You don't have permission to view roles. Please contact your administrator."
          : error.data?.message || "Failed to load roles";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [rolesError, toast]);

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

  const handleCreateClick = () => {
    setSelectedRole(null);
    setIsReadOnly(false);
    resetFields();
    setSelectedPermissions([]);
    setSheetOpen(true);
  };

  const handleViewClick = (role: Role) => {
    setSelectedRole(role);
    setIsReadOnly(true);
    setFieldValues({
      name: role.name,
      description: role.description || "",
    });
    setSelectedPermissions(role.permissions?.map((p) => p.id) || []);
    setSheetOpen(true);
  };

  const handleEditClick = (role: Role) => {
    setSelectedRole(role);
    setIsReadOnly(false);
    setFieldValues({
      name: role.name,
      description: role.description || "",
    });
    setSelectedPermissions(role.permissions?.map((p) => p.id) || []);
    setSheetOpen(true);
  };

  const handleDeleteClick = (role: Role) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!roleToDelete) return;

    setIsDeletingRole(true);
    try {
      await deleteRole(roleToDelete.id).unwrap();
      toast({
        title: "Success",
        description: "Role deleted successfully",
      });
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete role",
        variant: "destructive",
      });
    } finally {
      setIsDeletingRole(false);
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

    const formData = {
      name: fieldValues.name,
      description: fieldValues.description,
      permissionIds: selectedPermissions,
    };

    try {
      if (selectedRole) {
        await updateRole({
          id: selectedRole.id,
          data: formData,
        }).unwrap();
        toast({
          title: "Success",
          description: "Role updated successfully",
        });
      } else {
        await createRole(formData).unwrap();
        toast({
          title: "Success",
          description: "Role created successfully",
        });
      }
      setSheetOpen(false);
      setSelectedRole(null);
      resetFields();
      setSelectedPermissions([]);
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  return (
    <DashboardLayout
      title="Roles"
      description="Manage roles and their permissions"
      searchPlaceholder="Search roles..."
      searchValue={filters.search}
      onSearchChange={handleSearchChange}
      actionLabel="Add Role"
      onActionClick={handleCreateClick}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading roles...</p>
          </div>
        </div>
      ) : roles.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No roles found</p>
        </div>
      ) : (
        <>
          <DataCardGrid>
            {roles.map((role) => (
              <DataCard
                key={role.id}
                id={role.id}
                title={role.name}
                subtitle={role.description}
                metadata={`${
                  role.permissions?.length || 0
                } permissions assigned`}
                icon={Shield}
                onView={(id) => {
                  const role = roles.find((r) => r.id === id);
                  if (role) handleViewClick(role);
                }}
                onEdit={(id) => {
                  const role = roles.find((r) => r.id === id);
                  if (role) handleEditClick(role);
                }}
                onDelete={(id) => {
                  const role = roles.find((r) => r.id === id);
                  if (role) handleDeleteClick(role);
                }}
              />
            ))}
          </DataCardGrid>

          <div className="mt-6">
            <Pagination
              currentPage={rolesData?.currentPage || 1}
              totalPages={rolesData?.totalPages || 1}
              hasNextPage={rolesData?.hasNextPage || false}
              hasPreviousPage={rolesData?.hasPreviousPage || false}
              total={rolesData?.total || 0}
              limit={rolesData?.limit || 12}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              pageSizeOptions={[12, 24, 50, 100]}
            />
          </div>
        </>
      )}

      {/* Form Sheet */}
      <FormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={
          isReadOnly ? "View Role" : selectedRole ? "Edit Role" : "Create Role"
        }
        description={
          isReadOnly
            ? "View role details and permissions"
            : selectedRole
              ? "Update the role details and permissions"
              : "Add a new role with specific permissions"
        }
        sections={[
          {
            title: "Role Information",
            fields: fields,
          },
        ]}
        onFieldChange={updateField}
        onSubmit={handleSubmit}
        submitText={selectedRole ? "Update Role" : "Create Role"}
        isSubmitting={isCreating || isUpdating}
        messages={messages}
        isReadOnly={isReadOnly}
      >
        {/* Permissions Section */}
        <MultiSelect
          label="Permissions"
          placeholder="Select permissions for this role"
          options={permissions.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description || undefined,
          }))}
          selectedIds={selectedPermissions}
          onChange={setSelectedPermissions}
          isLoading={isLoadingPermissions}
          disabled={isReadOnly}
        />
      </FormSheet>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Role"
        description="This will permanently delete this role. This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        isLoading={isDeletingRole}
      />
    </DashboardLayout>
  );
}
