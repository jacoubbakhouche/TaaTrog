import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Briefcase, User, UserSearch, ChevronDown, FileText, HelpCircle, Bell, LogOut, LogIn, Shield, Settings, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

const ADMIN_EMAIL = "yakoubbakhouche011@gmail.com";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isChecker, setIsChecker] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          checkIfChecker(session.user.id);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkIfChecker(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkIfChecker = async (userId: string) => {
    const { data } = await supabase
      .from("checkers")
      .select("id")
      .eq("user_id", userId)
      .single();
    setIsChecker(!!data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "تم تسجيل الخروج",
      description: "نراك قريباً!",
    });
    onClose();
    navigate("/");
  };

  const isAdmin = user?.email === ADMIN_EMAIL;

  const menuItems = [
    { icon: Briefcase, label: "Missions", action: () => { } },
    { icon: User, label: "Account", action: () => { } },
    { icon: UserSearch, label: "Investigator", badge: "NEW", action: () => { } },
    { icon: ChevronDown, label: "Contact us", isExpandable: true, action: () => { } },
    { icon: FileText, label: "Blog", action: () => { } },
    { icon: HelpCircle, label: "Help Center", action: () => { } },
    { icon: Bell, label: "Get notification", action: () => { } },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-72 bg-sidebar z-50 transform transition-transform duration-300 ease-out flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
          <button
            onClick={() => {
              navigate(user ? "/explore" : "/");
              onClose();
            }}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-sidebar-foreground flex items-center justify-center">
              <span className="text-sidebar font-bold text-lg">T</span>
            </div>
            <span className="text-sidebar-foreground font-bold text-xl">رابط الثقة</span>
          </button>
          <button
            onClick={onClose}
            className="text-sidebar-foreground/80 hover:text-sidebar-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className="px-6 py-4 border-b border-sidebar-border">
            <p className="text-sidebar-foreground text-sm">مرحباً</p>
            <p className="text-sidebar-foreground font-semibold truncate">{user.email}</p>
            {isAdmin && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded mt-1 inline-block">
                مشرف
              </span>
            )}
          </div>
        )}

        {/* Menu Items */}
        <nav className="py-4 flex-1 overflow-y-auto">
          {/* Admin Link */}
          {isAdmin && (
            <button
              onClick={() => {
                navigate("/admin");
                onClose();
              }}
              className="w-full flex items-center gap-4 px-6 py-3.5 text-primary hover:bg-sidebar-accent transition-colors text-left"
            >
              <Shield className="w-5 h-5" />
              <span className="font-medium">لوحة التحكم</span>
            </button>
          )}

          {/* Checker Profile Link */}
          {isChecker && (
            <button
              onClick={() => {
                navigate("/checker-profile");
                onClose();
              }}
              className="w-full flex items-center gap-4 px-6 py-3.5 text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors text-left"
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">ملفي كمتحقق</span>
            </button>
          )}

          {/* Become Checker Link - Only show if user is logged in and NOT a checker */}
          {user && !isChecker && (
            <button
              onClick={() => {
                navigate("/become-checker");
                onClose();
              }}
              className="w-full flex items-center gap-4 px-6 py-3.5 text-primary hover:bg-sidebar-accent transition-colors text-left"
            >
              <UserPlus className="w-5 h-5" />
              <span className="font-medium">الترقية إلى متحقق</span>
              <span className="ml-auto bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded font-bold">
                NEW
              </span>
            </button>
          )}

          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={item.action}
                className="w-full flex items-center gap-4 px-6 py-3.5 text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors text-left"
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {item.badge && (
                    <span className="absolute -top-2 -right-3 bg-destructive text-destructive-foreground text-[9px] font-bold px-1 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="font-medium">{item.label}</span>
                {item.isExpandable && (
                  <ChevronDown className="w-4 h-4 ml-auto" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Auth Button */}
        <div className="p-4 border-t border-sidebar-border">
          {user ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-4 py-3.5 text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">تسجيل الخروج</span>
            </button>
          ) : (
            <button
              onClick={() => {
                navigate("/auth");
                onClose();
              }}
              className="w-full flex items-center gap-4 px-4 py-3.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
            >
              <LogIn className="w-5 h-5" />
              <span className="font-medium">تسجيل الدخول</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
