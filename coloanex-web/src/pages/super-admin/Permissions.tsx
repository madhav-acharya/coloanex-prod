import { useState, useEffect, useMemo } from "react";
import { Key } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Pagination } from "@/components/ui/pagination";
import { DataCard, DataCardGrid } from "@/components/shared/DataCard";
import { FormSheet } from "@/components/shared/FormSheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useFormFields } from "@/hooks/use-form-fields";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import type { Message } from "@/types/components";
import {
  useGetPermissionsQuery,
  useCreatePermissionMutation,
  useUpdatePermissionMutation,
  useDeletePermissionMutation,
  type Permission,
  type PermissionsQueryParams,
} from "@/apis/permissionsApi";
import { useAuth } from "@/hooks/useAuth";

export default function Permissions() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [selectedPermission, setSelectedPermission] =
    useState<Permission | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [permissionToDelete, setPermissionToDelete] =
    useState<Permission | null>(null);
  const [isDeletingPermission, setIsDeletingPermission] = useState(false);

  const [filters, setFilters] = useState<PermissionsQueryParams>({
    page: 1,
    limit: 12,
    search: "",
    sortBy: "name",
    sortOrder: "asc",
  });

  const { fields, updateField, resetFields, setFieldValues } = useFormFields([
    {
      id: "name",
      label: "Permission Name",
      value: "",
      placeholder: "e.g., users:read",
      required: true,
    },
    {
      id: "description",
      label: "Description",
      value: "",
      placeholder: "Brief description of this permission",
      type: "textarea",
    },
  ]);

  const {
    data: permissionsData,
    isLoading,
    isFetching,
    error: permissionsError,
    refetch,
  } = useGetPermissionsQuery(filters, { skip: !isAuthenticated });
  const [createPermission, { isLoading: isCreating, error: createError }] =
    useCreatePermissionMutation();
  const [updatePermission, { isLoading: isUpdating, error: updateError }] =
    useUpdatePermissionMutation();
  const [deletePermission] = useDeletePermissionMutation();

  const permissions = permissionsData?.data || [];

  useEffect(() => {
    if (permissionsError) {
      const error = permissionsError as {
        status?: number;
        data?: { message?: string };
      };
      const errorMessage =
        error.status === 403
          ? "You don't have permission to view permissions. Please contact your administrator."
          : error.data?.message || "Failed to load permissions";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [permissionsError, toast]);

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
    setSelectedPermission(null);
    setIsReadOnly(false);
    resetFields();
    setSheetOpen(true);
  };

  const handleViewClick = (permission: Permission) => {
    setSelectedPermission(permission);
    setIsReadOnly(true);
    setFieldValues({
      name: permission.name,
      description: permission.description || "",
    });
    setSheetOpen(true);
  };

  const handleEditClick = (permission: Permission) => {
    setSelectedPermission(permission);
    setIsReadOnly(false);
    setFieldValues({
      name: permission.name,
      description: permission.description || "",
    });
    setSheetOpen(true);
  };

  const handleDeleteClick = (permission: Permission) => {
    setPermissionToDelete(permission);
    setDeleteDialogOpen(true);
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch().unwrap();
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const handleConfirmDelete = async () => {
    if (!permissionToDelete) return;

    const targetId = permissionToDelete.id;
    const targetName = permissionToDelete.name;
    setDeleteDialogOpen(false);
    setPermissionToDelete(null);

    let isCancelled = false;

    toast({
      title: "Permission Removed",
      description: `Permission "${targetName}" has been removed.`,
      action: {
        label: "Undo",
        onClick: () => {
          isCancelled = true;
          toast({
            title: "Restored",
            description: `Permission "${targetName}" has been restored.`,
          });
        },
      },
      duration: 5000,
    });

    setTimeout(async () => {
      if (isCancelled) return;
      try {
        await deletePermission(targetId).unwrap();
      } catch (err: any) {
        toast({
          title: "Error",
          description: err?.data?.message || "Failed to permanently delete permission",
          variant: "destructive",
        });
      }
    }, 5000);
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
    };

    try {
      if (selectedPermission) {
        await updatePermission({
          id: selectedPermission.id,
          data: formData,
        }).unwrap();
        toast({
          title: "Success",
          description: "Permission updated successfully",
        });
      } else {
        await createPermission(formData).unwrap();
        toast({
          title: "Success",
          description: "Permission created successfully",
        });
      }
      setSheetOpen(false);
      setSelectedPermission(null);
      resetFields();
    } catch (error) { }
  };

  return (
    <DashboardLayout
      title="Permissions"
      description="Manage system permissions"
      searchPlaceholder="Search permissions..."
      searchValue={filters.search}
      onSearchChange={handleSearchChange}
      onRefresh={handleRefresh}
      isRefreshing={isRefreshing}
      isLoading={isLoading || isFetching || isRefreshing}
      skeletonType="cards"
      actionLabel="Add Permission"
      onActionClick={handleCreateClick}
    >
      {permissions.length === 0 ? (
        <div className="text-center py-12">
          <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No permissions found</p>
        </div>
      ) : (
        <>
          <DataCardGrid>
            {permissions.map((permission) => (
              <DataCard
                key={permission.id}
                id={permission.id}
                title={permission.name}
                metadata={permission.description}
                icon={Key}
                iconColor="text-amber-500"
                iconBg="bg-amber-500/10"
                onView={(id) => {
                  const permission = permissions.find((p) => p.id === id);
                  if (permission) handleViewClick(permission);
                }}
                onEdit={(id) => {
                  const permission = permissions.find((p) => p.id === id);
                  if (permission) handleEditClick(permission);
                }}
                onDelete={(id) => {
                  const permission = permissions.find((p) => p.id === id);
                  if (permission) handleDeleteClick(permission);
                }}
              />
            ))}
          </DataCardGrid>

          <div className="mt-6">
            <Pagination
              currentPage={permissionsData?.currentPage || 1}
              totalPages={permissionsData?.totalPages || 1}
              hasNextPage={permissionsData?.hasNextPage || false}
              hasPreviousPage={permissionsData?.hasPreviousPage || false}
              total={permissionsData?.total || 0}
              limit={permissionsData?.limit || 12}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              pageSizeOptions={[12, 24, 50, 100]}
            />
          </div>
        </>
      )}

      { }
      <FormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={
          isReadOnly
            ? "View Permission"
            : selectedPermission
              ? "Edit Permission"
              : "Create Permission"
        }
        description={
          isReadOnly
            ? "View permission details"
            : selectedPermission
              ? "Update the permission details"
              : "Add a new permission to the system"
        }
        sections={[
          {
            title: "Permission Information",
            fields: fields,
          },
        ]}
        onFieldChange={updateField}
        onSubmit={handleSubmit}
        submitText={
          selectedPermission ? "Update Permission" : "Create Permission"
        }
        isSubmitting={isCreating || isUpdating}
        messages={messages}
        isReadOnly={isReadOnly}
      />

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Permission"
        description="This will permanently delete this permission. This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        isLoading={isDeletingPermission}
      />
    </DashboardLayout>
  );
}
