import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera, ArrowRight, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ClientProfile = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    const [fullName, setFullName] = useState("");
    const [age, setAge] = useState("");
    const [gender, setGender] = useState("");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        getProfile();
    }, []);

    const getProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                navigate("/auth");
                return;
            }

            setUserId(user.id);

            const { data, error } = await supabase
                .from("profiles")
                .select("full_name, avatar_url, age, gender")
                .eq("user_id", user.id) // Query by user_id, not id
                .single();

            if (error) {
                throw error;
            }

            if (data) {
                setFullName(data.full_name || "");
                setAvatarUrl(data.avatar_url);
                setAge(data.age ? data.age.toString() : "");
                setGender(data.gender || "");
            }
        } catch (error) {
            console.error("Error loading profile:", error);
            // If no profile found, it's fine, we create one on save or it might be rls issue? 
            // Usually trigger creates it.
        } finally {
            setLoading(false);
        }
    };

    const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error("You must select an image to upload.");
            }

            const file = event.target.files[0];
            const fileExt = file.name.split(".").pop();
            const fileName = `${userId}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("avatars") // Make sure this bucket exists!
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

            setAvatarUrl(data.publicUrl);

            // Auto-save avatar update
            if (userId) {
                await supabase
                    .from("profiles")
                    .update({ avatar_url: data.publicUrl })
                    .eq("user_id", userId);

                toast({ title: "تم تحديث الصورة بنجاح ✅" });
            }

        } catch (error: any) {
            toast({
                title: "فشل رفع الصورة",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setUploading(false);
        }
    };

    const updateProfile = async () => {
        try {
            setSaving(true);
            const { error } = await supabase
                .from("profiles")
                .update({
                    full_name: fullName,
                    age: age ? parseInt(age) : null,
                    gender: gender || null,
                    updated_at: new Date().toISOString(),
                })
                .eq("user_id", userId);

            if (error) throw error;
            toast({ title: "تم حفظ التغييرات بنجاح ✅" });
            navigate("/"); // Or stay here?
        } catch (error) {
            toast({
                title: "خطأ",
                description: "فشل تحديث الملف الشخصي",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b p-4 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowRight className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-bold">الملف الشخصي</h1>
            </div>

            <div className="container max-w-md mx-auto p-6 space-y-8">

                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-4">
                    <div className="relative group">
                        <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                            <AvatarImage src={avatarUrl || ""} className="object-cover" />
                            <AvatarFallback className="text-4xl bg-secondary"><User /></AvatarFallback>
                        </Avatar>
                        <label
                            htmlFor="avatar-upload"
                            className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-lg"
                        >
                            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                            <input
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={uploadAvatar}
                                disabled={uploading}
                            />
                        </label>
                    </div>
                    <p className="text-sm text-muted-foreground">اضغط على الكاميرا لتغيير الصورة</p>
                </div>

                {/* Form Section */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="fullname">الاسم الكامل</Label>
                        <Input
                            id="fullname"
                            placeholder="الاسم الظاهر للآخرين"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="h-12 text-lg text-center bg-secondary/50 border-0"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="age">العمر</Label>
                            <Input
                                id="age"
                                type="number"
                                placeholder="-- سنة"
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                                className="h-12 text-lg text-center bg-secondary/50 border-0"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>الجنس</Label>
                            <div className="flex gap-2 h-12">
                                <button
                                    onClick={() => setGender('male')}
                                    className={`flex-1 rounded-lg font-bold text-sm transition-all border-2 ${gender === 'male'
                                        ? 'bg-primary text-white border-primary'
                                        : 'bg-secondary/50 text-muted-foreground border-transparent'
                                        }`}
                                >
                                    ذكر
                                </button>
                                <button
                                    onClick={() => setGender('female')}
                                    className={`flex-1 rounded-lg font-bold text-sm transition-all border-2 ${gender === 'female'
                                        ? 'bg-pink-500 text-white border-pink-500'
                                        : 'bg-secondary/50 text-muted-foreground border-transparent'
                                        }`}
                                >
                                    أنثى
                                </button>
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={updateProfile}
                        disabled={saving}
                        className="w-full h-12 text-lg font-bold shadow-lg"
                        variant="gradient"
                    >
                        {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                        حفظ التغييرات
                    </Button>
                </div>

            </div>
        </div>
    );
};

export default ClientProfile;
