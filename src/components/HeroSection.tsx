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
        <div className="relative overflow-hidden w-full bg-background pt-8 pb-16 md:pt-16 md:pb-24" dir="rtl">
            {/* Abstract Background Elements */}
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] opacity-60 animate-pulse-slow" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[100px] opacity-60 animate-pulse-slow delay-1000" />

            <div className="container px-4 mx-auto relative z-10">
                <div className="max-w-3xl mx-auto text-center space-y-8">

                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 backdrop-blur-sm border border-border animate-fade-in-up">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">سرية تامة 100%</span>
                    </div>

                    {/* Main Headline */}
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-tight animate-fade-in-up delay-100">
                        اختبر <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">وفاء شريكك</span>
                        <br />
                        بكل ثقة وأمان
                    </h1>

                    {/* Subheadline */}
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
                        منصة "رابط الثقة" تتيح لك التأكد من ولاء شريكك من خلال شبكة من المتحققين المحترفين.
                        خدمة آمنة، سرية، ومريحة لبالك.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
                        <Button
                            size="lg"
                            onClick={scrollToCheckers}
                            className="w-full sm:w-auto text-lg h-14 px-8 rounded-full bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
                        >
                            ابدأ الآن
                            <ArrowLeft className="w-5 h-5 mr-2" />
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full sm:w-auto text-lg h-14 px-8 rounded-full border-2 hover:bg-secondary/50 backdrop-blur-sm"
                        >
                            كيف نعمل؟
                        </Button>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 animate-fade-in-up delay-500">
                        {[
                            {
                                icon: ShieldCheck,
                                title: "سرية مطلقة",
                                desc: "بياناتك وهويتك محمية بالكامل ولن يتم مشاركتها مع أي طرف."
                            },
                            {
                                icon: HeartHandshake,
                                title: "متحققون موثوقون",
                                desc: "فريقنا مختار بعناية لضمان الاحترافية والنتائج الدقيقة."
                            },
                            {
                                icon: Lock,
                                title: "دفع آمن",
                                desc: "نظام دفع محمي يضمن حقك وحق المتحقق في آن واحد."
                            }
                        ].map((feature, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-card/40 backdrop-blur-sm border border-border hover:bg-card/60 transition-colors text-center group">
                                <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                    <feature.icon className="w-7 h-7 text-primary" />
                                </div>
                                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                                <p className="text-sm text-muted-foreground">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
