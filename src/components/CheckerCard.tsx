import { BadgeCheck, User } from "lucide-react";
import { DbChecker } from "@/types/checker";

interface CheckerCardProps {
  checker: DbChecker;
  onClick: () => void;
}

const CheckerCard = ({ checker, onClick }: CheckerCardProps) => {
  return (
    <div 
      onClick={onClick}
      className="relative rounded-2xl overflow-hidden bg-card shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer group"
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden">
        {checker.avatar_url ? (
          <img
            src={checker.avatar_url}
            alt={checker.display_name}
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center">
            <User className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
        
        {/* Online Indicator */}
        {checker.is_online && (
          <div className="absolute top-3 right-3 w-3 h-3 bg-online rounded-full border-2 border-card animate-pulse-online shadow-lg" />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-white font-bold text-base leading-tight drop-shadow-md">{checker.display_name}</h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-white/90 text-sm font-medium">{checker.age || "?"} y/o</span>
            <BadgeCheck className="w-4 h-4 text-primary fill-white" />
          </div>
          
          {/* Tests Badge */}
          <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-semibold text-foreground shadow-sm">
            +{checker.tests_count || 0} tests
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckerCard;
