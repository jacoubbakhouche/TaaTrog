import { X, RotateCcw } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (filters: FilterState) => void;
}

interface FilterState {
  gender: string[];
  ageRange: [number, number];
  socialMedia: string[];
  languages: string[];
}

const genderOptions = ["Male", "Female", "Other"];
const socialMediaOptions = [
  { id: "instagram", icon: "📷" },
  { id: "facebook", icon: "📘" },
  { id: "snapchat", icon: "👻" },
  { id: "tiktok", icon: "🎵" },
  { id: "whatsapp", icon: "💬" },
];
const languageOptions = ["French", "English", "Spanish", "German", "Portuguese", "Italian"];

const FilterSheet = ({ isOpen, onClose, onConfirm }: FilterSheetProps) => {
  const [filters, setFilters] = useState<FilterState>({
    gender: [],
    ageRange: [18, 50],
    socialMedia: [],
    languages: [],
  });

  const toggleFilter = (category: keyof FilterState, value: string) => {
    setFilters(prev => {
      const current = prev[category] as string[];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
  };

  const resetFilters = () => {
    setFilters({
      gender: [],
      ageRange: [18, 50],
      socialMedia: [],
      languages: [],
    });
  };

  const totalSelected = filters.gender.length + filters.socialMedia.length + filters.languages.length;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="flex flex-row items-center justify-between pb-4 border-b border-border">
          <SheetTitle className="text-xl font-bold">Filter By</SheetTitle>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-muted-foreground" />
          </button>
        </SheetHeader>

        <div className="overflow-y-auto h-[calc(100%-140px)] py-6 space-y-8">
          {/* Gender */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Gender</h3>
            <div className="flex flex-wrap gap-2">
              {genderOptions.map((gender) => (
                <button
                  key={gender}
                  onClick={() => toggleFilter("gender", gender)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium border transition-all",
                    filters.gender.includes(gender)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary text-secondary-foreground border-transparent hover:border-primary/30"
                  )}
                >
                  {gender}
                </button>
              ))}
            </div>
          </div>

          {/* Age Range */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">
              Age ({filters.ageRange[0]}-{filters.ageRange[1]}+)
            </h3>
            <Slider
              value={filters.ageRange}
              onValueChange={(value) => setFilters(prev => ({ ...prev, ageRange: value as [number, number] }))}
              min={18}
              max={50}
              step={1}
              className="mt-4"
            />
          </div>

          {/* Social Media */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Social Media</h3>
            <div className="flex flex-wrap gap-3">
              {socialMediaOptions.map((social) => (
                <button
                  key={social.id}
                  onClick={() => toggleFilter("socialMedia", social.id)}
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all",
                    filters.socialMedia.includes(social.id)
                      ? "bg-primary text-primary-foreground shadow-button"
                      : "bg-secondary hover:bg-accent"
                  )}
                >
                  {social.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Language spoken</h3>
            <div className="flex flex-wrap gap-2">
              {languageOptions.map((lang) => (
                <button
                  key={lang}
                  onClick={() => toggleFilter("languages", lang)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium border transition-all",
                    filters.languages.includes(lang)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary text-secondary-foreground border-transparent hover:border-primary/30"
                  )}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-card border-t border-border flex gap-3">
          <Button
            variant="outline"
            onClick={resetFilters}
            className="flex-1 gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          <Button
            onClick={() => onConfirm(filters)}
            className="flex-1 bg-gradient-primary shadow-button"
          >
            Confirm ({totalSelected > 0 ? totalSelected : "All"})
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FilterSheet;
