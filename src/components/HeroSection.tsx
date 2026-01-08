import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck, HeartHandshake, Lock } from "lucide-react";

export const HeroSection = () => {
    const scrollToCheckers = () => {
        const checkersSection = document.getElementById("checkers-list");
        if (checkersSection) {
            checkersSection.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <div className="relative overflow-hidden w-full bg-background pt-8 pb-16 md:pt-16 md:pb-32" dir="rtl">
            {/* Abstract Background Elements */}
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] opacity-60 animate-pulse-slow" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[100px] opacity-60 animate-pulse-slow delay-1000" />

            <div className="container px-4 mx-auto relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* Right Column: Text Content */}
                    <div className="text-right space-y-8 animate-fade-in-right">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 backdrop-blur-sm border border-border">
                            <ShieldCheck className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-foreground">سرية تامة 100% منصة موثوقة</span>
                        </div>

                        {/* Main Headline */}
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.2]">
                            اختبر <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">وفاء شريكك</span>
                            <br />
                            بكل ثقة وأمان
                        </h1>

                        {/* Subheadline */}
                        <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
                            منصة "رابط الثقة" هي رفيقك الأمثل للجزم باليقين. نقدم لك شبكة من المحترفين للتحقق بذكاء، سرية، واحترافية مطلقة.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-start gap-4">
                            <Button
                                size="lg"
                                onClick={scrollToCheckers}
                                className="w-full sm:w-auto text-lg h-14 px-10 rounded-full bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-all hover:scale-105 shadow-xl shadow-primary/25"
                            >
                                ابدأ الآن
                                <ArrowLeft className="w-5 h-5 mr-3" />
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full sm:w-auto text-lg h-14 px-10 rounded-full border-2 hover:bg-secondary/50 backdrop-blur-sm transition-all"
                            >
                                اكتشف كيف نعمل
                            </Button>
                        </div>

                        {/* Mini Features List */}
                        <div className="flex flex-wrap gap-6 pt-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                <span className="text-sm font-medium">سرية مطلقة</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-purple-500" />
                                <span className="text-sm font-medium">متحققون نخبة</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                <span className="text-sm font-medium">ضمان مالي</span>
                            </div>
                        </div>
                    </div>

                    {/* Left Column: Visual Mockup */}
                    <div className="relative animate-fade-in-left mt-12 lg:mt-0">
                        {/* Floating Glass Cards */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 animate-float z-20 hidden xl:block" />
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/10 backdrop-blur-md rounded-full border border-primary/20 animate-float-slow z-0 hidden xl:block" />

                        {/* Main Image Container */}
                        <div className="relative z-10 rounded-[2.5rem] overflow-hidden border-8 border-white/10 shadow-2xl skew-y-[-2deg] hover:skew-y-0 transition-all duration-700">
                            <img
                                src="/landing-hero.png"
                                alt="App Mockup"
                                className="w-full h-auto object-cover"
                            />
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent pointer-events-none" />
                        </div>

                        {/* Trust Badges Floating */}
                        <div className="absolute top-1/2 -left-8 -translate-y-1/2 bg-card/80 backdrop-blur-xl p-4 rounded-2xl border border-border shadow-2xl animate-bounce-slow z-20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <ShieldCheck className="w-6 h-6 text-green-500" />
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">حماية البيانات</p>
                                    <p className="text-sm font-bold leading-none">مؤمنة بالكامل</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vertical Features Section below on small screens, or grid on large */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-24">
                    {[
                        {
                            icon: ShieldCheck,
                            title: "خصوصية تامة",
                            desc: "نحن نقدر خصوصيتك فوق كل شيء. محادثاتك وهويتك ستبقى طي الكتمان."
                        },
                        {
                            icon: HeartHandshake,
                            title: "فريق موثوق",
                            desc: "يتم اختيار المختبرين بعناية فائقة لضمان أعلى مستويات الأمان والجودة."
                        },
                        {
                            icon: Lock,
                            title: "نظام الضمان",
                            desc: "أموالك في أمان. لا يتم تحويل المبلغ للمختبر إلا بعد استلامك للنتائج."
                        }
                    ].map((feature, i) => (
                        <div key={i} className="p-8 rounded-3xl bg-card/40 backdrop-blur-sm border border-border hover:bg-card/60 transition-all hover:-translate-y-2 group">
                            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                                <feature.icon className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
