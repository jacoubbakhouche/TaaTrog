import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Menu, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import CheckerCard from "@/components/CheckerCard";
import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";
import FilterSheet from "@/components/FilterSheet";
import CheckerDetail from "@/components/CheckerDetail";
import { HeroSection } from "@/components/HeroSection";
import { supabase } from "@/integrations/supabase/client";
import { DbChecker } from "@/types/checker";

const Index = () => {
  const [activeTab, setActiveTab] = useState("checkers");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedChecker, setSelectedChecker] = useState<DbChecker | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Fetch checkers with caching
  const { data: checkers = [], isLoading: loading } = useQuery({
    queryKey: ["checkers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checkers")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          title: "خطأ",
          description: "فشل تحميل قائمة المتحققين",
          variant: "destructive",
        });
        throw error;
      }

      return data as DbChecker[];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Realtime subscription for online status updates
  useEffect(() => {
    const channel = supabase
      .channel('public:checkers')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'checkers' },
        (payload) => {
          // Invalidate query to refetch updated data
          // queryClient.invalidateQueries({ queryKey: ["checkers"] });
          // Note: For smoother updates, we might want to manually update cache here,
          // but invalidation is safer for consistency.
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCheckerClick = (checker: DbChecker) => {
    setSelectedChecker(checker);
    setDetailOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-card/95 backdrop-blur-md z-30 border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center hover:bg-accent transition-colors"
          >
            <Menu className="w-6 h-6 text-foreground" />
          </button>

          {/* Logo / Brand Name */}
          <div className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            رابط الثقة
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setFilterOpen(true)}
            className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center hover:bg-accent transition-colors"
          >
            <SlidersHorizontal className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection />

      {/* Checkers Grid */}
      <main className="px-4 py-8" id="checkers-list">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground" dir="rtl">اختر المتحقق المناسب</h2>
          <Button variant="ghost" className="text-primary hover:text-primary/80">
            عرض الكل
          </Button>
        </div>
        {checkers.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            لا يوجد متحققون متاحون حالياً
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {checkers.map((checker) => (
              <CheckerCard
                key={checker.id}
                checker={checker}
                onClick={() => handleCheckerClick(checker)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Filter Sheet */}
      <FilterSheet
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        onConfirm={(filters) => {
          console.log("Applied filters:", filters);
          setFilterOpen(false);
        }}
      />

      {/* Checker Detail */}
      <CheckerDetail
        checker={selectedChecker}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
};

export default Index;
