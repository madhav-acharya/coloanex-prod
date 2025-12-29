import { useState, useRef } from "react";
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
import { useUploadSingleMutation } from "@/apis/uploadApi";
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  Phone,
  User,
  Calendar,
  Shield,
  Camera,
} from "lucide-react";

const Profile = () => {
  const { user } = useAuth();
  const [updateUser, { isLoading }] = useUpdateUserMutation();
  const [uploadFile, { isLoading: isUploading }] = useUploadSingleMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    try {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      const imageFormData = new FormData();
      imageFormData.append("file", file);
      imageFormData.append("category", "profile");

      const uploadResponse = await uploadFile(imageFormData).unwrap();
      setPreviewImage(uploadResponse.url);
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to upload image");
      setSelectedImage(null);
      setPreviewImage("");
    }
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
      if (previewImage && previewImage !== user.profileImage) {
        updateData.profileImage = previewImage;
      }

      if (Object.keys(updateData).length > 0) {
        await updateUser({
          id: user.id,
          data: updateData,
        }).unwrap();
      }

      toast.success("Profile updated successfully");
      setIsEditing(false);
      setSelectedImage(null);
      setPreviewImage("");
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
    setSelectedImage(null);
    setPreviewImage("");
    setIsEditing(false);
  };

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
                      src={previewImage || user.profileImage}
                      alt={user.fullName}
                    />
                    <AvatarFallback className="bg-gradient-hero text-white text-3xl font-bold">
                      {user.fullName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Camera className="w-6 h-6 text-white" />
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
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
                    {selectedImage && (
                      <Badge variant="secondary" className="text-xs">
                        New image selected
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

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
                      user.lastActiveAt || ""
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
                    disabled={isLoading || isUploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || isUploading}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isLoading || isUploading ? (
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
              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4" />
                  Roles
                </Label>
                <div className="flex flex-wrap gap-2">
                  {user.roles && user.roles.length > 0 ? (
                    user.roles.map((roleWrapper) => (
                      <Badge
                        key={roleWrapper.role.id}
                        variant="outline"
                        className="px-3 py-1"
                      >
                        {roleWrapper.role.name}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No roles assigned
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4" />
                  Permissions
                </Label>
                <div className="flex flex-wrap gap-2">
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
                        <Badge
                          key={index}
                          variant="secondary"
                          className="px-3 py-1"
                        >
                          {permissionName}
                        </Badge>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No permissions assigned
                    </p>
                  )}
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
