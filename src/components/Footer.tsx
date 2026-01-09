import { Shield, Globe, Star, Users } from "lucide-react";

export const Footer = () => {
    return (
        <footer className="pt-32 pb-12 px-6 border-t border-border mt-auto bg-background" dir="rtl">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 text-right">
                <div className="md:col-span-2 space-y-6">
                    <div className="flex items-center gap-3 justify-start md:justify-start">
                        <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-3xl font-black tracking-tighter text-gradient">TaaTrog</span>
                    </div>
                    <p className="text-muted-foreground font-medium max-w-md ml-auto md:ml-0 leading-relaxed text-right">
                        المنصة العالمية الرائدة في مجال التحقق الرقمي وخدمات الثقة. نحن نؤمن بأن الحقيقة هي حق للجميع، ونعمل يومياً لتمكينكم من الوصول إليها بأعلى درجات الخصوصية.
                    </p>
                    <div className="flex items-center gap-4 justify-start">
                        {[Globe, Shield, Star, Users].map((Icon, i) => (
                            <div key={i} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all cursor-pointer">
                                <Icon className="w-5 h-5" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6 text-right">
                    <h4 className="text-lg font-black text-foreground">المنصة</h4>
                    <ul className="space-y-4 text-muted-foreground font-bold">
                        <li className="hover:text-primary transition-colors cursor-pointer">المتحققون</li>
                        <li className="hover:text-primary transition-colors cursor-pointer">كيف نعمل</li>
                        <li className="hover:text-primary transition-colors cursor-pointer">الحماية والخصوصية</li>
                        <li className="hover:text-primary transition-colors cursor-pointer">الأسعار</li>
                    </ul>
                </div>

                <div className="space-y-6 text-right">
                    <h4 className="text-lg font-black text-foreground">الدعم</h4>
                    <ul className="space-y-4 text-muted-foreground font-bold">
                        <li className="hover:text-primary transition-colors cursor-pointer">مركز المساعدة</li>
                        <li className="hover:text-primary transition-colors cursor-pointer">تواصل معنا</li>
                        <li className="hover:text-primary transition-colors cursor-pointer">شروط الخدمة</li>
                        <li className="hover:text-primary transition-colors cursor-pointer">سياسة الاسترجاع</li>
                    </ul>
                </div>
            </div>

            <div className="max-w-7xl mx-auto pt-12 mt-20 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6">
                <p className="text-sm text-muted-foreground font-bold order-2 md:order-1">
                    © 2024 رابط الثقة. جميع الحقوق محفوظة. صُمم بكل ❤️ في الوطن العربي.
                </p>
                <div className="flex gap-6 text-sm text-muted-foreground font-bold order-1 md:order-2">
                    <span className="hover:text-foreground cursor-pointer transition-colors">سياسة الخصوصية</span>
                    <span className="hover:text-foreground cursor-pointer transition-colors">اتفاقية المستخدم</span>
                    <span className="hover:text-foreground cursor-pointer transition-colors">ملفات تعريف الارتباط</span>
                </div>
            </div>
        </footer>
    );
};
