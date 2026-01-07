import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowLeft, Mail, Lock } from "lucide-react";
import SignupSteps from "@/components/auth/SignupSteps";

const ADMIN_EMAIL = "yakoubbakhouche011@gmail.com";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSignupSteps, setShowSignupSteps] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          // Redirect admin to admin page, others to home
          if (session.user.email === ADMIN_EMAIL) {
            navigate("/admin");
          } else {
            navigate("/");
          }
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        if (session.user.email === ADMIN_EMAIL) {
          navigate("/admin");
        } else {
          navigate("/");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error.message === "Invalid login credentials" 
          ? "البريد الإلكتروني أو كلمة المرور غير صحيحة"
          : error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      toast({
        title: "خطأ في إنشاء الحساب",
        description: error.message === "User already registered"
          ? "هذا البريد الإلكتروني مسجل بالفعل"
          : error.message,
        variant: "destructive",
      });
    } else {
      setShowSignupSteps(true);
    }
    setLoading(false);
  };

  if (showSignupSteps) {
    return <SignupSteps email={email} onComplete={() => navigate("/")} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4">
        <button
          onClick={() => navigate("/")}
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="w-10" />
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 pt-8">
        {/* Logo/Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">TrustCheck</h1>
          <p className="text-muted-foreground">
            {isLogin ? "مرحباً بعودتك" : "أنشئ حسابك الجديد"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 bg-secondary rounded-full p-1 mb-8">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold transition-all ${
              isLogin
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground"
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold transition-all ${
              !isLogin
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground"
            }`}
          >
            إنشاء حساب
          </button>
        </div>

        {/* Form */}
        <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="email"
              placeholder="البريد الإلكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-12 pr-4 h-14 rounded-2xl bg-secondary border-0 text-right"
              dir="rtl"
              required
            />
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-4 top-1/2 -translate-y-1/2"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Eye className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-12 pr-12 h-14 rounded-2xl bg-secondary border-0 text-right"
              dir="rtl"
              required
              minLength={6}
            />
          </div>

          {isLogin && (
            <button
              type="button"
              className="text-sm text-primary hover:underline block mr-auto"
            >
              نسيت كلمة المرور؟
            </button>
          )}

          <Button
            type="submit"
            variant="gradient"
            className="w-full h-14 rounded-2xl text-base font-semibold mt-6"
            disabled={loading}
          >
            {loading
              ? "جاري التحميل..."
              : isLogin
              ? "تسجيل الدخول"
              : "إنشاء حساب"}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-border" />
          <span className="text-muted-foreground text-sm">أو</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Social Login */}
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full h-14 rounded-2xl gap-3"
            onClick={() => {
              toast({
                title: "قريباً",
                description: "تسجيل الدخول عبر Google سيكون متاحاً قريباً",
              });
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            المتابعة مع Google
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
