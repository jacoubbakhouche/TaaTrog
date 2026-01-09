import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    checkerId: string;
    onSuccess?: () => void;
}

export function ReviewModal({ isOpen, onClose, checkerId, onSuccess }: ReviewModalProps) {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error("الرجاء اختيار التقييم (عدد النجوم)");
            return;
        }

        setSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from("reviews")
                .insert({
                    checker_id: checkerId,
                    client_id: user.id,
                    rating,
                    review_text: comment,
                });

            if (error) throw error;

            toast.success("تم إرسال تقييمك بنجاح! شكراً لك.");
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error("Error submitting review:", error);
            toast.error("حدث خطأ أثناء إرسال التقييم");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl">تقييم الخدمة</DialogTitle>
                    <DialogDescription className="text-center">
                        شاركنا تجربتك مع هذا المتحقق. رأيك يهمنا!
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center py-6 space-y-6">
                    {/* Star Rating */}
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className="transition-transform hover:scale-110 focus:outline-none"
                                onMouseEnter={() => setHoveredRating(star)}
                                onMouseLeave={() => setHoveredRating(0)}
                                onClick={() => setRating(star)}
                            >
                                <Star
                                    className={cn(
                                        "w-10 h-10 transition-colors duration-200",
                                        (hoveredRating ? star <= hoveredRating : star <= rating)
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-muted-foreground/30"
                                    )}
                                />
                            </button>
                        ))}
                    </div>
                    <p className="text-sm font-medium text-muted-foreground h-5">
                        {hoveredRating || rating ? (
                            {
                                1: "سيء جداً 😠",
                                2: "سيء 😕",
                                3: "مقبول 😐",
                                4: "جيد 🙂",
                                5: "ممتاز 🤩"
                            }[hoveredRating || rating]
                        ) : "اختر عدداً للنجوم"}
                    </p>

                    <Textarea
                        placeholder="اكتب تعليقك هنا (اختياري)..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full min-h-[100px] resize-none"
                    />
                </div>

                <DialogFooter className="sm:justify-center gap-2">
                    <Button variant="outline" onClick={onClose} disabled={submitting}>
                        إلغاء
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting || rating === 0} className="w-full sm:w-auto">
                        {submitting ? "جاري الإرسال..." : "إرسال التقييم"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
