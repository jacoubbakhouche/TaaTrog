import { useState, useEffect, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload } from "lucide-react";

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
                        <div className="bg-muted p-4 rounded-lg space-y-2 text-sm text-right">
                            <p className="text-muted-foreground mb-4">
                                عند اختيار الدفع اليدوي، سيتم فتح محادثة تلقائية مع المشرف (Admin) لتزويدك بتفاصيل الحساب وإتمام العملية.
                            </p>
                            <Button
                                onClick={async () => {
                                    try {
                                        setUploading(true);

                                        // 1. Find Admin User via user_roles (more reliable)
                                        const { data: adminRole, error: roleError } = await supabase
                                            .from('user_roles')
                                            .select('user_id')
                                            .eq('role', 'admin')
                                            .maybeSingle();

                                        let adminUserId = adminRole?.user_id;

                                        // Fallback: Check profiles if user_roles empty
                                        if (!adminUserId) {
                                            const { data: adminProfile } = await supabase
                                                .from('profiles')
                                                .select('user_id')
                                                .eq('role', 'admin')
                                                .maybeSingle();
                                            adminUserId = adminProfile?.user_id;
                                        }

                                        if (!adminUserId) {
                                            console.error("No admin found");
                                            toast.error("لم يتم العثور على مشرف متاح حالياً.");
                                            setUploading(false);
                                            return;
                                        }

                                        // 2. Get current user
                                        const { data: { user } } = await supabase.auth.getUser();
                                        if (!user) return;

                                        // 3. Update original booking status to 'payment_pending' so it appears in Admin Dashboard
                                        if (bookingId) {
                                            const { error: updateError } = await supabase
                                                .from('conversations')
                                                .update({ status: 'payment_pending' } as any)
                                                .eq('id', bookingId);

                                            if (updateError) {
                                                console.error("Error updating booking status:", updateError);
                                                // Continue anyway to open chat
                                            }
                                        }

                                        // 4. Find Admin's Checker Profile
                                        // We need the admin to have a 'checker' profile to attach the chat to.
                                        const { data: adminChecker } = await supabase
                                            .from('checkers')
                                            .select('id')
                                            .eq('user_id', adminUserId)
                                            .maybeSingle();

                                        let targetCheckerId = adminChecker?.id;

                                        if (!targetCheckerId) {
                                            // If Admin has no checker profile, we can't standardly create a chat in this schema.
                                            // We'll alert the user.
                                            toast.error("حساب المشرف غير مفعل لاستلام المحادثات. يرجى الانتظار.");
                                            // Ideally, we'd create a checker profile for the admin here or use a 'support' system.
                                            setUploading(false);
                                            return;
                                        }

                                        const { data: existingConv } = await supabase
                                            .from('conversations')
                                            .select('id')
                                            .eq('user_id', user.id)
                                            .eq('checker_id', targetCheckerId)
                                            .maybeSingle();

                                        let conversationId = existingConv?.id;

                                        if (!conversationId) {
                                            const { data: newConv, error: createError } = await supabase
                                                .from('conversations')
                                                .insert({
                                                    user_id: user.id,
                                                    client_id: user.id, // Ensure this column exists via migration
                                                    checker_id: targetCheckerId,
                                                    status: 'payment_pending',
                                                    price: 0
                                                })
                                                .select()
                                                .single();

                                            if (createError) throw createError;
                                            conversationId = newConv.id;
                                        }

                                        // 4. Navigate
                                        toast.success("جاري فتح المحادثة مع المشرف...");
                                        onClose();
                                        onPaymentSuccess();
                                        navigate(`/chat/${conversationId}`);
                                    } catch (e) {
                                        console.error("Chat error:", e);
                                        toast.error("فشل في بدء المحادثة");
                                    } finally {
                                        setUploading(false);
                                    }
                                }}
                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-6 rounded-xl"
                                disabled={uploading}
                            >
                                {uploading ? "جاري الاتصال..." : "تواصل مع المشرف لإتمام الدفع"}
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};
