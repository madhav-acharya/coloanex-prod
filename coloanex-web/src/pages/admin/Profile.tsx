import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUpdateUserMutation } from "@/apis/usersApi";
import { useGetTenantQuery, useUpdateTenantMutation } from "@/apis/tenantsApi";
import { FileUploader } from "@/components/shared/FileUploader";
import type { UploadedFile } from "@/types/upload";
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  Phone,
  User,
  Calendar,
  Shield,
  Lock,
} from "lucide-react";

const Profile = () => {
  const { user } = useAuth();
  const [updateUser, { isLoading }] = useUpdateUserMutation();
  const [updateTenant, { isLoading: isUpdatingTenant }] =
    useUpdateTenantMutation();
  const { data: tenant } = useGetTenantQuery(user?.tenantId || "", {
    skip: !user?.tenantId,
  });
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [tenantLogo, setTenantLogo] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
      setProfileImageUrl(user.profileImage || "");
    }
  }, [user]);

  useEffect(() => {
    setTenantLogo(tenant?.logo || "");
  }, [tenant?.logo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      const updateData: any = {};
      if (formData.fullName !== user.fullName) {
        updateData.fullName = formData.fullName;
      }
      if (formData.email && formData.email !== user.email) {
        updateData.email = formData.email;
      }
      if (formData.phone && formData.phone !== user.phone) {
        updateData.phone = formData.phone;
      }
      if (profileImageUrl && profileImageUrl !== user.profileImage) {
        updateData.profileImage = profileImageUrl;
      }

      if (Object.keys(updateData).length > 0) {
        await updateUser({
          id: user.id,
          data: updateData,
        }).unwrap();
      }

      if (user.tenantId && tenantLogo && tenantLogo !== tenant?.logo) {
        await updateTenant({
          id: user.tenantId,
          data: { logo: tenantLogo },
        }).unwrap();
      }

      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update profile");
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
    setProfileImageUrl(user?.profileImage || "");
    setTenantLogo(tenant?.logo || "");
    setIsEditing(false);
  };

  const profileFiles: UploadedFile[] = profileImageUrl
    ? [
        {
          url: profileImageUrl,
          fileName: "profile-image",
          mimeType: "image/*",
          sizeInBytes: 0,
        },
      ]
    : [];

  const tenantLogoFiles: UploadedFile[] = tenantLogo
    ? [
        {
          url: tenantLogo,
          fileName: "tenant-logo",
          mimeType: "image/*",
          sizeInBytes: 0,
        },
      ]
    : [];

  if (!user) {
    return (
      <DashboardLayout title="Profile" description="Manage your profile">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Profile"
      description="View and manage your profile information"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Personal Information</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Update your personal details and contact information
              </p>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} size="sm">
                Edit Profile
              </Button>
            )}
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center gap-6 mb-6">
                <div className="relative group">
                  <Avatar className="w-20 h-20 shadow-lg">
                    <AvatarImage
                      src={profileImageUrl || user.profileImage}
                      alt={user.fullName}
                    />
                    <AvatarFallback className="bg-gradient-hero text-white text-3xl font-bold">
                      {user.fullName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{user.fullName}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      variant={user.isActive ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>

              {isEditing && (
                <FileUploader
                  label="Profile Image"
                  accept="image"
                  maxFiles={1}
                  value={profileFiles}
                  onChange={(files) => setProfileImageUrl(files[0]?.url || "")}
                  folder="profile"
                />
              )}

              {user.tenantId && (
                <div className="space-y-3 rounded-xl border border-border/70 p-4">
                  <p className="text-sm font-medium">Organization Logo</p>
                  <FileUploader
                    label="Tenant Logo"
                    accept="image"
                    maxFiles={1}
                    value={tenantLogoFiles}
                    onChange={(files) => setTenantLogo(files[0]?.url || "")}
                    folder="tenant"
                    disabled={!isEditing || isUpdatingTenant}
                  />
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    required
                    className="disabled:opacity-100 disabled:cursor-default"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="disabled:opacity-100 disabled:cursor-default"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="disabled:opacity-100 disabled:cursor-default"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Member Since
                  </Label>
                  <Input
                    value={new Date(
                      user.lastActiveAt || "",
                    ).toLocaleDateString()}
                    disabled
                    className="disabled:opacity-100 disabled:cursor-default"
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-3 justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isLoading || isUpdatingTenant}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || isUpdatingTenant}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isLoading || isUpdatingTenant ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Roles & Permissions</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Your assigned roles and permissions in the system
            </p>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <Label className="flex items-center gap-2 mb-3 text-base font-semibold">
                    <Shield className="w-5 h-5 text-primary" />
                    Assigned Roles
                  </Label>
                  <div className="grid gap-3">
                    {user.roles && user.roles.length > 0 ? (
                      user.roles.map((roleWrapper) => (
                        <div
                          key={roleWrapper.role.id}
                          className="p-3 rounded-xl border border-border/70 bg-card/50 hover:bg-card transition-colors shadow-sm"
                        >
                          <p className="font-semibold text-sm">
                            {roleWrapper.role.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 lowercase first-letter:uppercase">
                            {roleWrapper.role.description ||
                              `Access level granted by ${roleWrapper.role.name} role`}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed text-center">
                        <p className="text-sm text-muted-foreground">
                          No roles assigned
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="flex items-center gap-2 mb-3 text-base font-semibold">
                    <Lock className="w-5 h-5 text-primary" />
                    Specific Permissions
                  </Label>
                  <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted">
                    {user.permissions && user.permissions.length > 0 ? (
                      (Array.isArray(user.permissions)
                        ? user.permissions
                        : []
                      ).map((permission: any, index: number) => {
                        const permissionName =
                          typeof permission === "string"
                            ? permission
                            : permission?.permission?.name ||
                              permission?.name ||
                              "Unknown";
                        return (
                          <div
                            key={index}
                            className="p-3 rounded-xl border border-border/70 bg-card/50 hover:bg-card transition-colors shadow-sm"
                          >
                            <p className="font-semibold text-sm">
                              {permissionName}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Allows you to {permissionName.toLowerCase()}{" "}
                              within the platform
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed text-center">
                        <p className="text-sm text-muted-foreground">
                          No individual permissions assigned
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
