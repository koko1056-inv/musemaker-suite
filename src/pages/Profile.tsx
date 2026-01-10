import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Loader2, Camera, User, Mail, Save } from "lucide-react";
import { z } from "zod";

const nameSchema = z.string().max(100, "氏名は100文字以内で入力してください");

const Profile = () => {
  const { user } = useAuth();
  const { profile, isLoading, isUpdating, updateProfile, uploadAvatar } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [fullName, setFullName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form when profile loads
  useState(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  });

  // Update form when profile changes
  if (profile?.full_name && fullName === "" && !hasChanges) {
    setFullName(profile.full_name);
  }

  const handleNameChange = (value: string) => {
    setFullName(value);
    setHasChanges(true);
    
    const result = nameSchema.safeParse(value);
    if (!result.success) {
      setNameError(result.error.errors[0].message);
    } else {
      setNameError(null);
    }
  };

  const handleSave = async () => {
    if (nameError) return;
    
    await updateProfile({ full_name: fullName.trim() || null });
    setHasChanges(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    setIsUploading(true);
    const avatarUrl = await uploadAvatar(file);
    
    if (avatarUrl) {
      await updateProfile({ avatar_url: avatarUrl });
    }
    
    setIsUploading(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">プロフィール</h1>
        <p className="text-muted-foreground">アカウント情報を管理します</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            基本情報
          </CardTitle>
          <CardDescription>
            プロフィール画像と氏名を編集できます
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-2 border-border">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={handleAvatarClick}
                disabled={isUploading}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <div className="space-y-1">
              <p className="font-medium">プロフィール画像</p>
              <p className="text-sm text-muted-foreground">
                クリックして画像をアップロード（最大5MB）
              </p>
            </div>
          </div>

          <Separator />

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="full-name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              氏名
            </Label>
            <Input
              id="full-name"
              value={fullName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="山田 太郎"
              disabled={isUpdating}
            />
            {nameError && (
              <p className="text-sm text-destructive">{nameError}</p>
            )}
          </div>

          {/* Email Field (Read Only) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              メールアドレス
            </Label>
            <Input
              value={profile?.email || user?.email || ""}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              メールアドレスは変更できません
            </p>
          </div>

          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            disabled={isUpdating || !hasChanges || !!nameError}
            className="w-full sm:w-auto"
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                変更を保存
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
