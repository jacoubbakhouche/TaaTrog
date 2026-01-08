import { useState, useEffect, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookingId: string;
    price: number;
    onPaymentSuccess: () => void;
}

declare global {
    interface Window {
        paypal?: any;
    }
}

export const PaymentModal = ({ isOpen, onClose, bookingId, price, onPaymentSuccess }: PaymentModalProps) => {
    const [uploading, setUploading] = useState(false);
    const [activeTab, setActiveTab] = useState("paypal");
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen && activeTab === "paypal") {
            // Load PayPal SDK for Hosted Buttons
            const scriptId = "paypal-sdk-script";
            if (!document.getElementById(scriptId)) {
                const script = document.createElement("script");
                script.id = scriptId;
                script.src = "https://www.paypal.com/sdk/js?client-id=BAAMwKw9HsGjv5-5DOjUJgs3jcsJGuUFont132S_ZYeReEQnLStdi0br1PIjdV0YnugrebSlDMpQ39mL-g&components=hosted-buttons&disable-funding=venmo&currency=USD";
                script.crossOrigin = "anonymous";
                script.async = true;

                script.onload = () => {
                    if ((window as any).paypal && (window as any).paypal.HostedButtons) {
                        (window as any).paypal.HostedButtons({
                            hostedButtonId: "XE694Q2LNU2BJ",
                        }).render("#paypal-container-XE694Q2LNU2BJ");
                    }
                };

                document.body.appendChild(script);
            } else {
                setTimeout(() => {
                    const container = document.getElementById("paypal-container-XE694Q2LNU2BJ");
                    if (container && container.innerHTML === "") {
                        if ((window as any).paypal && (window as any).paypal.HostedButtons) {
                            (window as any).paypal.HostedButtons({
                                hostedButtonId: "XE694Q2LNU2BJ",
                            }).render("#paypal-container-XE694Q2LNU2BJ");
                        }
                    }
                }, 500);
            }
        }
    }, [isOpen, activeTab]);

    // Placeholder for deleted functions to maintain structure if needed during transition
    const loadPaypalScript = () => { };
    const renderPaypalButton = () => { };


    const handlePaypalSuccess = async (details: any) => {
        try {
            const { error } = await supabase
                .from("conversations")
                .update({
                    status: "paid",
                } as any)
                .eq("id", bookingId);

            if (error) throw error;

            toast.success("تم الدفع بنجاح! جاري فتح المحادثة...");
            onPaymentSuccess();
            onClose();
        } catch (error) {
            console.error("Error updating booking:", error);
            toast.error("فشل في تحديث حالة الدفع");
        }
    };

    const handleManualUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const fileExt = file.name.split(".").pop();
            const fileName = `receipts/${bookingId}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("checker-images") // Using existing bucket for now, ideally 'receipts' bucket
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from("checker-images")
                .getPublicUrl(fileName);

            // Update booking with receipt and status
            const { error } = await supabase
                .from("conversations")
                .update({
                    receipt_url: publicUrl,
                    status: "payment_pending"
                } as any)
                .eq("id", bookingId);

            if (error) throw error;

            toast.success("تم رفع الإيصال. بانتظار مراجعة الإدارة.");
            onClose();
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("فشل في رفع الإيصال");
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader>
                    <DialogTitle>إتمام الدفع</DialogTitle>
                    <DialogDescription>
                        المبلغ المطلوب: <span className="font-bold text-primary text-lg">${price}</span>
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="paypal">PayPal / بطاقة</TabsTrigger>
                        <TabsTrigger value="manual">تحويل يدوي</TabsTrigger>
                    </TabsList>

                    <TabsContent value="paypal" className="space-y-4 py-4">
                        <div id="paypal-container-XE694Q2LNU2BJ" className="min-h-[150px] flex items-center justify-center mb-4 z-10 relative">
                            {/* PayPal Buttons will be rendered here */}
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">أو</span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full py-6 mt-4 border-blue-500 text-blue-600 hover:bg-blue-50"
                            onClick={() => window.open('https://paypal.me/YOUR_LINK_HERE', '_blank')}
                        >
                            دفع مباشر عبر رابط PayPal.Me
                        </Button>

                        <p className="text-xs text-center text-muted-foreground mt-2">
                            دفع آمن ومحمي 100%. يتم تفعيل الخدمة فوراً بعد الدفع.
                        </p>
                    </TabsContent>

                    <TabsContent value="manual" className="space-y-4 py-4">
                        <div className="bg-muted p-6 rounded-xl space-y-4 text-center">
                            <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
                                <Upload className="w-8 h-8 text-primary" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-bold text-lg">إرسال وصل الدفع (BaridiMob / CCP)</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed max-w-[90%] mx-auto">
                                    سيتم فتح محادثة مع المشرف لإرسال صورة الوصل وتفعيل الخدمة.
                                </p>
                            </div>

                            <Button
                                onClick={async () => {
                                    setUploading(true);
                                    try {
                                        const { data: { user } } = await supabase.auth.getUser();
                                        if (!user) {
                                            toast.error("يرجى تسجيل الدخول أولاً");
                                            return;
                                        }

                                        // Find Admin User ID using Secure RPC
                                        // This avoids exposing email columns or complex RLS on user_roles
                                        const { data: adminUserId, error: rpcError } = await supabase.rpc('get_support_admin_id' as any);

                                        if (rpcError || !adminUserId) {
                                            console.error("Could not find admin user ID via RPC", rpcError);
                                            toast.error("تعذر تحديد حساب المشرف. يرجى التأكد من وجود مشرف في النظام.");
                                            setUploading(false);
                                            return;
                                        }

                                        // Find Admin's Checker Profile
                                        const { data: adminChecker, error: checkerError } = await supabase
                                            .from('checkers')
                                            .select('id')
                                            .eq('user_id', adminUserId as string)
                                            .maybeSingle();

                                        if (!adminChecker) {
                                            toast.error("حساب المشرف غير مهيأ لاستلام الرسائل.");
                                            return;
                                        }

                                        // Update Original Booking
                                        await supabase
                                            .from('conversations')
                                            .update({ status: 'payment_pending' } as any)
                                            .eq('id', bookingId);

                                        // Create/Get Support Conversation
                                        const { data: existingConv } = await supabase
                                            .from('conversations')
                                            .select('id')
                                            .eq('user_id', user.id)
                                            .eq('checker_id', adminChecker.id)
                                            .maybeSingle();

                                        let targetConvId = existingConv?.id;

                                        if (!targetConvId) {
                                            const { data: newConv, error: createError } = await supabase
                                                .from('conversations')
                                                .insert({
                                                    user_id: user.id,
                                                    checker_id: adminChecker.id,
                                                    status: 'payment_negotiation', // Special status
                                                    price: 0
                                                } as any)
                                                .select()
                                                .single();

                                            if (createError) throw createError;
                                            targetConvId = newConv.id;

                                            // Send Initial Message AS USER (Avoids RLS "spoofing" error)
                                            // Since user creates the conversation, they should start it.
                                            await supabase.from('messages').insert({
                                                conversation_id: targetConvId,
                                                sender_id: user.id, // User sends message
                                                content: "السلام عليكم، أرغب في إتمام الدفع عن طريق BaridiMob / CCP. أرجو تزويدي بالمعلومات."
                                            });
                                        }

                                        toast.success("جاري نقلك إلى المحادثة...");
                                        onPaymentSuccess();
                                        navigate(`/chat/${targetConvId}`);
                                        onClose();

                                    } catch (e) {
                                        console.error("Error starting admin chat:", e);
                                        toast.error("حدث خطأ غير متوقع.");
                                    } finally {
                                        setUploading(false);
                                    }
                                }}
                                disabled={uploading}
                                className="w-full h-14 text-lg bg-primary hover:bg-primary/90 rounded-full shadow-lg hover:shadow-primary/20 transition-all font-bold"
                            >
                                {uploading ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                                ) : (
                                    "بدء المحادثة وإرسال الوصل"
                                )}
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog >
    );
};

