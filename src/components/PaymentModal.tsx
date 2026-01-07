import { useState, useEffect, ChangeEvent } from "react";
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

    useEffect(() => {
        if (isOpen && activeTab === "paypal") {
            loadPaypalScript();
        }
    }, [isOpen, activeTab]);

    const loadPaypalScript = () => {
        if (window.paypal) {
            renderPaypalButton();
            return;
        }

        const script = document.createElement("script");
        script.src = "https://www.paypal.com/sdk/js?client-id=BAAMwKw9HsGjv5-5DOjUJgs3jcsJGuUFont132S_ZYeReEQnLStdi0br1PIjdV0YnugrebSlDMpQ39mL-g&components=hosted-buttons&disable-funding=venmo&currency=USD";
        script.async = true;
        script.crossOrigin = "anonymous";
        script.onload = () => renderPaypalButton();
        document.body.appendChild(script);
    };

    const renderPaypalButton = () => {
        const container = document.getElementById("paypal-button-container");
        if (!container || container.innerHTML.length > 0) return;

        try {
            if (window.paypal && window.paypal.Buttons) {
                window.paypal.Buttons({
                    createOrder: (data: any, actions: any) => {
                        return actions.order.create({
                            purchase_units: [{
                                amount: {
                                    value: price.toString()
                                }
                            }]
                        });
                    },
                    onApprove: async (data: any, actions: any) => {
                        // Capture the funds from the transaction
                        const details = await actions.order.capture();
                        console.log("Transaction completed by " + details.payer.name.given_name);

                        // Mark booking as paid in Supabase
                        await handlePaypalSuccess(details);
                    },
                    onError: (err: any) => {
                        console.error("PayPal Error:", err);
                        toast.error("حدث خطأ في عملية الدفع عبر PayPal");
                    }
                }).render("#paypal-button-container");
            }
        } catch (e) {
            console.error("Error rendering paypal button", e);
        }
    };

    const handlePaypalSuccess = async (details: any) => {
        try {
            const { error } = await supabase
                .from("bookings")
                .update({
                    status: "paid",
                    // Optionally store paypal transaction ID if we add a field for it
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
                .from("bookings")
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
                        <div id="paypal-button-container" className="min-h-[150px] flex items-center justify-center">
                            {/* PayPal Buttons will be rendered here */}
                        </div>
                        <p className="text-xs text-center text-muted-foreground">
                            دفع آمن ومحمي 100%. يتم تفعيل الخدمة فوراً بعد الدفع.
                        </p>
                    </TabsContent>

                    <TabsContent value="manual" className="space-y-4 py-4">
                        <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                            <div className="font-semibold">بيانات التحويل (CCP / Bank):</div>
                            <div className="flex justify-between">
                                <span>Account Name:</span>
                                <span className="font-mono">TaaTROG Admin</span>
                            </div>
                            <div className="flex justify-between">
                                <span>CCP Number:</span>
                                <span className="font-mono selectable">12345678 keys 99</span>
                            </div>
                            <div className="flex justify-between">
                                <span>BaridiMob:</span>
                                <span className="font-mono selectable">007999991234567890</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>رفع صورة الإيصال</Label>
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">اضغط لرفع الصورة</p>
                                </div>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleManualUpload}
                                    disabled={uploading}
                                />
                            </label>
                            {uploading && <p className="text-sm text-center text-primary animate-pulse">جاري الرفع...</p>}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};
