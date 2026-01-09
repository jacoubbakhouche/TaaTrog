import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Menu, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import CheckerCard from "@/components/CheckerCard";
import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";
import FilterSheet from "@/components/FilterSheet";
import CheckerDetail from "@/components/CheckerDetail";
import { supabase } from "@/integrations/supabase/client";
import { DbChecker } from "@/types/checker";


// Add FilterState interface locally or import it if exported (it's not exported in FilterSheet, so I'll redefine or export it there)
// But to keep it simple and safe without touching FilterSheet yet, I'll copy the shape.
interface FilterState {
  gender: string[];
  ageRange: [number, number];
  socialMedia: string[];
  languages: string[];
}

const Index = () => {
  const [activeTab, setActiveTab] = useState("checkers");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedChecker, setSelectedChecker] = useState<DbChecker | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [filters, setFilters] = useState<FilterState>({
    gender: [],
    ageRange: [18, 50],
    socialMedia: [],
    languages: [],
  });

  // ... existing useEffects and query ...


  // Realtime subscription for online status updates is now below...

  // Filtering Logic happens here, BUT we need `checkers` first.
  // The issue is `checkers` is defined later in the file (migrated from below).
  // Wait, in previous file `checkers` was defined at line 43.
  // In my failed edit, I pasted logic referring to `checkers` BEFORE `useQuery` defined it?
  // Let's reorder.

  // 1. Fetch checkers
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
    staleTime: 1000 * 30, // Cache for 30 seconds
  });

  // 2. Filtering Logic
  const filteredCheckers = checkers.filter(checker => {
    // 1. Gender Filter
    if (filters.gender.length > 0) {
      const checkerGender = checker.gender?.toLowerCase();
      const selectedGenders = filters.gender.map(g => g.toLowerCase());
      if (!checkerGender || !selectedGenders.includes(checkerGender)) return false;
    }

    // 2. Age Filter
    const age = checker.age || 0;
    if (age < filters.ageRange[0] || age > filters.ageRange[1]) return false;

    // 3. Social Media Filter
    if (filters.socialMedia.length > 0) {
      const checkerSocials = checker.social_media ? Object.keys(checker.social_media).filter(k => checker.social_media[k]) : [];
      const hasSelectedSocial = filters.socialMedia.some(media => checkerSocials.includes(media));
      if (!hasSelectedSocial) return false;
    }

    // 4. Language Filter
    if (filters.languages.length > 0) {
      const checkerLanguages = (checker.languages || []).map(l => l.toLowerCase());
      const selectedLanguages = filters.languages.map(l => l.toLowerCase());
      const speaksSelected = selectedLanguages.some(lang => checkerLanguages.includes(lang));
      if (!speaksSelected) return false;
    }

    return true;
  });

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
      <div className="min-h-screen bg-background pb-24">
        {/* Header Skeleton */}
        <header className="sticky top-0 bg-card/95 backdrop-blur-md z-30 border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">رابط الثقة</div>
            <Skeleton className="w-12 h-12 rounded-full" />
          </div>
        </header>

        <main className="px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-8 w-20" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="relative rounded-2xl overflow-hidden bg-card shadow-card aspect-[3/4]">
                <Skeleton className="w-full h-full" />

                {/* Info Overlay Skeleton */}
                <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2 z-10">
                  <Skeleton className="h-5 w-1/2 bg-white/20" />
                  <Skeleton className="h-3 w-1/4 bg-white/20" />
                </div>

                {/* Tests Badge Skeleton */}
                <div className="absolute bottom-3 right-3">
                  <Skeleton className="h-6 w-16 rounded-full bg-white/20" />
                </div>
              </div>
            ))}
          </div>
        </main>
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


      <main className="px-4 py-8" id="checkers-list">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground" dir="rtl">اختر المتحقق المناسب</h2>
          <Button variant="ghost" className="text-primary hover:text-primary/80">
            عرض الكل
          </Button>
        </div>
        {filteredCheckers.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            لا يوجد متحققون يطابقون خيارات البحث
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredCheckers.map((checker) => (
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
        onConfirm={(newFilters) => {
          setFilters(newFilters);
          setFilterOpen(false);
          toast({
            description: "تم تطبيق الفلاتر بنجاح"
          });
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
