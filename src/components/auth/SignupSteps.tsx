import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SignupStepsProps {
  email: string;
  onComplete: () => void;
}

const SignupSteps = ({ email, onComplete }: SignupStepsProps) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Form data
  const [username, setUsername] = useState("");
  const [gender, setGender] = useState<string>("");
  const [birthdate, setBirthdate] = useState("");
  const [referralSource, setReferralSource] = useState("");

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

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleComplete = async () => {
    // Validate age
    if (birthdate) {
      const age = calculateAge(birthdate);
      if (age < 18) {
        toast({
          title: "غير مسموح",
          description: "يجب أن يكون عمرك 18 سنة أو أكثر",
          variant: "destructive",
        });
        return;
      }
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

    const age = birthdate ? calculateAge(birthdate) : null;

    const { error } = await supabase
      .from("profiles")
      .update({
        username,
        gender,
        birthdate: birthdate || null,
        age,
        referral_source: referralSource || null,
      })
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل في حفظ البيانات",
        variant: "destructive",
      });
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
        return birthdate !== "" && referralSource !== "";
      default:
        return false;
    }
  };

  const referralOptions = [
    { value: "tiktok", label: "TikTok" },
    { value: "instagram", label: "Instagram" },
    { value: "youtube", label: "YouTube" },
    { value: "facebook", label: "Facebook" },
    { value: "google", label: "Google" },
    { value: "press", label: "Press" },
    { value: "ai", label: "AI" },
    { value: "word_of_mouth", label: "Word-of-mouth" },
    { value: "other", label: "Other" },
  ];

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
          className={`w-10 h-10 rounded-full bg-secondary flex items-center justify-center ${
            step === 1 ? "opacity-50" : ""
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
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                className="h-12 border-0 border-b-2 border-primary/50 rounded-none bg-transparent focus:border-primary px-0 text-base"
              />
            </div>

            {/* Gender Selection */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Gender
              </label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="h-12 rounded-xl bg-secondary border-0">
                  <SelectValue placeholder="Select Your Gender" />
                </SelectTrigger>
                <SelectContent>
                  {genderOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 2: Birthdate & Referral Source */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-bold text-primary mb-2 text-center">
              Just one last step before we start!
            </h2>
            <p className="text-muted-foreground mb-8 text-center text-sm">
              Last two questions before accessing Loyalty Tests
            </p>

            {/* Birthdate */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-foreground mb-1 block">
                Your birthdate*
              </label>
              <span className="text-xs text-muted-foreground mb-2 block">
                (must be 18+)
              </span>
              <div className="relative">
                <Input
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  className="h-12 border-0 border-b-2 border-primary/50 rounded-none bg-transparent focus:border-primary px-0 text-base"
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Referral Source */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-foreground mb-2 block">
                How did you know about Lazo?
              </label>
              <Select value={referralSource} onValueChange={setReferralSource}>
                <SelectTrigger className="h-12 rounded-xl bg-secondary border-0">
                  <SelectValue placeholder="Select An Option" />
                </SelectTrigger>
                <SelectContent>
                  {referralOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
