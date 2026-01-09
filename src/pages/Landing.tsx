import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence, PanInfo } from "framer-motion";

// Assets
const HERO_3D = "/hero-couple.png";
const FEATURES_3D = "/hero-woman.png";
const AVATARS_3D = "/hero-group.png";

const Landing = () => {
    const navigate = useNavigate();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                navigate("/explore");
            }
        });
    }, [navigate]);

    const screens = [
        {
            id: 0,
            img: HERO_3D,
            title: "اكتشفي الحقيقة",
            subtitle: "بكل سهولة",
            desc: "توصلي مع محترفين للتحقق من ولاء شريكك بسرية تامة.",
            color: "text-purple-400"
        },
        {
            id: 1,
            img: FEATURES_3D,
            title: "تحكم كامل",
            subtitle: "في العملية",
            desc: "تابعي حالة طلبك لحظة بلحظة، واحصلي على أدلة موثقة.",
            color: "text-pink-400"
        },
        {
            id: 2,
            img: AVATARS_3D,
            title: "انضمي إلينا",
            subtitle: "مجتمع الثقة",
            desc: "أكثر من 10,000+ مستخدمة يثقون بنا. ابدأي رحلتك اليوم.",
            color: "text-blue-400"
        }
    ];

    const nextScreen = () => {
        if (currentIndex < screens.length - 1) {
            setDirection(1);
            setCurrentIndex(prev => prev + 1);
        } else {
            navigate('/auth');
        }
    };

    const handleDragEnd = (event: any, info: PanInfo) => {
        if (info.offset.x < -100 && currentIndex < screens.length - 1) { // Swipe Left (RTL Next)
            nextScreen();
        }
    };

    return (
        <div className="min-h-screen w-full bg-black font-['Outfit',_sans-serif] overflow-hidden relative flex flex-col" dir="rtl">

            {/* Header / Skip */}
            <div className="absolute top-0 right-0 left-0 p-6 z-50 flex justify-between items-center">
                <div className="text-xl font-bold text-white tracking-widest">رابط الثقة</div>
                {currentIndex < 2 && (
                    <button onClick={() => navigate('/auth')} className="text-white/60 hover:text-white transition-colors text-sm font-medium">
                        تخطي
                    </button>
                )}
            </div>

            {/* 3D Card Stack Container */}
            <div className="flex-1 relative flex items-center justify-center pt-10">
                <AnimatePresence custom={direction} mode="popLayout">
                    {screens.slice(currentIndex).map((screen, index) => {
                        const isFirst = index === 0;
                        const actualIndex = currentIndex + index;

                        // Stack styling
                        const yOffset = index * 15; // Vertical stack offset
                        const scale = 1 - (index * 0.05); // Scale down items behind
                        const opacity = 1 - (index * 0.3); // Fade items behind
                        const zIndex = screens.length - index;

                        if (index > 2) return null; // Only show next 2 cards

                        return (
                            <motion.div
                                key={screen.id}
                                layout
                                initial={{ x: 300, opacity: 0, rotate: 10 }}
                                animate={{
                                    x: 0,
                                    y: yOffset,
                                    scale: scale,
                                    opacity: opacity,
                                    rotate: index % 2 === 0 ? 0 : -2, // Subtle distinct rotation
                                    zIndex: zIndex
                                }}
                                exit={{ x: -500, opacity: 0, rotate: -20, transition: { duration: 0.4 } }}
                                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                                drag={isFirst ? "x" : false}
                                dragConstraints={{ left: 0, right: 0 }}
                                onDragEnd={handleDragEnd}
                                className={`absolute top-[15%] w-[85%] h-[60vh] rounded-[2.5rem] overflow-hidden shadow-2xl ${isFirst ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                style={{ transformOrigin: "bottom center" }}
                            >
                                <div className="absolute inset-0 bg-gray-900 border border-white/10">
                                    <img src={screen.img} alt="" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />

                                    {/* Text Content inside Card (Bottom) */}
                                    <div className="absolute bottom-0 left-0 right-0 p-8 pb-10 text-center">
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-2">
                                                {screen.title}
                                            </h2>
                                            <h3 className={`text-3xl md:text-4xl font-extrabold ${screen.color} mb-4`}>
                                                {screen.subtitle}
                                            </h3>
                                            <p className="text-white/70 text-lg font-medium leading-relaxed max-w-xs mx-auto">
                                                {screen.desc}
                                            </p>
                                        </motion.div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Bottom Controls */}
            <div className="h-32 px-8 flex flex-col justify-center w-full z-50">
                {currentIndex === 2 ? (
                    <div className="grid grid-cols-2 gap-4 w-full animate-in slide-in-from-bottom-5 fade-in duration-500">
                        <Button
                            onClick={() => navigate('/become-checker')}
                            variant="outline"
                            className="h-14 rounded-full border-white/20 text-white hover:bg-white/10 bg-transparent text-lg font-bold"
                        >
                            انضمي كمتحققة
                        </Button>
                        <Button
                            onClick={() => navigate('/auth')}
                            className="h-14 rounded-full bg-white text-black hover:bg-white/90 text-lg font-bold shadow-lg shadow-white/10"
                        >
                            ابدأي الآن
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between w-full">
                        {/* Dots */}
                        <div className="flex gap-2.5">
                            {screens.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-2.5 rounded-full transition-all duration-500 ease-out ${idx === currentIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/20'
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Floating Action Button */}
                        <Button
                            onClick={nextScreen}
                            size="icon"
                            className="w-16 h-16 rounded-full bg-white text-black hover:bg-white/90 shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-transform hover:scale-105"
                        >
                            <ArrowLeft className="w-7 h-7" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Background Ambient Glow */}
            <div className="absolute top-1/4 -right-20 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 -left-20 w-60 h-60 bg-blue-600/20 rounded-full blur-[80px] pointer-events-none" />

        </div>
    );
};

export default Landing;
