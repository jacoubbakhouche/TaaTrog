import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, Search, CheckCircle, Lock, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminActivation = () => {
    const [searchId, setSearchId] = useState("");
    const [conversation, setConversation] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleSearch = async () => {
        if (!searchId.trim()) return;
        setLoading(true);
        setConversation(null);

        try {
            // Clean ID (remove hash or extra chars if pasted)
            const cleanId = searchId.replace('#', '').trim();

            const { data, error } = await supabase
                .from('conversations')
                .select('*, profiles(full_name)')
                .eq('id', cleanId)
                .maybeSingle();

            if (error) throw error;
            if (!data) {
                toast({ title: "غير موجود", description: "لم يتم العثور على محادثة بهذا الرقم", variant: "destructive" });
            } else {
                setConversation(data);
            }
        } catch (e) {
            console.error(e);
            toast({ title: "خطأ", description: "حدث خطأ أثناء البحث", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async () => {
        if (!conversation) return;
        try {
            const { error } = await supabase
                .from('conversations')
                .update({ status: 'approved' } as any) // Set to approved (Unlock)
                .eq('id', conversation.id);

            if (error) throw error;

            toast({ title: "تم التفعيل بنجاح! 🎉", description: "تم فتح القفل للعميل." });
            setConversation({ ...conversation, status: 'approved' }); // Optimistic update
        } catch (e) {
            console.error(e);
            toast({ title: "خطأ", description: "فشل التفعيل", variant: "destructive" });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-8 flex flex-col items-center">

            <div className="w-full max-w-md space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-4">
                        <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">تفعيل المحادثات</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">أدخل رقم المحادثة (ID) لتفعيل الخدمة للعميل</p>
                </div>

                {/* Search Box */}
                <Card className="border-none shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-base text-right">بحث عن محادثة</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Paste Conversation ID here..."
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                className="font-mono text-sm"
                            />
                            <Button onClick={handleSearch} disabled={loading}>
                                <Search className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Result Card */}
                {conversation && (
                    <Card className={`border-2 shadow-xl animate-in slide-in-from-bottom-4 duration-500 ${conversation.status === 'approved' || conversation.status === 'paid' ? 'border-green-500/50 bg-green-50/50' : 'border-orange-200'}`}>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-500" />
                                    {conversation.profiles?.full_name || "مستخدم"}
                                </CardTitle>
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${conversation.status === 'paid' ? 'bg-green-100 text-green-700' :
                                        conversation.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                                            'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {conversation.status}
                                </span>
                            </div>
                            <CardDescription className="text-xs font-mono truncate">
                                ID: {conversation.id}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-3">
                                {['approved', 'paid'].includes(conversation.status) ? (
                                    <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-300">
                                        <CheckCircle className="w-5 h-5" />
                                        <span className="font-bold text-sm">المحادثة مفعلة بالفعل</span>
                                    </div>
                                ) : (
                                    <div className="bg-orange-50 dark:bg-orange-900/10 p-3 rounded-lg flex items-center gap-2 text-orange-700 dark:text-orange-300">
                                        <Lock className="w-5 h-5" />
                                        <span className="text-sm">المحادثة مقفلة (بانتظار الدفع)</span>
                                    </div>
                                )}

                                {!['paid', 'approved'].includes(conversation.status) && (
                                    <Button
                                        onClick={handleActivate}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 text-lg shadow-lg shadow-green-500/20 mt-2"
                                    >
                                        تفعيل الآن 🔓
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default AdminActivation;
