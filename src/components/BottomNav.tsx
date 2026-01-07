import { Search, User, MessageSquare, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";

export interface BottomNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const tabs = [
  { id: "investigator", label: "Investigator", icon: Briefcase, badge: "NEW", path: "/" },
  { id: "checkers", label: "Checkers", icon: Search, hasNotification: true, path: "/" },
  { id: "account", label: "Account", icon: User, path: "/checker-profile" },
  { id: "messages", label: "Messages", icon: MessageSquare, hasNotification: true, path: "/messages" },
];

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentTab = () => {
    if (location.pathname === "/messages" || location.pathname.startsWith("/chat")) return "messages";
    if (location.pathname === "/checker-profile") return "account";
    return activeTab || "checkers";
  };

  const currentTab = getCurrentTab();

  const handleTabClick = (tab: typeof tabs[0]) => {
    if (onTabChange) {
      onTabChange(tab.id);
    }
    if (tab.path && tab.path !== location.pathname) {
      navigate(tab.path);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-bottom z-40">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-4 relative transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <Icon className="w-6 h-6" />
                {tab.badge && (
                  <span className="absolute -top-2 -right-3 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {tab.badge}
                  </span>
                )}
                {tab.hasNotification && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-online rounded-full" />
                )}
              </div>
              <span className={cn(
                "text-xs font-medium",
                isActive && "border-b-2 border-primary pb-0.5"
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
