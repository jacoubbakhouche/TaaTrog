import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, User, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SignupStepsProps {
  email: string;
  initialName?: string;
  onComplete: () => void;
}

const SignupSteps = ({ email, initialName = "", onComplete }: SignupStepsProps) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Form data
  const [username, setUsername] = useState(initialName);
  const [gender, setGender] = useState<string>("");
  const [age, setAge] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const totalSteps = 2;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };



  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
    } catch (error: any) {
      toast({
        title: "Error uploading avatar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleComplete = async () => {
    // Validate age
    const ageVal = parseInt(age);
    if (!age || isNaN(ageVal) || ageVal < 18) {
      toast({
        title: "خطأ",
        description: "يجب أن يكون العمر 18 أو أكبر",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: "خطأ",
        description: "الرجاء تسجيل الدخول مرة أخرى",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        username,
        gender,
        age: ageVal,
        avatar_url: avatarUrl,
        // Sync full_name as well for consistency
        full_name: username
      })
      .eq("user_id", user.id);

    if (error) {
      console.error("Profile update error:", error);
      if (error.code === "23505") {
        toast({
          title: "اسم المستخدم مستخدم بالفعل",
          description: "الرجاء اختيار اسم مستخدم آخر",
          variant: "destructive",
        });
      } else {
        toast({
          title: "خطأ",
          description: "فشل في حفظ البيانات: " + error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "تم بنجاح!",
        description: "تم إنشاء حسابك بنجاح",
      });
      onComplete();
    }
    setLoading(false);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return username.length >= 3 && gender !== "";
      case 2:
        return age !== "" && parseInt(age) >= 18;
      default:
        return false;
    }
  };



  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
    { value: "prefer_not_to_say", label: "Prefer not to say" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4">
        <button
          onClick={handleBack}
          className={`w-10 h-10 rounded-full bg-secondary flex items-center justify-center ${step === 1 ? "opacity-50" : ""
            }`}
          disabled={step === 1}
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="text-sm text-muted-foreground">
          {step} / {totalSteps}
        </div>
        <div className="w-10" />
      </header>

      {/* Progress Bar */}
      <div className="px-6 mb-8">
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6">
        {/* Step 1: Username & Gender */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-bold text-primary mb-2 text-center">
              Your privacy matters
            </h2>
            <p className="text-muted-foreground mb-8 text-center text-sm">
              Please enter your username and gender. This information is used solely to personalize your experience and will be kept private.
            </p>

            {/* Username */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Username
              </label>
              <Input
                type="text"
                placeholder="Type your username here"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 border-0 border-b-2 border-primary/50 rounded-none bg-transparent focus:border-primary px-0 text-base"
              />
            </div>

            {/* Gender Selection */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Gender
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setGender("male")}
                  className={`h-12 rounded-xl border flex items-center justify-center gap-2 transition-all ${gender === "male"
                    ? "bg-primary text-white border-primary"
                    : "bg-secondary border-transparent hover:bg-secondary/80"
                    }`}
                >
                  Male
                </button>
                <button
                  onClick={() => setGender("female")}
                  className={`h-12 rounded-xl border flex items-center justify-center gap-2 transition-all ${gender === "female"
                    ? "bg-primary text-white border-primary"
                    : "bg-secondary border-transparent hover:bg-secondary/80"
                    }`}
                >
                  Female
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Age & Avatar */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-bold text-primary mb-2 text-center">
              Last details
            </h2>
            <p className="text-muted-foreground mb-8 text-center text-sm">
              Please provide your age and a profile picture.
            </p>

            {/* Age */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-foreground mb-1 block">
                Your Age*
              </label>
              <span className="text-xs text-muted-foreground mb-2 block">
                (must be 18+)
              </span>
              <Input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 24"
                className="h-12 border-0 border-b-2 border-primary/50 rounded-none bg-transparent focus:border-primary px-0 text-base"
                min={18}
              />
            </div>

            {/* Avatar Upload */}
            <div className="mb-6 flex flex-col items-center">
              <label className="text-sm font-semibold text-foreground mb-4 block self-start">
                Profile Photo
              </label>
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-secondary border-2 border-border relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                  <label
                    htmlFor="avatar-upload"
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Plus className="w-8 h-8 text-white" />
                  </label>
                </div>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={uploadAvatar}
                  disabled={uploading}
                />
              </div>
              {uploading && <p className="text-xs text-muted-foreground mt-2">Uploading...</p>}
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Button */}
        <div className="py-6">
          <Button
            variant="gradient"
            className="w-full h-14 rounded-full text-base font-semibold gap-2"
            onClick={step === totalSteps ? handleComplete : handleNext}
            disabled={!canProceed() || loading}
          >
            {loading ? (
              "جاري الحفظ..."
            ) : step === totalSteps ? (
              <>
                <Check className="w-5 h-5" />
                Continue
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SignupSteps;
