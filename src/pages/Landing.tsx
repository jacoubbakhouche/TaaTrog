import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck, HeartHandshake, Lock, Play } from "lucide-react"; // Added Play icon
import { supabase } from "@/integrations/supabase/client";
import { Footer } from "@/components/Footer";

// Dummy video data for carousel
const TIKTOK_VIDEOS = [
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=700&fit=crop", // Couple 1
    "https://images.unsplash.com/photo-1621600411688-4be93cd68504?w=400&h=700&fit=crop", // Couple 2
    "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=700&fit=crop", // Couple 3
    "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=400&h=700&fit=crop", // Couple 4
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=700&fit=crop", // Portrait
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=700&fit=crop", // Portrait
];

const Landing = () => {
    const navigate = useNavigate();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                navigate("/explore");
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                navigate("/explore");
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    return (
        <div className="relative overflow-hidden w-full bg-background min-h-screen flex flex-col pt-8 pb-16 md:pt-16 md:pb-32" dir="rtl">
            {/* 3D Animated Mesh Gradient Background */}
            <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-purple-600/30 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob"></div>
                <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-primary/30 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[-20%] left-[20%] w-[70vw] h-[70vw] bg-pink-600/30 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-4000"></div>
            </div>

            <div className="container px-4 mx-auto relative z-10 flex-grow flex flex-col justify-center">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">

                    {/* Right Column: Text Content */}
                    <div className="text-right space-y-8 animate-fade-in-right z-20">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            <span className="text-sm font-bold text-foreground tracking-wide">المنصة الأولى لكشف الحقيقة</span>
                        </div>

                        {/* Main Headline */}
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1] drop-shadow-sm">
                            اكتشفي <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-pink-500 animate-gradient-x">الحقيقة</span>
                            <br />
                            خلف الشكوك
                        </h1>

                        {/* Subheadline */}
                        <p className="text-lg md:text-2xl text-muted-foreground/90 max-w-xl leading-relaxed font-light">
                            هل تشعرك تصرفاته بالقلق؟ استخدمي "رابط الثقة" للتأكد بذكاء وسرية تامة. نحن هنا لنمنحك اليقين الذي تستحقينه.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-start gap-5 pt-4">
                            <Button
                                size="lg"
                                onClick={() => navigate("/auth")}
                                className="w-full sm:w-auto text-xl h-16 px-12 rounded-full bg-primary hover:bg-primary/90 transition-all hover:scale-105 shadow-[0_0_30px_-10px_rgba(236,72,153,0.6)] border-0"
                            >
                                ابدأي التحقق الآن
                                <ArrowLeft className="w-6 h-6 mr-3" />
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => navigate("/become-checker")}
                                className="w-full sm:w-auto text-lg h-16 px-10 rounded-full border-2 border-primary/20 hover:border-primary/50 hover:bg-white/5 backdrop-blur-sm transition-all"
                            >
                                انضمي كمتحققة
                            </Button>
                        </div>
                    </div>

                    {/* Left Column: Visual Mockup (Couple Image) */}
                    <div className="relative animate-fade-in-left mt-12 lg:mt-0 perspective-1000 group">
                        {/* Decorative floating elements */}
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl" />

                        {/* Main Image with 3D Tilt Effect */}
                        <div className="relative z-10 w-full max-w-md mx-auto transform transition-transform duration-500 group-hover:rotate-y-6 group-hover:rotate-x-6">
                            <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border-[10px] border-white/20 backdrop-blur-md">
                                <img
                                    src="https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=2459&auto=format&fit=crop"
                                    alt="Couple in Love"
                                    className="w-full h-[600px] object-cover hover:scale-110 transition-transform duration-700"
                                />
                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                                {/* Floating Card inside image */}
                                <div className="absolute bottom-8 left-8 right-8 bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/20 shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-inner">
                                            <ShieldCheck className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-lg">نتائج مضمونة</p>
                                            <p className="text-white/70 text-sm">سرية تامة 100%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TikTok Style Carousel Section */}
                <div className="w-full py-12 overflow-hidden">
                    <h2 className="text-3xl font-bold text-center mb-10">من تجارب مستخدمينا</h2>

                    {/* Marquee Container */}
                    <div className="flex gap-6 animate-marquee hover:pause whitespace-nowrap">
                        {[...TIKTOK_VIDEOS, ...TIKTOK_VIDEOS].map((video, idx) => (
                            <div
                                key={idx}
                                className="inline-block w-[200px] md:w-[250px] aspect-[9/16] rounded-3xl overflow-hidden relative shadow-xl border-4 border-white/10 cursor-pointer hover:scale-105 transition-transform group shrink-0"
                            >
                                <img src={video} alt="Story" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/50">
                                        <Play className="w-5 h-5 text-white fill-current" />
                                    </div>
                                </div>
                                <div className="absolute bottom-4 right-4 flex gap-2">
                                    <div className="px-2 py-1 bg-black/50 backdrop-blur-md rounded-full text-white text-xs font-medium">
                                        @user_{100 + idx}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16">
                    {[
                        {
                            icon: ShieldCheck,
                            title: "خصوصية تامة",
                            desc: "نحافظ على سرية هويتك ومحادثاتك بأعلى معايير التشفير."
                        },
                        {
                            icon: HeartHandshake,
                            title: "مصداقية عالية",
                            desc: "نضمن لك نتائج حقيقية وموثقة من خلال شبكة متحققين محترفين."
                        },
                        {
                            icon: Lock,
                            title: "دفع آمن",
                            desc: "لا يتم تسليم المبلغ للمتحقق إلا بعد إتمام المهمة بنجاح."
                        }
                    ].map((feature, i) => (
                        <div key={i} className="p-8 rounded-[2rem] bg-white/5 backdrop-blur-lg border border-white/10 hover:bg-white/10 transition-all hover:-translate-y-2 group">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
                                <feature.icon className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Landing;
