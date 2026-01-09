import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Clock } from "lucide-react"; // Removed generic imports
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

// Assets
const HERO_3D = "/hero-couple.png";
const FEATURES_3D = "/hero-woman.png";
const AVATARS_3D = "/hero-group.png";

const Landing = () => {
    const navigate = useNavigate();
    const [currentScreen, setCurrentScreen] = useState(0);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                navigate("/explore");
            }
        });
    }, [navigate]);

    const nextScreen = () => {
        if (currentScreen < 2) setCurrentScreen(prev => prev + 1);
        else navigate('/auth');
    };

    const skip = () => navigate('/auth');

    // Variants for slide animation (Clean Fade/Slide)
    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? '100%' : '-100%',
            opacity: 0,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? '100%' : '-100%',
            opacity: 0,
        })
    };

    // Text Content Data
    const screens = [
        {
            id: 0,
            img: HERO_3D,
            title: <>اكتشفي <span className="text-purple-400">الحقيقة</span><br />بكل سهولة</>,
            desc: "توصلي مع محترفين (Checkers) للتحقق من ولاء شريكك بسرية تامة وأمان.",
            bg: "bg-black" // Fallback color
        },
        {
            id: 1,
            img: FEATURES_3D,
            title: <>تحكم كامل <br /><span className="text-pink-400">في العملية</span></>,
            desc: "تابعي حالة طلبك لحظة بلحظة، واحصلي على أدلة موثقة (صور ومحادثات).",
            bg: "bg-black"
        },
        {
            id: 2,
            img: AVATARS_3D,
            title: <>انضمي لمجتمعنا</>,
            desc: "أكثر من 10,000+ مستخدمة يثقون بنا. ابدأي رحلتك نحو راحة البال اليوم.",
            bg: "bg-black"
        }
    ];

    return (
        <div className="min-h-screen w-full bg-black font-['Outfit',_sans-serif] overflow-hidden relative" dir="rtl">

            <AnimatePresence initial={false} custom={currentScreen}>
                <motion.div
                    key={currentScreen}
                    custom={currentScreen}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="absolute inset-0 w-full h-full"
                >
                    {/* Background Image Container - FULL SCREEN */}
                    <div className="absolute inset-0 w-full h-full">
                        {/* Image */}
                        <img
                            src={screens[currentScreen].img}
                            alt={`Screen ${currentScreen}`}
                            className="w-full h-full object-cover object-center"
                        />

                        {/* Gradient Overlay for Text Readability - Heavily faded at black */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-90" />
                    </div>

                    {/* Content Overlay */}
                    <div className="absolute inset-0 flex flex-col justify-end pb-32 px-8 z-10">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-center space-y-4 max-w-lg mx-auto"
                        >
                            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight drop-shadow-lg">
                                {screens[currentScreen].title}
                            </h1>
                            <p className="text-gray-300 text-lg md:text-xl font-light leading-relaxed">
                                {screens[currentScreen].desc}
                            </p>

                            {/* CTA on Last Screen */}
                            {currentScreen === 2 && (
                                <div className="pt-6 w-full flex flex-col gap-3">
                                    <Button
                                        onClick={() => navigate('/auth')}
                                        className="w-full h-14 bg-white text-black hover:bg-white/90 rounded-full text-lg font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-transform hover:scale-105"
                                    >
                                        ابدأي الآن
                                    </Button>
                                    <Button
                                        onClick={() => navigate('/become-checker')}
                                        variant="outline"
                                        className="w-full h-14 border-white/30 text-white hover:bg-white/10 rounded-full text-lg bg-transparent"
                                    >
                                        انضمي كمتحققة
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* --- Sticky Bottom Navigation (Dots & Next) --- */}
            <div className="absolute bottom-0 left-0 right-0 p-8 pt-0 z-20 flex items-end justify-between">

                {/* Dots Indicator */}
                <div className="flex gap-2 mb-4">
                    {[0, 1, 2].map((idx) => (
                        <div
                            key={idx}
                            className={`h-2 rounded-full transition-all duration-300 ${idx === currentScreen ? 'w-8 bg-purple-500' : 'w-2 bg-gray-500/50'
                                }`}
                        />
                    ))}
                </div>

                {/* Next Button (Only on first 2 screens) */}
                {currentScreen < 2 ? (
                    <div className="flex items-center gap-6 pb-2">
                        <button
                            onClick={skip}
                            className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
                        >
                            تخطي
                        </button>
                        <Button
                            onClick={nextScreen}
                            size="icon"
                            className="w-16 h-16 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_30px_rgba(168,85,247,0.5)] border-4 border-black/20"
                        >
                            <ArrowLeft className="w-8 h-8" />
                        </Button>
                    </div>
                ) : null}

            </div>

        </div>
    );
};

export default Landing;
