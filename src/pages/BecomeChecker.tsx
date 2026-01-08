import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Facebook, Instagram, MessageCircle, Phone, User, Ghost, Music2, Send, Twitter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AVAILABLE_LANGUAGES = ["العربية", "English", "Français", "Español"];

const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "snapchat", label: "Snapchat", icon: Ghost },
  { key: "tiktok", label: "TikTok", icon: Music2 },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { key: "telegram", label: "Telegram", icon: Send },
  { key: "facebook", label: "Facebook", icon: Facebook },
  { key: "twitter", label: "X (Twitter)", icon: Twitter },
];

const BecomeChecker = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasExistingRequest, setHasExistingRequest] = useState(false);
  const [existingRequestStatus, setExistingRequestStatus] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    display_name: "",
    age: "",
    gender: "male",
    experience: "",
    languages: [] as string[],
    social_media: {
      facebook: "",
      instagram: "",
      snapchat: "",
      whatsapp: "",
    },
  });

  useEffect(() => {
    checkAuthAndExistingRequest();
  }, []);

  const checkAuthAndExistingRequest = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      navigate("/auth");
      return;
    }

    // Check if user is already a checker
    const { data: checker } = await supabase
      .from("checkers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (checker) {
      toast({
        title: "أنت متحقق بالفعل",
        description: "يمكنك الوصول إلى ملفك الشخصي من القائمة الجانبية",
      });
      navigate("/checker-profile");
      return;
    }

    // Check if user has existing request
    const { data: request } = await supabase
      .from("checker_requests")
      .select("status")
      .eq("user_id", user.id)
      .single();

    if (request) {
      setHasExistingRequest(true);
      setExistingRequestStatus(request.status);
    }

    // Load profile data
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, age, gender")
      .eq("user_id", user.id)
      .single();

    if (profile) {
      setFormData((prev) => ({
        ...prev,
        display_name: profile.full_name || "",
        age: profile.age?.toString() || "",
        gender: profile.gender || "male",
      }));
    }

    setLoading(false);
  };

  const toggleLanguage = (lang: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  const updateSocialMedia = (platform: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      social_media: {
        ...prev.social_media,
        [platform]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!formData.display_name.trim()) {
      toast({ title: "الرجاء إدخال الاسم", variant: "destructive" });
      return;
    }
    if (!formData.age || parseInt(formData.age) < 18) {
      toast({ title: "يجب أن يكون العمر 18 سنة أو أكثر", variant: "destructive" });
      return;
    }
    if (formData.languages.length === 0) {
      toast({ title: "الرجاء اختيار لغة واحدة على الأقل", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "يرجى تسجيل الدخول", variant: "destructive" });
      navigate("/auth");
      return;
    }

    const { error } = await supabase.from("checker_requests").insert({
      user_id: user.id,
      display_name: formData.display_name.trim(),
      age: parseInt(formData.age),
      gender: formData.gender,
      experience: formData.experience.trim(),
      languages: formData.languages,
      social_media: formData.social_media,
    });

    setSubmitting(false);

    if (error) {
      toast({
        title: "خطأ في إرسال الطلب",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "تم إرسال طلبك بنجاح",
      description: "سيتم مراجعة طلبك والرد عليك قريباً",
    });
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (hasExistingRequest) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 bg-card/95 backdrop-blur-md z-30 border-b border-border">
          <div className="flex items-center gap-4 px-4 py-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-lg font-bold text-foreground">الترقية إلى متحقق</h1>
          </div>
        </header>

        <div className="p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            {existingRequestStatus === "pending" && "طلبك قيد المراجعة"}
            {existingRequestStatus === "approved" && "تمت الموافقة على طلبك"}
            {existingRequestStatus === "rejected" && "تم رفض طلبك"}
          </h2>
          <p className="text-muted-foreground">
            {existingRequestStatus === "pending" && "سيتم إعلامك عند اتخاذ قرار بشأن طلبك"}
            {existingRequestStatus === "approved" && "يمكنك الآن الوصول إلى ملفك كمتحقق"}
            {existingRequestStatus === "rejected" && "يمكنك التواصل مع الدعم لمزيد من المعلومات"}
          </p>
          <Button
            variant="gradient"
            className="mt-6"
            onClick={() => navigate("/")}
          >
            العودة للرئيسية
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 bg-card/95 backdrop-blur-md z-30 border-b border-border">
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">الترقية إلى متحقق</h1>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Info Banner */}
        <div className="bg-primary/10 rounded-2xl p-4">
          <p className="text-sm text-foreground" dir="rtl">
            انضم إلى فريق المتحققين وابدأ بالعمل معنا. أكمل النموذج أدناه وسيتم مراجعة طلبك من قبل المشرف.
          </p>
        </div>

        {/* Basic Info */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-foreground" dir="rtl">المعلومات الأساسية</h2>

          <div className="space-y-2">
            <Label htmlFor="display_name" className="text-right block">الاسم المعروض</Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="الاسم الذي سيظهر للعملاء"
              className="text-right"
              dir="rtl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age" className="text-right block">العمر</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="العمر"
                min={18}
                className="text-right"
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-right block">الجنس</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.gender === "male" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData({ ...formData, gender: "male" })}
                  className="flex-1"
                >
                  ذكر
                </Button>
                <Button
                  type="button"
                  variant={formData.gender === "female" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData({ ...formData, gender: "female" })}
                  className="flex-1"
                >
                  أنثى
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience" className="text-right block">الخبرة والوصف</Label>
            <Textarea
              id="experience"
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              placeholder="تحدث عن خبرتك وما يميزك..."
              className="text-right min-h-[100px]"
              dir="rtl"
            />
          </div>
        </section>

        {/* Languages */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-foreground" dir="rtl">اللغات</h2>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_LANGUAGES.map((lang) => (
              <Badge
                key={lang}
                variant={formData.languages.includes(lang) ? "default" : "outline"}
                className="cursor-pointer px-4 py-2 text-sm"
                onClick={() => toggleLanguage(lang)}
              >
                {lang}
              </Badge>
            ))}
          </div>
        </section>

        {/* Social Media */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-foreground" dir="rtl">منصات التحقق المتاحة</h2>
          <p className="text-sm text-muted-foreground mb-4" dir="rtl">اختر المنصات التي يمكنك تنفيذ عمليات التحقق من خلالها</p>

          <div className="grid grid-cols-2 gap-3">
            {SOCIAL_PLATFORMS.map((platform) => {
              const Icon = platform.icon;
              const isChecked = !!formData.social_media[platform.key as keyof typeof formData.social_media];

              return (
                <div
                  key={platform.key}
                  onClick={() => {
                    updateSocialMedia(platform.key, isChecked ? "" : "available");
                  }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer select-none",
                    isChecked
                      ? "bg-primary/10 border-primary shadow-sm"
                      : "bg-card border-border hover:border-primary/30"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    isChecked ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={cn(
                    "text-sm font-bold tracking-tight",
                    isChecked ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {platform.label}
                  </span>
                  {isChecked && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Submit Button */}
        <Button
          variant="gradient"
          className="w-full h-14 rounded-2xl text-base font-semibold"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "جاري الإرسال..." : "إرسال الطلب"}
        </Button>
      </div>
    </div>
  );
};

export default BecomeChecker;
