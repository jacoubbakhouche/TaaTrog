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
      <SheetContent side="bottom" className="h-[88vh] md:h-[90vh] p-0 rounded-t-[2.5rem] overflow-hidden flex flex-col border-t-0 shadow-2xl">
        {/* Image Carousel - Premium Thumbnail View */}
        <div className="relative h-40 md:h-[45%] bg-muted flex-shrink-0 group">
          {allImages.length > 0 ? (
            <Carousel className="w-full h-full" setApi={setApi}>
              <CarouselContent className="h-full ml-0">
                {allImages.map((src, index) => (
                  <CarouselItem key={index} className="pl-0 h-full">
                    <div className="relative w-full h-full bg-black/5">
                      <img
                        src={src}
                        alt={`${checker.display_name} - ${index + 1}`}
                        className="w-full h-full object-contain cursor-zoom-in transition-transform duration-500 hover:scale-105"
                        loading="eager"
                        onClick={() => setFullscreenImage(src)}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {allImages.length > 1 && (
                <>
                  <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100" />
                  <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100" />
                </>
              )}
            </Carousel>
          ) : (
            <div className="w-full h-full bg-secondary/30 flex items-center justify-center">
              <User className="w-24 h-24 text-muted-foreground/30" />
            </div>
          )}

          {/* Premium Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

          {/* Close Button - Stylish */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-50 w-10 h-10 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center border border-white/30 hover:bg-white/40 hover:scale-110 active:scale-95 transition-all shadow-lg"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Dots Indicator - Modern */}
          {allImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              {allImages.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-300",
                    i === currentImage ? "bg-white w-4" : "bg-white/40"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content Area - Premium Spacing & Typography */}
        <div className="p-6 overflow-y-auto flex-1 bg-background relative -mt-4 rounded-t-3xl z-20 shadow-[0_-8px_30px_rgb(0,0,0,0.05)]">
          {/* Main Info Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 to-purple-500/10 p-0.5 border border-primary/20 shadow-sm">
                <div className="w-full h-full rounded-[0.9rem] overflow-hidden">
                  {checker.avatar_url ? (
                    <img src={checker.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-secondary flex items-center justify-center">
                      <User className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                    {checker.display_name}
                  </h2>
                  <span className="text-lg font-medium text-muted-foreground">, {checker.age || "?"} عام</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/5 px-2.5 py-1 rounded-full w-fit">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  متصل الآن
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="block text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
                ${checker.price || 0}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">لكل اختبار</span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-secondary/40 backdrop-blur-sm p-4 rounded-3xl border border-border/50 flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">معدل النجاح</p>
                <p className="font-bold text-sm">عالي جداً</p>
              </div>
            </div>
            <div className="bg-secondary/40 backdrop-blur-sm p-4 rounded-3xl border border-border/50 flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/10 rounded-2xl flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600 fill-yellow-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">التقييم العام</p>
                <p className="font-bold text-sm">{checker.rating || 0} ({checker.reviews_count || 0})</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Social Channels Section */}
            {socialPlatforms.length > 0 && (
              <div>
                <h3 className="text-xs font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-3">قنوات الاختبار المتاحة</h3>
                <div className="flex flex-wrap gap-3">
                  {socialPlatforms.map(([platform]) => (
                    <div key={platform} className="flex items-center gap-2 bg-card border border-border px-4 py-2.5 rounded-2xl shadow-sm hover:border-primary/30 transition-colors">
                      <span className="text-lg">
                        {platform === "instagram" && "📷"}
                        {platform === "facebook" && "📘"}
                        {platform === "snapchat" && "👻"}
                        {platform === "whatsapp" && "💬"}
                        {platform === "tiktok" && "🎵"}
                      </span>
                      <span className="text-xs font-bold capitalize">{platform}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Languages Section - Refined */}
            {checker.languages && checker.languages.length > 0 && (
              <div>
                <h3 className="text-xs font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-3">اللغات المتقنة</h3>
                <div className="flex flex-wrap gap-2">
                  {checker.languages.map((lang) => (
                    <span
                      key={lang}
                      className="px-4 py-2 bg-secondary/50 text-secondary-foreground rounded-2xl text-xs font-black border border-border/50 hover:border-primary/20 transition-colors"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section - Premium Card */}
            <div className="bg-secondary/30 rounded-[2rem] p-5 border border-border/40">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  <span className="text-lg font-black">{checker.rating || 0}</span>
                  <span className="text-muted-foreground text-sm font-bold">({checker.reviews_count || 0} مراجعة)</span>
                </div>
                <button className="text-primary text-xs font-black hover:underline tracking-tight">عرض الكل ←</button>
              </div>
              <div className="bg-background/60 backdrop-blur-sm p-4 rounded-2xl border border-border/30 relative">
                <p className="text-foreground text-sm font-medium leading-relaxed italic relative z-10">
                  "تعامل احترافي جداً ونتائج دقيقة وسريعة. أنصح بالتعامل معه بشدة!"
                </p>
                <div className="absolute top-2 right-2 text-4xl text-primary/5 font-serif select-none">"</div>
              </div>
            </div>

            {/* Description Section - Clean */}
            {checker.description && (
              <div className="px-1">
                <h3 className="text-xs font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-3">تفاصيل إضافية</h3>
                <p className="text-foreground/80 text-sm leading-relaxed font-semibold">
                  {checker.description}
                </p>
              </div>
            )}

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent w-full" />

            {/* CTA Button Section - High Impact */}
            <div className="pt-2 pb-6">
              <Button
                onClick={handleRequestTest}
                disabled={loading || booking?.status === 'pending_approval' || booking?.status === 'rejected'}
                className={cn(
                  "w-full py-8 text-xl font-black rounded-3xl shadow-[0_20px_40px_-12px_rgba(var(--primary),0.25)] transition-all transform active:scale-[0.98] group",
                  booking?.status === 'approved'
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : booking?.status === 'rejected'
                      ? "bg-destructive/80 text-white cursor-not-allowed"
                      : "bg-gradient-primary hover:shadow-[0_25px_50px_-12px_rgba(var(--primary),0.35)]"
                )}
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>جاري الطلب...</span>
                  </div>
                ) :
                  booking?.status === 'pending_approval' ? "الطلب قيد المراجعة" :
                    booking?.status === 'approved' ? "إتمام عملية الدفع والبدء" :
                      booking?.status === 'rejected' ? "للأسف، تم رفض طلبك" :
                        (
                          <div className="flex items-center justify-center gap-3">
                            <span>طلب اختبار وفاء</span>
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-[-4px] transition-transform">
                              <Star className="w-4 h-4 fill-white" />
                            </div>
                          </div>
                        )}
              </Button>
              <p className="text-[10px] text-center text-muted-foreground mt-4 font-bold uppercase tracking-widest opacity-60">
                ضمان استرداد الأموال 100% في حال عدم الرضا
              </p>
            </div>
          </div>
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
