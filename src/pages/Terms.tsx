import { ArrowRight, Shield, ScrollText, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Terms = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background font-['Outfit',_sans-serif]" dir="rtl">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
                <div className="container px-4 h-16 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="rounded-full hover:bg-secondary"
                    >
                        <ArrowRight className="w-5 h-5" />
                    </Button>
                    <h1 className="text-xl font-bold">الشروط والأحكام</h1>
                    <div className="w-10" /> {/* Spacer */}
                </div>
            </header>

            <main className="container px-4 py-8 max-w-3xl mx-auto space-y-8">

                {/* Intro Card */}
                <div className="bg-secondary/30 p-6 rounded-3xl border border-secondary">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <ScrollText className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">اتفاقية الاستخدام</h2>
                            <p className="text-sm text-muted-foreground">آخر تحديث: 2024/01/01</p>
                        </div>
                    </div>
                    <p className="text-foreground/80 leading-relaxed">
                        مرحباً بك في منصة TaaTrog. استخدامك للمنصة يعني موافقتك الكاملة على هذه الشروط. تهدف هذه الاتفاقية لضمان حقوق الجميع وتوفير بيئة آمنة للمصداقية.
                    </p>
                </div>

                {/* Sections */}
                <div className="space-y-6">

                    <section>
                        <h3 className="flex items-center gap-2 text-lg font-bold mb-3 text-primary">
                            <Shield className="w-5 h-5" />
                            1. الخصوصية والسرية
                        </h3>
                        <div className="bg-card p-5 rounded-2xl shadow-sm border border-border">
                            <ul className="space-y-3 list-disc list-inside text-foreground/80 text-sm leading-7 mark">
                                <li>نحن نلتزم بحماية بياناتك الشخصية ومحادثاتك بأعلى معايير التشفير.</li>
                                <li>يمنع منعاً باتاً مشاركة أي معلومات أو نتائج حصلت عليها من المتحققين خارج المنصة لأغراض التشهير.</li>
                                <li>هوية "المتحقق" وهوية "العميل" محمية ولا يتم كشفها لأطراف ثالثة.</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h3 className="flex items-center gap-2 text-lg font-bold mb-3 text-primary">
                            <Lock className="w-5 h-5" />
                            2. استخدام الخدمة
                        </h3>
                        <div className="bg-card p-5 rounded-2xl shadow-sm border border-border">
                            <ul className="space-y-3 list-disc list-inside text-foreground/80 text-sm leading-7">
                                <li>يجب أن يكون عمرك 18 عاماً أو أكثر لاستخدام المنصة.</li>
                                <li>يمنع استخدام المنصة لأي أغراض غير قانونية أو للابتزاز أو المضايقة.</li>
                                <li>نحتفظ بحق حظر أي حساب ينتهك هذه القوانين فوراً ودون سابق إنذار.</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h3 className="flex items-center gap-2 text-lg font-bold mb-3 text-primary">
                            <AlertCircle className="w-5 h-5" />
                            3. المدفوعات والاسترجاع
                        </h3>
                        <div className="bg-card p-5 rounded-2xl shadow-sm border border-border">
                            <ul className="space-y-3 list-disc list-inside text-foreground/80 text-sm leading-7">
                                <li>المبالغ المدفوعة تظل معلقة حتى اكتمال الخدمة.</li>
                                <li>في حال لم يقم المتحقق بتنفيذ الطلب، يتم استرجاع المبلغ بالكامل لمحفظتك.</li>
                                <li>لا يمكن استرجاع المبلغ بعد بدء المتحقق في العمل الفعلي وتقديم الأدلة.</li>
                            </ul>
                        </div>
                    </section>

                </div>

                {/* Footer Note */}
                <div className="text-center pt-8 pb-12 text-muted-foreground text-sm">
                    <p>للاستفسارات، يرجى التواصل مع فريق الدعم.</p>
                </div>

            </main>
        </div>
    );
};

export default Terms;
