import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import BorrowerLayout from "@/components/layouts/BorrowerLayout";
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
  Lock,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const BorrowerProfile = () => {
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

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

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
      <BorrowerLayout title="Profile" description="Manage your profile">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </BorrowerLayout>
    );
  }

  return (
    <BorrowerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Header */}
        <div className="space-y-3 animate-fade-in text-center sm:text-left">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-foreground font-headline leading-none">
            Personal Identity
          </h1>
          <p className="text-muted-foreground text-lg sm:text-xl font-medium max-w-2xl">
            Manage your digital identity and contact preferences across CoLoanEx.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-up">
          {/* Avatar & Summary */}
          <Card className="lg:col-span-1 bg-surface/40 backdrop-blur-xl border border-border/40 rounded-[2.5rem] p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-700" />
            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
              <div className="relative group">
                <Avatar className="w-32 h-32 shadow-2xl border-4 border-background ring-4 ring-primary/10">
                  <AvatarImage src={previewImage || user.profileImage} alt={user.fullName} />
                  <AvatarFallback className="bg-gradient-hero text-white text-4xl font-black">
                    {user.fullName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-full">
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                  </div>
                )}
                {isEditing && !isUploading && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-2 border-primary"
                  >
                    <Camera className="w-8 h-8 text-white" />
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-foreground tracking-tight">{user.fullName}</h3>
                <p className="text-muted-foreground font-medium">{user.email}</p>
                <div className="flex justify-center gap-2 pt-2">
                  <Badge variant="outline" className={cn(
                    "rounded-full px-4 py-1 font-black text-[10px] uppercase tracking-widest",
                    user.isActive ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                  )}>
                    {user.isActive ? "Active Account" : "Inactive"}
                  </Badge>
                </div>
              </div>

              <div className="w-full pt-8 grid grid-cols-2 gap-4 border-t border-border/20">
                 <div className="space-y-1 text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Joined</p>
                    <p className="font-bold text-sm">{format(new Date(user.lastActiveAt || Date.now()), "MMM yyyy")}</p>
                 </div>
                 <div className="space-y-1 text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Level</p>
                    <p className="font-bold text-sm text-primary">Silver Tier</p>
                 </div>
              </div>
            </div>
          </Card>

          {/* Form */}
          <Card className="lg:col-span-2 bg-surface/40 backdrop-blur-xl border border-border/40 rounded-[2.5rem] p-10">
            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
                  <User className="w-6 h-6 text-primary" /> Profile Details
                </h3>
                {!isEditing && (
                  <Button onClick={() => setIsEditing(true)} variant="outline" className="rounded-full px-6 font-bold text-xs uppercase tracking-widest border-primary/20 hover:bg-primary/5">
                    Modify Details
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label htmlFor="fullName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Display Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="h-14 rounded-2xl bg-surface-container/30 border-border/40 focus:ring-primary/20 font-bold transition-all disabled:opacity-70"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Verified Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="h-14 rounded-2xl bg-surface-container/30 border-border/40 focus:ring-primary/20 font-bold transition-all disabled:opacity-70"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Mobile Contact</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="h-14 rounded-2xl bg-surface-container/30 border-border/40 focus:ring-primary/20 font-bold transition-all disabled:opacity-70"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Account Since</Label>
                  <Input
                    value={format(new Date(user.lastActiveAt || Date.now()), "PPPP")}
                    disabled
                    className="h-14 rounded-2xl bg-surface-container/10 border-border/20 font-bold opacity-50"
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-4 justify-end pt-6 border-t border-border/20">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCancel}
                    disabled={isLoading || isUploading}
                    className="rounded-full px-8 font-bold text-xs uppercase tracking-widest"
                  >
                    Discard
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || isUploading}
                    className="rounded-full px-12 h-12 bg-primary hover:bg-primary/90 font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20"
                  >
                    {isLoading || isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Commit Changes"}
                  </Button>
                </div>
              )}
            </form>
          </Card>
        </div>

        {/* Roles & Permissions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-up delay-200">
           <Card className="bg-surface/40 backdrop-blur-xl border border-border/40 rounded-[2.5rem] p-8">
              <h3 className="text-lg font-black tracking-tight flex items-center gap-3 mb-6">
                 <Shield className="w-5 h-5 text-primary" /> Authority
              </h3>
              <div className="space-y-4">
                 {user.roles?.map((r) => (
                    <div key={r.role.id} className="p-5 rounded-2xl bg-primary/5 border border-primary/20 group hover:bg-primary/10 transition-all">
                       <p className="font-black text-primary text-sm uppercase tracking-wider">{r.role.name}</p>
                       <p className="text-xs text-muted-foreground mt-1 font-medium">{r.role.description || "Unrestricted platform participant"}</p>
                    </div>
                 ))}
              </div>
           </Card>

           <Card className="bg-surface/40 backdrop-blur-xl border border-border/40 rounded-[2.5rem] p-8 overflow-hidden">
              <h3 className="text-lg font-black tracking-tight flex items-center gap-3 mb-6">
                 <Lock className="w-5 h-5 text-primary" /> Active Permissions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-premium">
                 {user.permissions?.map((p: any, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-surface-container/20 border border-border/20 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                       {typeof p === 'string' ? p : p?.name || 'Authorized'}
                    </div>
                 ))}
              </div>
           </Card>
        </div>
      </div>
    </BorrowerLayout>
  );
};

export default BorrowerProfile;
