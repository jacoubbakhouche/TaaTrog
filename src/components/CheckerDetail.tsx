import { Star, Trophy, User, X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { DbChecker } from "@/types/checker";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PaymentModal } from "./PaymentModal";

interface CheckerDetailProps {
  checker: DbChecker | null;
  isOpen: boolean;
  onClose: () => void;
}

const CheckerDetail = ({ checker, isOpen, onClose }: CheckerDetailProps) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [api, setApi] = useState<CarouselApi>();
  const [loading, setLoading] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  useEffect(() => {
    if (!api) {
      return;
    }

    api.on("select", () => {
      setCurrentImage(api.selectedScrollSnap());
    });
  }, [api]);
  const navigate = useNavigate();
  // const { toast } = useToast(); // Removed to avoid conflict with sonner toast


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

  const [booking, setBooking] = useState<{ id: string; status: string } | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);

  // Check for existing booking
  useEffect(() => {
    const checkBooking = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !checker) return;

      const { data } = await supabase
        .from("bookings")
        .select("id, status")
        .eq("client_id", user.id)
        .eq("checker_id", checker.id)
        .maybeSingle();

      if (data) {
        setBooking(data);
      }
    };

    if (isOpen && checker) {
      checkBooking();
    }
  }, [isOpen, checker]);

  if (!checker) return null;

  // Get social media platforms that have values
  const socialPlatforms = checker.social_media
    ? Object.entries(checker.social_media).filter(([_, value]) => value)
    : [];

  const handlePaymentSuccess = () => {
    // Payment successful, maybe refresh or navigate
    toast.success("تم الدفع بنجاح", { description: "جاري فتح المحادثة..." });
    // TODO: Navigate to chat
    // For now, assume chat creation logic will be here or handled
  };

  const handleRequestTest = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      navigate("/auth");
      setLoading(false);
      return;
    }

    // If approved, proceed to payment
    if (booking?.status === 'approved') {
      setPaymentOpen(true);
      setLoading(false);
      return;
    }

    // If pending, do nothing (should be disabled)
    if (booking?.status === 'pending_approval') return;

    // Create new booking
    const { data: newBooking, error } = await supabase
      .from("bookings")
      .insert({
        client_id: user.id,
        checker_id: checker.id,
        status: "pending_approval",
        price: checker.price || 0
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      toast.error("فشل إنشاء الطلب", { description: "حدث خطأ غير متوقع" });
    } else {
      setBooking({ id: newBooking.id, status: newBooking.status });
      toast.success("تم إرسال الطلب", { description: "بانتظار موافقة المتحقق" });
    }
    setLoading(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] md:h-[90vh] p-0 rounded-t-3xl overflow-hidden">
        {/* Image Carousel */}
        <div className="relative h-[25%] md:h-[45%] bg-muted">
          {allImages.length > 0 ? (
            <Carousel className="w-full h-full" setApi={setApi}>
              <CarouselContent className="h-full ml-0">
                {allImages.map((src, index) => (
                  <CarouselItem key={index} className="pl-0 h-full">
                    <img
                      src={src}
                      alt={`${checker.display_name} - ${index + 1}`}
                      className="w-full h-full object-cover cursor-zoom-in"
                      loading="eager"
                      onClick={() => setFullscreenImage(src)}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              {allImages.length > 1 && (
                <>
                  <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 border-white/20 text-white hover:bg-black/70 hover:text-white" />
                  <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 border-white/20 text-white hover:bg-black/70 hover:text-white" />
                </>
              )}
            </Carousel>
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center">
              <User className="w-24 h-24 text-muted-foreground" />
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 hover:bg-black/70 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Dots Indicator */}
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {allImages.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    i === currentImage ? "bg-white" : "bg-white/50"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto h-[75%] md:h-[55%]">
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
            disabled={loading || booking?.status === 'pending_approval' || booking?.status === 'rejected'}
            className={cn(
              "w-full py-6 text-lg font-semibold rounded-2xl shadow-button transition-all",
              booking?.status === 'approved'
                ? "bg-green-600 hover:bg-green-700 text-white"
                : booking?.status === 'rejected'
                  ? "bg-destructive/80 text-white cursor-not-allowed"
                  : "bg-gradient-primary"
            )}
          >
            {loading ? "جاري التحميل..." :
              booking?.status === 'pending_approval' ? "الطلب قيد الانتظار" :
                booking?.status === 'approved' ? "متابعة للدفع (مقبول)" :
                  booking?.status === 'rejected' ? "تم رفض الطلب" :
                    "طلب اختبار الولاء"}
          </Button>
        </div>
      </SheetContent>

      {booking && (
        <PaymentModal
          isOpen={paymentOpen}
          onClose={() => setPaymentOpen(false)}
          bookingId={booking.id}
          price={checker.price || 0}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Fullscreen Image Viewer */}
      <Dialog open={!!fullscreenImage} onOpenChange={() => setFullscreenImage(null)}>
        <DialogContent className="max-w-[95vw] h-fit p-0 bg-transparent border-none">
          {fullscreenImage && (
            <div className="relative flex items-center justify-center p-0">
              <img
                src={fullscreenImage}
                alt="Fullscreen"
                className="w-full h-auto max-h-[85vh] object-contain rounded-lg shadow-2xl"
              />
              <button
                onClick={() => setFullscreenImage(null)}
                className="absolute -top-12 right-0 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 hover:bg-black/70 transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Sheet>
  );
};

export default CheckerDetail;
