import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Plus, X, Save, Instagram, Facebook, MessageCircle, Image, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AVAILABLE_LANGUAGES = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese", 
  "Arabic", "Chinese", "Japanese", "Korean", "Russian", "Hindi"
];

const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", icon: Instagram, placeholder: "@username" },
  { key: "facebook", label: "Facebook", icon: Facebook, placeholder: "Profile URL" },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, placeholder: "+1234567890" },
  { key: "snapchat", label: "Snapchat", icon: MessageCircle, placeholder: "@username" },
  { key: "tiktok", label: "TikTok", icon: MessageCircle, placeholder: "@username" },
];

const CheckerProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [checkerId, setCheckerId] = useState<string | null>(null);
  
const [formData, setFormData] = useState({
    display_name: "",
    age: "",
    gender: "male",
    description: "",
    price: "",
    avatar_url: "",
    languages: [] as string[],
    social_media: {} as Record<string, string>,
    gallery_images: [] as string[],
  });

  useEffect(() => {
    loadCheckerProfile();
  }, []);

  const loadCheckerProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user is a checker
      const { data: checker, error } = await supabase
        .from("checkers")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error || !checker) {
        toast.error("لم يتم العثور على ملف المتحقق");
        navigate("/");
        return;
      }

      setCheckerId(checker.id);
      setFormData({
        display_name: checker.display_name || "",
        age: checker.age?.toString() || "",
        gender: checker.gender || "male",
        description: checker.description || "",
        price: checker.price?.toString() || "",
        avatar_url: checker.avatar_url || "",
        languages: checker.languages || [],
        social_media: (checker.social_media as Record<string, string>) || {},
        gallery_images: (checker as any).gallery_images || [],
      });
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("حدث خطأ في تحميل الملف الشخصي");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار صورة صالحة");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 5 ميجابايت");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("checker-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("checker-images")
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success("تم رفع الصورة بنجاح");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("فشل في رفع الصورة");
    } finally {
      setUploading(false);
    }
  };

  const toggleLanguage = (lang: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  const updateSocialMedia = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      social_media: { ...prev.social_media, [platform]: value },
    }));
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (formData.gallery_images.length + files.length > 6) {
      toast.error("يمكنك رفع 6 صور كحد أقصى");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newUrls: string[] = [];

      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 5 * 1024 * 1024) continue;

        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/gallery/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("checker-images")
          .upload(fileName, file);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from("checker-images")
            .getPublicUrl(fileName);
          newUrls.push(publicUrl);
        }
      }

      setFormData(prev => ({
        ...prev,
        gallery_images: [...prev.gallery_images, ...newUrls],
      }));
      toast.success(`تم رفع ${newUrls.length} صورة`);
    } catch (error) {
      console.error("Gallery upload error:", error);
      toast.error("فشل في رفع الصور");
    } finally {
      setUploading(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      gallery_images: prev.gallery_images.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!checkerId) return;

    if (!formData.display_name.trim()) {
      toast.error("يرجى إدخال اسم العرض");
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error("يرجى إدخال سعر صالح");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("checkers")
        .update({
          display_name: formData.display_name,
          age: formData.age ? parseInt(formData.age) : null,
          gender: formData.gender,
          description: formData.description,
          price: parseFloat(formData.price),
          avatar_url: formData.avatar_url,
          languages: formData.languages,
          social_media: formData.social_media,
          gallery_images: formData.gallery_images,
        } as any)
        .eq("id", checkerId);

      if (error) throw error;

      toast.success("تم حفظ الملف الشخصي بنجاح");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("فشل في حفظ الملف الشخصي");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-card/95 backdrop-blur-md z-30 border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">ملفي الشخصي</h1>
          <Button onClick={handleSave} disabled={saving} size="sm">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "جاري الحفظ..." : "حفظ"}
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-6 pb-20">
        {/* Avatar Section */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-secondary overflow-hidden border-4 border-primary/20">
              {formData.avatar_url ? (
                <img
                  src={formData.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Camera className="w-10 h-10" />
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center cursor-pointer shadow-lg">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploading}
              />
              {uploading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus className="w-5 h-5 text-primary-foreground" />
              )}
            </label>
          </div>
          <p className="text-sm text-muted-foreground mt-2">اضغط لتغيير الصورة</p>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <Label>اسم العرض *</Label>
            <Input
              value={formData.display_name}
              onChange={e => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
              placeholder="اسمك الذي سيظهر للعملاء"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>العمر</Label>
              <Input
                type="number"
                value={formData.age}
                onChange={e => setFormData(prev => ({ ...prev, age: e.target.value }))}
                placeholder="25"
                className="mt-1"
              />
            </div>
            <div>
              <Label>السعر ($) *</Label>
              <Input
                type="number"
                value={formData.price}
                onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="50"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label>الجنس</Label>
            <div className="flex gap-2 mt-1">
              {[
                { value: "male", label: "ذكر" },
                { value: "female", label: "أنثى" },
                { value: "other", label: "آخر" },
              ].map(option => (
                <Button
                  key={option.value}
                  type="button"
                  variant={formData.gender === option.value ? "default" : "outline"}
                  onClick={() => setFormData(prev => ({ ...prev, gender: option.value }))}
                  className="flex-1"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label>الوصف</Label>
            <Textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="اكتب نبذة عنك وخبرتك..."
              className="mt-1 min-h-[100px]"
            />
          </div>
        </div>

        {/* Photo Gallery */}
        <div>
          <Label className="mb-3 block">معرض الصور ({formData.gallery_images.length}/6)</Label>
          <div className="grid grid-cols-3 gap-2">
            {formData.gallery_images.map((url, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-secondary">
                <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeGalleryImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-destructive rounded-full flex items-center justify-center"
                >
                  <Trash2 className="w-3 h-3 text-destructive-foreground" />
                </button>
              </div>
            ))}
            {formData.gallery_images.length < 6 && (
              <label className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryUpload}
                  className="hidden"
                  disabled={uploading}
                />
                {uploading ? (
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Image className="w-6 h-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">إضافة صور</span>
                  </>
                )}
              </label>
            )}
          </div>
        </div>

        {/* Languages */}
        <div>
          <Label className="mb-2 block">اللغات التي تتحدثها</Label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_LANGUAGES.map(lang => (
              <Badge
                key={lang}
                variant={formData.languages.includes(lang) ? "default" : "outline"}
                className="cursor-pointer transition-all"
                onClick={() => toggleLanguage(lang)}
              >
                {lang}
                {formData.languages.includes(lang) && (
                  <X className="w-3 h-3 ml-1" />
                )}
              </Badge>
            ))}
          </div>
        </div>

        {/* Social Media */}
        <div>
          <Label className="mb-3 block">وسائل التواصل الاجتماعي</Label>
          <div className="space-y-3">
            {SOCIAL_PLATFORMS.map(platform => {
              const Icon = platform.icon;
              return (
                <div key={platform.key} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <Input
                    value={formData.social_media[platform.key] || ""}
                    onChange={e => updateSocialMedia(platform.key, e.target.value)}
                    placeholder={platform.placeholder}
                    className="flex-1"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckerProfile;
