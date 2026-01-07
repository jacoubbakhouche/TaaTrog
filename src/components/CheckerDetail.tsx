import { ChevronLeft, ChevronRight, Star, Trophy, User } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { DbChecker } from "@/types/checker";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CheckerDetailProps {
  checker: DbChecker | null;
  isOpen: boolean;
  onClose: () => void;
}

const CheckerDetail = ({ checker, isOpen, onClose }: CheckerDetailProps) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Build images array: avatar first, then gallery
  const allImages = useMemo(() => {
    if (!checker) return [];
    return [
      checker.avatar_url,
      ...((checker as any).gallery_images || [])
    ].filter(Boolean) as string[];
  }, [checker]);

  // Reset current image when checker changes
  useEffect(() => {
    setCurrentImage(0);
  }, [checker?.id]);

  if (!checker) return null;

  // Get social media platforms that have values
  const socialPlatforms = checker.social_media 
    ? Object.entries(checker.social_media).filter(([_, value]) => value)
    : [];

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleRequestTest = async () => {
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "يجب تسجيل الدخول أولاً", variant: "destructive" });
      navigate("/auth");
      setLoading(false);
      return;
    }

    // Check if conversation already exists
    const { data: existingConv } = await supabase
      .from("conversations")
      .select("id")
      .eq("user_id", user.id)
      .eq("checker_id", checker.id)
      .single();

    if (existingConv) {
      navigate(`/chat/${existingConv.id}`);
      onClose();
      setLoading(false);
      return;
    }

    // Create new conversation
    const { data: newConv, error } = await supabase
      .from("conversations")
      .insert({
        user_id: user.id,
        checker_id: checker.id,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "حدث خطأ", description: "فشل إنشاء المحادثة", variant: "destructive" });
      setLoading(false);
      return;
    }

    navigate(`/chat/${newConv.id}`);
    onClose();
    setLoading(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[95vh] p-0 rounded-t-3xl overflow-hidden">
        {/* Image Carousel */}
        <div className="relative h-[45%] bg-muted">
          {allImages.length > 0 ? (
            <img
              src={allImages[currentImage] || allImages[0]}
              alt={checker.display_name}
              className="w-full h-full object-cover"
              loading="eager"
            />
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center">
              <User className="w-24 h-24 text-muted-foreground" />
            </div>
          )}
          
          {/* Navigation Arrows */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-card/80 rounded-full flex items-center justify-center shadow-card"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-card/80 rounded-full flex items-center justify-center shadow-card"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          
          {/* Back Button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-10 h-10 bg-card rounded-full flex items-center justify-center shadow-card"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Dots Indicator */}
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {allImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImage(i)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    i === currentImage ? "bg-card" : "bg-card/50"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto h-[55%]">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary">
                {checker.avatar_url ? (
                  <img src={checker.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {checker.display_name}, {checker.age || "?"} y/o
                </h2>
              </div>
            </div>
            <span className="text-2xl font-bold text-primary">${checker.price || 0}</span>
          </div>

          {/* Top Fold Rate */}
          <div className="flex items-center gap-3 py-3 border-y border-border mb-4">
            <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Top Fold Rate</p>
              <p className="text-sm text-muted-foreground">Few can resist this loyalty tester's charm!</p>
            </div>
          </div>

          {/* Social Media - Test via */}
          {socialPlatforms.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Test via</p>
              <div className="flex gap-2">
                {socialPlatforms.map(([platform]) => (
                  <span key={platform} className="text-xl">
                    {platform === "instagram" && "📷"}
                    {platform === "facebook" && "📘"}
                    {platform === "snapchat" && "👻"}
                    {platform === "whatsapp" && "💬"}
                    {platform === "tiktok" && "🎵"}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {checker.languages && checker.languages.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Languages</p>
              <div className="flex flex-wrap gap-2">
                {checker.languages.map((lang) => (
                  <span
                    key={lang}
                    className="px-3 py-1.5 bg-secondary rounded-full text-sm font-medium text-secondary-foreground"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Reviews</span>
                <span className="text-primary font-bold">{checker.rating || 0}</span>
                <Star className="w-4 h-4 fill-primary text-primary" />
                <span className="text-muted-foreground text-sm">| {checker.reviews_count || 0} reviews</span>
              </div>
              <button className="text-primary text-sm font-medium">See more →</button>
            </div>
            <p className="text-muted-foreground text-sm mt-2 italic">
              "{checker.display_name} was wonderful and helpful!"
            </p>
          </div>

          {/* Description */}
          {checker.description && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {checker.description}
              </p>
            </div>
          )}

          {/* CTA Button */}
          <Button 
            onClick={handleRequestTest}
            disabled={loading}
            className="w-full py-6 bg-gradient-primary shadow-button text-lg font-semibold rounded-2xl"
          >
            {loading ? "جاري التحميل..." : "Request a Loyalty Test"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CheckerDetail;
