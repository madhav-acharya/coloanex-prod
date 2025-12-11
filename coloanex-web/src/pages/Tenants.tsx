import { useState, useEffect, useMemo } from "react";
import { Building2, Eye, Edit, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Pagination } from "@/components/ui/pagination";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { FormSheet } from "@/components/shared/FormSheet";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useFormFields } from "@/hooks/use-form-fields";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import type { Message } from "@/components/shared/Messages";
import {
  useGetTenantsQuery,
  useCreateTenantMutation,
  useUpdateTenantMutation,
  useDeleteTenantMutation,
  type Tenant,
  type TenantsQueryParams,
} from "@/apis/tenantsApi";
import { useGetUsersQuery } from "@/apis/usersApi";
import { useAuth } from "@/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormLabel } from "@/components/ui/form-label";

export default function Tenants() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [isDeletingTenant, setIsDeletingTenant] = useState(false);

  const [filters, setFilters] = useState<TenantsQueryParams>({
    page: 1,
    limit: 10,
    search: "",
    sortBy: "name",
    sortOrder: "asc",
    isActive: undefined,
    isBanned: undefined,
  });

  const { fields, updateField, resetFields, setFieldValues } = useFormFields([
    {
      id: "name",
      label: "Tenant Name",
      value: "",
      placeholder: "e.g., Acme Corporation",
      required: true,
    },
    {
      id: "contactEmail",
      label: "Contact Email",
      value: "",
      placeholder: "contact@example.com",
      type: "email",
      required: true,
    },
    {
      id: "contactPhone",
      label: "Contact Phone",
      value: "",
      placeholder: "1234567890",
      type: "tel",
      required: true,
    },
    {
      id: "address",
      label: "Address",
      value: "",
      placeholder: "Enter full address",
    },
  ]);

  const {
    data: tenantsData,
    isLoading,
    error: tenantsError,
  } = useGetTenantsQuery(filters, { skip: !isAuthenticated });
  const { data: usersData, isLoading: isLoadingUsers } = useGetUsersQuery(
    { limit: 1000 },
    { skip: !sheetOpen || !isAuthenticated }
  );
  const [createTenant, { isLoading: isCreating, error: createError }] =
    useCreateTenantMutation();
  const [updateTenant, { isLoading: isUpdating, error: updateError }] =
    useUpdateTenantMutation();
  const [deleteTenant] = useDeleteTenantMutation();

  const tenants = tenantsData?.data || [];
  const users = usersData?.data || [];

  useEffect(() => {
    if (tenantsError) {
      const error = tenantsError as {
        status?: number;
        data?: { message?: string };
      };
      const errorMessage =
        error.status === 403
          ? "You don't have permission to view tenants. Please contact your administrator."
          : error.data?.message || "Failed to load tenants";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [tenantsError, toast]);

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
    if (name === "status") {
      setFilters((prev) => ({
        ...prev,
        isActive: value === "all" ? undefined : value,
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
    setSelectedTenant(null);
    setIsReadOnly(false);
    resetFields();
    setSelectedOwnerId("");
    setSheetOpen(true);
  };

  const handleViewClick = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsReadOnly(true);
    setFieldValues({
      name: tenant.name,
      contactEmail: tenant.contactEmail,
      contactPhone: tenant.contactPhone,
      address: tenant.address || "",
    });
    setSelectedOwnerId(tenant.ownerUserId);
    setSheetOpen(true);
  };

  const handleEditClick = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsReadOnly(false);
    setFieldValues({
      name: tenant.name,
      contactEmail: tenant.contactEmail,
      contactPhone: tenant.contactPhone,
      address: tenant.address || "",
    });
    setSelectedOwnerId(tenant.ownerUserId);
    setSheetOpen(true);
  };

  const handleDeleteClick = (tenant: Tenant) => {
    setTenantToDelete(tenant);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!tenantToDelete) return;

    setIsDeletingTenant(true);
    try {
      await deleteTenant(tenantToDelete.id).unwrap();
      toast({
        title: "Success",
        description: "Tenant deleted successfully",
      });
      setDeleteDialogOpen(false);
      setTenantToDelete(null);
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete tenant",
        variant: "destructive",
      });
    } finally {
      setIsDeletingTenant(false);
    }
  };

  const handleSubmit = async () => {
    const fieldValues = fields.reduce((acc, field) => {
      acc[field.id] = field.value;
      return acc;
    }, {} as Record<string, string>);

    try {
      if (selectedTenant) {
        const updateData = {
          name: fieldValues.name,
          contactEmail: fieldValues.contactEmail,
          contactPhone: fieldValues.contactPhone,
          address: fieldValues.address || undefined,
          ownerUserId: selectedOwnerId,
        };

        await updateTenant({
          id: selectedTenant.id,
          data: updateData,
        }).unwrap();
        toast({
          title: "Success",
          description: "Tenant updated successfully",
        });
      } else {
        const createData = {
          name: fieldValues.name,
          contactEmail: fieldValues.contactEmail,
          contactPhone: fieldValues.contactPhone,
          address: fieldValues.address || undefined,
          ownerUserId: selectedOwnerId,
        };
        await createTenant(createData).unwrap();
        toast({
          title: "Success",
          description: "Tenant created successfully",
        });
      }
      setSheetOpen(false);
      setSelectedTenant(null);
      resetFields();
      setSelectedOwnerId("");
    } catch {
      return;
    }
  };

  const columns: Column<Tenant>[] = [
    {
      key: "name",
      label: "Tenant Name",
      sortable: true,
      width: "20%",
    },
    {
      key: "contactEmail",
      label: "Email",
      sortable: true,
      width: "20%",
    },
    {
      key: "contactPhone",
      label: "Phone",
      width: "12%",
    },
    {
      key: "ownerUser",
      label: "Owner",
      width: "15%",
      render: (_, tenant) => tenant.ownerUser?.fullName || "-",
    },
    {
      key: "_count",
      label: "Users",
      width: "8%",
      render: (_, tenant) => (
        <Badge variant="secondary">{tenant._count?.users || 0}</Badge>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      sortable: true,
      width: "10%",
      render: (_, tenant) => (
        <Badge variant={tenant.isActive ? "default" : "secondary"}>
          {tenant.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      width: "12%",
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  const filterFields = [
    {
      name: "status",
      label: "Status",
      type: "select" as const,
      options: [
        { label: "Active", value: "true" },
        { label: "Inactive", value: "false" },
      ],
      placeholder: "Filter by status",
    },
  ];

  const filterValues = {
    status: filters.isActive || "all",
  };

  return (
    <DashboardLayout
      title="Tenants"
      description="Manage organization tenants"
      searchPlaceholder="Search tenants..."
      searchValue={filters.search}
      onSearchChange={handleSearchChange}
      filters={filterFields}
      filterValues={filterValues}
      onFilterChange={handleFilterChange}
      actionLabel="Add Tenant"
      onActionClick={handleCreateClick}
    >
      <DataTable
        data={tenants}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No tenants found"
        emptyIcon={<Building2 className="w-12 h-12 text-gray-400" />}
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
          currentPage={tenantsData?.currentPage || 1}
          totalPages={tenantsData?.totalPages || 1}
          hasNextPage={tenantsData?.hasNextPage || false}
          hasPreviousPage={tenantsData?.hasPreviousPage || false}
          total={tenantsData?.total || 0}
          limit={tenantsData?.limit || 10}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      <FormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={
          isReadOnly
            ? "View Tenant"
            : selectedTenant
            ? "Edit Tenant"
            : "Create Tenant"
        }
        description={
          isReadOnly
            ? "View tenant details and owner information"
            : selectedTenant
            ? "Update the tenant details"
            : "Add a new tenant to the system"
        }
        sections={[
          {
            title: "Tenant Information",
            fields: fields,
          },
        ]}
        onFieldChange={updateField}
        onSubmit={handleSubmit}
        submitText={selectedTenant ? "Update Tenant" : "Create Tenant"}
        isSubmitting={isCreating || isUpdating}
        messages={messages}
        isReadOnly={isReadOnly}
      >
        <div className="space-y-2">
          {isReadOnly ? (
            <>
              <FormLabel required>Owner</FormLabel>
              <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                <span className="text-sm">
                  {selectedTenant?.ownerUser?.fullName || "-"}
                </span>
              </div>
            </>
          ) : (
            <>
              <FormLabel required>Owner</FormLabel>
              <Select
                value={selectedOwnerId}
                onValueChange={setSelectedOwnerId}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingUsers ? (
                    <SelectItem value="loading" disabled>
                      Loading users...
                    </SelectItem>
                  ) : (
                    users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.fullName} {user.email && `(${user.email})`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </FormSheet>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Tenant"
        description="This will permanently delete this tenant. This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        isLoading={isDeletingTenant}
      />
    </DashboardLayout>
  );
}
