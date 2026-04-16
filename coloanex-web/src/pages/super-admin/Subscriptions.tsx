import { useMemo, useState } from "react";
import { CreditCard } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { DataCard, DataCardGrid } from "@/components/shared/DataCard";
import { FormSheet } from "@/components/shared/FormSheet";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useFormFields } from "@/hooks/use-form-fields";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreatePlanMutation,
  useDeletePlanMutation,
  useListPlansQuery,
  type SubscriptionPlan,
  useUpdatePlanMutation,
} from "@/apis/subscriptionsApi";

export default function Subscriptions() {
  const { toast } = useToast();
  const [searchValue, setSearchValue] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null,
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<SubscriptionPlan | null>(
    null,
  );
  const [isDeletingPlan, setIsDeletingPlan] = useState(false);
  const [featureDraft, setFeatureDraft] = useState("");
  const [featuresList, setFeaturesList] = useState<string[]>([]);
  const [showFeatureInput, setShowFeatureInput] = useState(true);

  const { fields, updateField, resetFields, setFieldValues, getFieldValues } =
    useFormFields([
      {
        id: "code",
        label: "Plan Code",
        value: "",
        placeholder: "e.g. starter",
        required: true,
      },
      {
        id: "name",
        label: "Plan Name",
        value: "",
        placeholder: "e.g. Starter Plan",
        required: true,
      },
      {
        id: "scope",
        label: "Plan Scope",
        value: "USER",
        type: "select",
        options: [
          { value: "USER", label: "User Plan" },
          { value: "TENANT", label: "Tenant Plan" },
        ],
      },
      {
        id: "price",
        label: "Price (NPR)",
        value: "",
        placeholder: "e.g. 999",
        required: true,
        type: "number",
      },
      {
        id: "maxTransactions",
        label: "Max Transactions",
        value: "100",
        placeholder: "e.g. 1000",
        required: true,
        type: "number",
      },
      {
        id: "billingCycle",
        label: "Billing Cycle",
        value: "MONTHLY",
        type: "select",
        options: [
          { value: "MONTHLY", label: "Monthly" },
          { value: "YEARLY", label: "Yearly" },
          { value: "ONCE", label: "One-time" },
        ],
      },
      {
        id: "description",
        label: "Description",
        value: "",
        placeholder: "Describe this plan",
        type: "textarea",
      },
      {
        id: "isActive",
        label: "Status",
        value: "true",
        type: "select",
        options: [
          { value: "true", label: "Active" },
          { value: "false", label: "Disabled" },
        ],
      },
    ]);

  const {
    data: plans = [],
    isLoading,
    isFetching,
    refetch,
  } = useListPlansQuery();

  const [createPlan, { isLoading: isCreatingPlan }] = useCreatePlanMutation();
  const [updatePlan, { isLoading: isUpdatingPlan }] = useUpdatePlanMutation();
  const [deletePlan] = useDeletePlanMutation();

  const filteredPlans = useMemo(() => {
    const query = searchValue.toLowerCase().trim();
    if (!query) return plans;
    return plans.filter((plan) =>
      [plan.name, plan.code, plan.description || ""]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [plans, searchValue]);

  const paginatedPlans = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredPlans.slice(startIndex, startIndex + pageSize);
  }, [filteredPlans, currentPage, pageSize]);

  const handleCreateClick = () => {
    setSelectedPlan(null);
    setIsReadOnly(false);
    resetFields();
    setFieldValues({
      billingCycle: "MONTHLY",
      isActive: "true",
      scope: "USER",
      maxTransactions: "100",
    });
    setFeaturesList([]);
    setFeatureDraft("");
    setShowFeatureInput(true);
    setSheetOpen(true);
  };

  const handleViewClick = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setIsReadOnly(true);
    setFieldValues({
      code: plan.code,
      name: plan.name,
      scope: plan.scope,
      description: plan.description || "",
      price: String(plan.price),
      maxTransactions: String(plan.maxTransactions || 0),
      billingCycle: plan.billingCycle,
      isActive: String(plan.isActive),
    });
    const normalizedFeatures = Array.isArray(plan.features)
      ? plan.features.map((item) => String(item)).filter(Boolean)
      : [];
    setFeaturesList(normalizedFeatures);
    setFeatureDraft("");
    setShowFeatureInput(false);
    setSheetOpen(true);
  };

  const handleEditClick = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setIsReadOnly(false);
    setFieldValues({
      code: plan.code,
      name: plan.name,
      scope: plan.scope,
      description: plan.description || "",
      price: String(plan.price),
      maxTransactions: String(plan.maxTransactions || 0),
      billingCycle: plan.billingCycle,
      isActive: String(plan.isActive),
    });
    const normalizedFeatures = Array.isArray(plan.features)
      ? plan.features.map((item) => String(item)).filter(Boolean)
      : [];
    setFeaturesList(normalizedFeatures);
    setFeatureDraft("");
    setShowFeatureInput(normalizedFeatures.length === 0);
    setSheetOpen(true);
  };

  const handleDeleteClick = (plan: SubscriptionPlan) => {
    setPlanToDelete(plan);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    const values = getFieldValues();
    const features = featuresList.length > 0 ? featuresList : undefined;
    const rawCode = values.code?.trim();
    const rawName = values.name?.trim();
    const rawPrice = values.price?.toString().trim();
    const rawMaxTransactions = values.maxTransactions?.toString().trim();

    const payload = {
      code: (rawCode || "").toLowerCase(),
      name: rawName || "",
      scope: (values.scope || "USER") as "USER" | "TENANT",
      description: values.description.trim() || undefined,
      features,
      price: Number(rawPrice),
      maxTransactions: Number(rawMaxTransactions),
      currency: "NPR",
      billingCycle: values.billingCycle || "MONTHLY",
      isActive: values.isActive !== "false",
    };

    if (
      !rawCode ||
      !rawName ||
      rawPrice === "" ||
      rawMaxTransactions === "" ||
      Number.isNaN(payload.price) ||
      Number.isNaN(payload.maxTransactions)
    ) {
      toast({
        title: "Missing fields",
        description: "Plan code, name, price and max transactions are required",
        variant: "destructive",
      });
      return;
    }

    if (payload.price < 0 || payload.maxTransactions < 0) {
      toast({
        title: "Invalid values",
        description: "Price and max transactions cannot be negative.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (selectedPlan) {
        await updatePlan({
          id: selectedPlan.id,
          ...payload,
        }).unwrap();
        toast({ title: "Plan updated" });
      } else {
        await createPlan(payload).unwrap();
        toast({ title: "Plan created" });
      }
      setSheetOpen(false);
      setSelectedPlan(null);
      resetFields();
      setFeaturesList([]);
      setFeatureDraft("");
      setShowFeatureInput(true);
    } catch (error: any) {
      toast({
        title: selectedPlan ? "Plan update failed" : "Plan create failed",
        description: error?.data?.message || "Try again",
        variant: "destructive",
      });
    }
  };

  const addFeature = () => {
    const nextValue = featureDraft.trim();
    if (!nextValue) return;
    if (featuresList.includes(nextValue)) {
      toast({
        title: "Feature already added",
        description: "Use a different feature text.",
      });
      return;
    }

    setFeaturesList((prev) => [...prev, nextValue]);
    setFeatureDraft("");
    setShowFeatureInput(false);
  };

  const removeFeature = (index: number) => {
    setFeaturesList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmDelete = async () => {
    if (!planToDelete) return;
    setIsDeletingPlan(true);
    try {
      await deletePlan({ id: planToDelete.id }).unwrap();
      toast({ title: "Plan deleted" });
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    } catch {
      toast({
        title: "Delete failed",
        description: "Unable to delete plan",
        variant: "destructive",
      });
    } finally {
      setIsDeletingPlan(false);
    }
  };

  return (
    <DashboardLayout
      title="Subscriptions"
      description="Manage platform subscription plans"
      searchPlaceholder="Search plans..."
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      onRefresh={refetch}
      isRefreshing={isFetching}
      isLoading={isLoading || isFetching}
      skeletonType="cards"
      actionLabel="Add Plan"
      onActionClick={handleCreateClick}
    >
      {filteredPlans.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No plans found</p>
        </div>
      ) : (
        <>
          <DataCardGrid>
            {paginatedPlans.map((plan) => (
              <DataCard
                key={plan.id}
                id={plan.id}
                title={plan.name}
                metadata={`${plan.isActive ? "Active" : "Disabled"} ${plan.scope} subscription with ${Number(plan.maxTransactions || 0).toLocaleString()} transactions `}
                icon={CreditCard}
                iconColor="text-indigo-500"
                iconBg="bg-indigo-500/10"
                onView={(id) => {
                  const item = plans.find((p) => p.id === id);
                  if (item) handleViewClick(item);
                }}
                onEdit={(id) => {
                  const item = plans.find((p) => p.id === id);
                  if (item) handleEditClick(item);
                }}
                onDelete={(id) => {
                  const item = plans.find((p) => p.id === id);
                  if (item) handleDeleteClick(item);
                }}
              />
            ))}
          </DataCardGrid>

          <div className="mt-8 pt-6 border-t border-border/50">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredPlans.length / pageSize) || 1}
              hasNextPage={currentPage * pageSize < filteredPlans.length}
              hasPreviousPage={currentPage > 1}
              total={filteredPlans.length}
              limit={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              className="mt-0"
              pageSizeOptions={[12, 24, 48, 96]}
            />
          </div>
        </>
      )}

      <FormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={
          selectedPlan
            ? isReadOnly
              ? "View Plan"
              : "Edit Plan"
            : "Create Plan"
        }
        description={
          selectedPlan
            ? isReadOnly
              ? "Review subscription plan details"
              : "Update subscription plan settings"
            : "Add a new subscription plan"
        }
        sections={[
          { title: "Plan Details", fields },
          {
            title: "Plan Features",
            customContent: (
              <div className="space-y-3 border rounded-md p-4">
                <Label>Plan Features</Label>
                {featuresList.length > 0 && (
                  <div className="space-y-2">
                    {featuresList.map((feature, index) => (
                      <div
                        key={`${feature}-${index}`}
                        className="flex items-center justify-between rounded-md border px-3 py-2"
                      >
                        <p className="text-sm">{feature}</p>
                        {!isReadOnly && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeFeature(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!isReadOnly && showFeatureInput && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter feature"
                      value={featureDraft}
                      onChange={(e) => setFeatureDraft(e.target.value)}
                    />
                    <Button
                      type="button"
                      onClick={addFeature}
                      className="bg-sky-600 hover:bg-sky-700 text-white"
                    >
                      Add
                    </Button>
                  </div>
                )}

                {!isReadOnly && !showFeatureInput && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="bg-sky-600 hover:bg-sky-700 text-white"
                    onClick={() => setShowFeatureInput(true)}
                  >
                    Add More
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        onFieldChange={updateField}
        onSubmit={handleSubmit}
        submitText={selectedPlan ? "Update Plan" : "Create Plan"}
        isSubmitting={isCreatingPlan || isUpdatingPlan}
        isReadOnly={isReadOnly}
      />

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Delete plan?"
        description={`This will permanently remove ${planToDelete?.name || "this plan"}.`}
        confirmText="Delete"
        variant="destructive"
        isLoading={isDeletingPlan}
      />
    </DashboardLayout>
  );
}
