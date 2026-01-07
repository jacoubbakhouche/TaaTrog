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

          {/* Tabs */}
          <div className="flex items-center gap-2 bg-secondary rounded-full p-1">
            <Button
              variant="ghost"
              className="rounded-full px-4 py-2 h-auto text-sm font-semibold bg-card shadow-sm"
            >
              Loyalty Test
            </Button>
            <Button
              variant="ghost"
              className="rounded-full px-4 py-2 h-auto text-sm font-medium text-muted-foreground"
            >
              P.I.
              <span className="ml-1 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded font-bold">
                NEW
              </span>
            </Button>
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

      {/* Checkers Grid */}
      <main className="px-4 py-4">
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
