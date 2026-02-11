import { useState, useMemo } from "react";
import { Eye, Edit, Trash2, Plus, FileText } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Pagination } from "@/components/ui/pagination";
import { DataTable } from "@/components/shared/DataTable";
import { Column } from "@/types/components";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { FormSheet } from "@/components/shared/FormSheet";
import { Button } from "@/components/ui/button";
import {
  useGetRulesQuery,
  useCreateRuleMutation,
  useUpdateRuleMutation,
  useDeleteRuleMutation,
  Rule,
  CreateRuleDto,
} from "@/apis/rulesApi";

export default function Rules() {
  const { toast } = useToast();
  const [ruleFormOpen, setRuleFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<Rule | null>(null);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [formData, setFormData] = useState<Record<string, any>>({});

  const { data: rules = [], isLoading } = useGetRulesQuery();
  const [createRule, { isLoading: isCreating }] = useCreateRuleMutation();
  const [updateRule, { isLoading: isUpdating }] = useUpdateRuleMutation();
  const [deleteRule, { isLoading: isDeleting }] = useDeleteRuleMutation();

  const filteredRules = useMemo(() => {
    let filtered = rules.filter((rule) => {
      const matchesSearch =
        searchValue === "" ||
        rule.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        rule.ruleType.toLowerCase().includes(searchValue.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && rule.isActive) ||
        (statusFilter === "inactive" && !rule.isActive);
      return matchesSearch && matchesStatus;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortBy as keyof Rule];
      const bValue = b[sortBy as keyof Rule];

      if (aValue === bValue) return 0;
      const comparison = aValue > bValue ? 1 : -1;
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [rules, searchValue, statusFilter, sortBy, sortOrder]);

  const paginatedRules = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredRules.slice(startIndex, endIndex);
  }, [filteredRules, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredRules.length / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };

  const columns: Column<Rule>[] = [
    { key: "name", label: "Name", sortable: true },
    {
      key: "ruleType",
      label: "Type",
      sortable: true,
      render: (rule) => (
        <Badge variant="outline">{rule.ruleType.replace(/_/g, " ")}</Badge>
      ),
    },
    {
      key: "interestRate",
      label: "Interest Rate",
      sortable: true,
      render: (rule) => `${rule.interestRate}%`,
    },
    {
      key: "isActive",
      label: "Status",
      sortable: true,
      render: (rule) => (
        <Badge variant={rule.isActive ? "default" : "secondary"}>
          {rule.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      label: "Created At",
      sortable: true,
      render: (rule) => new Date(rule.createdAt).toLocaleDateString(),
    },
  ];

  const handleView = (rule: Rule) => {
    setEditingRule(rule);
    setIsReadOnly(true);
    setFormData({
      name: rule.name,
      description: rule.description || "",
      ruleType: rule.ruleType,
      interestRate: rule.interestRate?.toString() || "",
      minAmount: rule.loanLimits?.minAmount?.toString() || "",
      maxAmount: rule.loanLimits?.maxAmount?.toString() || "",
      minTermMonths: rule.loanLimits?.minTermMonths?.toString() || "",
      maxTermMonths: rule.loanLimits?.maxTermMonths?.toString() || "",
      penaltyType: rule.penaltyConfig?.penaltyType || "",
      penaltyAmount: rule.penaltyConfig?.penaltyAmount?.toString() || "",
      gracePeriodDays: rule.penaltyConfig?.gracePeriodDays?.toString() || "",
      isActive: rule.isActive,
      isPubliclyVisible: rule.isPubliclyVisible,
    });
    setRuleFormOpen(true);
  };

  const handleEdit = (rule: Rule) => {
    setEditingRule(rule);
    setIsReadOnly(false);
    setFormData({
      name: rule.name,
      description: rule.description || "",
      ruleType: rule.ruleType,
      interestRate: rule.interestRate?.toString() || "",
      minAmount: rule.loanLimits?.minAmount?.toString() || "",
      maxAmount: rule.loanLimits?.maxAmount?.toString() || "",
      minTermMonths: rule.loanLimits?.minTermMonths?.toString() || "",
      maxTermMonths: rule.loanLimits?.maxTermMonths?.toString() || "",
      penaltyType: rule.penaltyConfig?.penaltyType || "",
      penaltyAmount: rule.penaltyConfig?.penaltyAmount?.toString() || "",
      gracePeriodDays: rule.penaltyConfig?.gracePeriodDays?.toString() || "",
      isActive: rule.isActive,
      isPubliclyVisible: rule.isPubliclyVisible,
    });
    setRuleFormOpen(true);
  };

  const handleDelete = (rule: Rule) => {
    setRuleToDelete(rule);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!ruleToDelete) return;

    try {
      await deleteRule(ruleToDelete.id).unwrap();
      toast({
        title: "Success",
        description: "Rule deleted successfully",
      });
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to delete rule",
        variant: "destructive",
      });
    }
  };

  const handleFormSubmit = async () => {
    try {
      const ruleData: CreateRuleDto = {
        name: formData.name,
        description: formData.description,
        ruleType: formData.ruleType,
        interestRate: parseFloat(formData.interestRate),
        loanLimits: {
          minAmount: parseFloat(formData.minAmount),
          maxAmount: parseFloat(formData.maxAmount),
          minTermMonths: parseInt(formData.minTermMonths),
          maxTermMonths: parseInt(formData.maxTermMonths),
        },
        penaltyConfig: {
          penaltyType: formData.penaltyType,
          penaltyAmount: parseFloat(formData.penaltyAmount),
          gracePeriodDays: parseInt(formData.gracePeriodDays),
        },
        paymentConfig: {
          allowedFrequencies: formData.allowedFrequencies || ["MONTHLY"],
          allowEarlyPayment: formData.allowEarlyPayment || false,
          earlyPaymentPenalty: formData.earlyPaymentPenalty
            ? parseFloat(formData.earlyPaymentPenalty)
            : undefined,
        },
        isActive: formData.isActive ?? true,
        isPubliclyVisible: formData.isPubliclyVisible ?? true,
      };

      if (editingRule) {
        await updateRule({ id: editingRule.id, data: ruleData }).unwrap();
        toast({
          title: "Success",
          description: "Rule updated successfully",
        });
      } else {
        await createRule(ruleData).unwrap();
        toast({
          title: "Success",
          description: "Rule created successfully",
        });
      }

      setRuleFormOpen(false);
      setEditingRule(null);
      setFormData({});
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.data?.message ||
          `Failed to ${editingRule ? "update" : "create"} rule`,
        variant: "destructive",
      });
    }
  };

  const ruleFields = [
    {
      name: "name",
      label: "Rule Name",
      type: "text" as const,
      required: true,
      placeholder: "Enter rule name",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea" as const,
      placeholder: "Enter rule description",
    },
    {
      name: "ruleType",
      label: "Rule Type",
      type: "select" as const,
      required: true,
      options: [
        { value: "STANDARD", label: "Standard" },
        { value: "PREMIUM", label: "Premium" },
        { value: "MICRO_LOAN", label: "Micro Loan" },
        { value: "BUSINESS_LOAN", label: "Business Loan" },
      ],
    },
    {
      name: "interestRate",
      label: "Interest Rate (%)",
      type: "number" as const,
      required: true,
      placeholder: "e.g., 12.5",
    },
    {
      name: "minAmount",
      label: "Minimum Loan Amount",
      type: "number" as const,
      required: true,
      placeholder: "e.g., 10000",
    },
    {
      name: "maxAmount",
      label: "Maximum Loan Amount",
      type: "number" as const,
      required: true,
      placeholder: "e.g., 1000000",
    },
    {
      name: "minTermMonths",
      label: "Minimum Term (Months)",
      type: "number" as const,
      required: true,
      placeholder: "e.g., 6",
    },
    {
      name: "maxTermMonths",
      label: "Maximum Term (Months)",
      type: "number" as const,
      required: true,
      placeholder: "e.g., 60",
    },
    {
      name: "penaltyType",
      label: "Penalty Type",
      type: "select" as const,
      required: true,
      options: [
        { value: "PERCENTAGE", label: "Percentage" },
        { value: "FIXED_AMOUNT", label: "Fixed Amount" },
      ],
    },
    {
      name: "penaltyAmount",
      label: "Penalty Amount",
      type: "number" as const,
      required: true,
      placeholder: "e.g., 5",
    },
    {
      name: "gracePeriodDays",
      label: "Grace Period (Days)",
      type: "number" as const,
      required: true,
      placeholder: "e.g., 7",
    },
    {
      name: "isActive",
      label: "Active",
      type: "checkbox" as const,
    },
    {
      name: "isPubliclyVisible",
      label: "Publicly Visible",
      type: "checkbox" as const,
    },
  ];

  const actions = [
    {
      label: "View",
      icon: <Eye className="w-4 h-4" />,
      onClick: handleView,
    },
    {
      label: "Edit",
      icon: <Edit className="w-4 h-4" />,
      onClick: handleEdit,
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: handleDelete,
      variant: "destructive" as const,
    },
  ];

  return (
    <DashboardLayout
      title="Loan Rules"
      description="Manage loan rules and configurations"
      searchPlaceholder="Search rules by name or type..."
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      actions={[
        {
          label: "Add Rule",
          onClick: () => {
            setEditingRule(null);
            setIsReadOnly(false);
            setFormData({});
            setRuleFormOpen(true);
          },
          variant: "default",
        },
      ]}
      filters={[
        {
          name: "status",
          type: "select",
          label: "Status",
          placeholder: "All Status",
          options: [
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ],
        },
      ]}
      filterValues={{ status: statusFilter }}
      onFilterChange={(name, value) => {
        if (name === "status") setStatusFilter(value);
      }}
    >
      <div className="space-y-6">
        <DataTable
          columns={columns}
          data={paginatedRules}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="No loan rules found"
          emptyIcon={<FileText className="w-12 h-12 text-gray-400" />}
          onSort={handleSort}
          sortBy={sortBy}
          sortOrder={sortOrder}
        />

        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            hasNextPage={currentPage < totalPages}
            hasPreviousPage={currentPage > 1}
            total={filteredRules.length}
            limit={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>

        <FormSheet
          open={ruleFormOpen}
          onOpenChange={(open) => {
            if (!open) {
              setEditingRule(null);
              setIsReadOnly(false);
              setFormData({});
            }
          }}
          title={
            isReadOnly
              ? "View Rule"
              : editingRule
                ? "Edit Rule"
                : "Create New Rule"
          }
          description="Configure loan rule settings"
          sections={[
            {
              fields: ruleFields.map((field) => ({
                id: field.name,
                label: field.label,
                value: formData[field.name]?.toString() || "",
                placeholder: field.placeholder,
                required: field.required,
                type: field.type,
                options: field.options,
                disabled: isReadOnly,
              })),
            },
          ]}
          onFieldChange={(fieldId, value) => {
            setFormData((prev) => ({
              ...prev,
              [fieldId]: value,
            }));
          }}
          onSubmit={handleFormSubmit}
          submitText={editingRule ? "Update Rule" : "Create Rule"}
          isSubmitting={isCreating || isUpdating}
          isReadOnly={isReadOnly}
        />

        <ConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={confirmDelete}
          title="Delete Rule"
          description={`Are you sure you want to delete the rule "${ruleToDelete?.name}"? This action cannot be undone.`}
          isLoading={isDeleting}
        />
      </div>
    </DashboardLayout>
  );
}
