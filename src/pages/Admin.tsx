import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Check, X, Clock, User, Calendar, Globe, MessageSquare,
  Users, Shield, FileText, BarChart3, Settings, Power, PowerOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ADMIN_EMAIL = "yakoubbakhouche011@gmail.com";

interface CheckerRequest {
  id: string;
  user_id: string;
  display_name: string;
  age: number;
  gender: string;
  languages: string[];
  social_media: Record<string, string>;
  experience: string | null;
  status: string;
  created_at: string;
}

interface Checker {
  id: string;
  user_id: string;
  display_name: string;
  age: number | null;
  gender: string | null;
  price: number | null;
  rating: number | null;
  tests_count: number | null;
  is_active: boolean;
  is_online: boolean;
  created_at: string;
}

interface Stats {
  totalCheckers: number;
  activeCheckers: number;
  pendingRequests: number;
  totalTests: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<CheckerRequest[]>([]);
  const [checkers, setCheckers] = useState<Checker[]>([]);
  const [stats, setStats] = useState<Stats>({ totalCheckers: 0, activeCheckers: 0, pendingRequests: 0, totalTests: 0 });
  const [processing, setProcessing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);

  const handleActivateChat = async (paymentId: string) => {
    setProcessing(paymentId);
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status: 'paid' } as any)
        .eq('id', paymentId);

      if (error) throw error;

      toast.success("تم تفعيل المحادثة بنجاح ✅");
      loadData();
    } catch (e) {
      console.error(e);
      toast.error("فشل التفعيل");
    } finally {
      setProcessing(null);
    }
  };

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.email !== ADMIN_EMAIL) {
      toast.error("غير مصرح لك بالدخول");
      navigate("/");
      return;
    }

    loadData();
  };

  const loadData = async () => {
    try {
      // Get Admin User ID first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find Admin Checker Profile
      const { data: adminChecker } = await supabase
        .from('checkers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      // Load all data in parallel
      const [requestsRes, checkersRes, testsRes, paymentsRes, supportRes] = await Promise.all([
        supabase.from("checker_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("checkers").select("*").order("created_at", { ascending: false }),
        supabase.from("loyalty_tests").select("id", { count: "exact" }),
        supabase
          .from("conversations")
          .select(`
            id, user_id, checker_id, status, created_at, price, receipt_url,
            checkers (display_name),
            profiles!conversations_user_id_fkey (full_name)
          `)
          .eq("status", "payment_pending")
          .order("created_at", { ascending: false }),
        // Fetch support messages (where admin is the checker and status is 'payment_negotiation')
        adminChecker ? supabase
          .from("conversations")
          .select(`
            id, user_id, status, created_at,
            profiles!conversations_user_id_fkey (full_name, avatar_url)
          `)
          .eq("checker_id", adminChecker.id)
          .eq("status", "payment_negotiation")
          .order("created_at", { ascending: false })
          : Promise.resolve({ data: [], error: null })
      ]);

      if (requestsRes.error) throw requestsRes.error;
      if (checkersRes.error) throw checkersRes.error;

      const requestsData = (requestsRes.data as CheckerRequest[]) || [];
      const checkersData = (checkersRes.data as Checker[]) || [];
      const paymentsData = (paymentsRes.data as any[]) || [];
      const supportData = (supportRes.data as any[]) || [];

      setRequests(requestsData);
      setCheckers(checkersData);
      setPendingPayments(paymentsData);
      setSupportMessages(supportData);
      setStats({
        totalCheckers: checkersData.length,
        activeCheckers: checkersData.filter(c => c.is_active).length,
        pendingRequests: requestsData.filter(r => r.status === "pending").length,
        totalTests: testsRes.count || 0,
      });
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("فشل في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: CheckerRequest) => {
    setProcessing(request.id);
    try {
      // Create checker profile
      const { error: checkerError } = await supabase
        .from("checkers")
        .insert({
          user_id: request.user_id,
          display_name: request.display_name,
          age: request.age,
          gender: request.gender,
          languages: request.languages,
          social_media: request.social_media,
          description: request.experience,
          price: 50,
          is_active: true,
          is_online: false,
        });

      if (checkerError) throw checkerError;

      // Add checker role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: request.user_id,
          role: "checker",
        });

      if (roleError && !roleError.message.includes("duplicate")) throw roleError;

      // Update request status
      const { error: updateError } = await supabase
        .from("checker_requests")
        .update({ status: "approved" })
        .eq("id", request.id);

      if (updateError) throw updateError;

      toast.success("تم قبول الطلب وتفعيل الحساب بنجاح");
      loadData();
    } catch (error) {
      console.error("Error approving:", error);
      toast.error("فشل في قبول الطلب");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (request: CheckerRequest) => {
    setProcessing(request.id);
    try {
      const { error } = await supabase
        .from("checker_requests")
        .update({ status: "rejected" })
        .eq("id", request.id);

      if (error) throw error;

      toast.success("تم رفض الطلب");
      loadData();
    } catch (error) {
      console.error("Error rejecting:", error);
      toast.error("فشل في رفض الطلب");
    } finally {
      setProcessing(null);
    }
  };

  const toggleCheckerActive = async (checker: Checker) => {
    setProcessing(checker.id);
    try {
      const { error } = await supabase
        .from("checkers")
        .update({ is_active: !checker.is_active })
        .eq("id", checker.id);

      if (error) throw error;

      toast.success(checker.is_active ? "تم إلغاء تفعيل الحساب" : "تم تفعيل الحساب");
      loadData();
    } catch (error) {
      console.error("Error toggling checker:", error);
      toast.error("فشل في تحديث الحالة");
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> قيد الانتظار</Badge>;
      case "approved":
        return <Badge className="bg-green-500"><Check className="w-3 h-3 mr-1" /> مقبول</Badge>;
      case "rejected":
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" /> مرفوض</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filterRequests = (status: string) => {
    if (status === "all") return requests;
    return requests.filter(r => r.status === status);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-card/95 backdrop-blur-md z-30 border-b border-border">
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            onClick={() => navigate("/explore")}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold">لوحة التحكم</h1>
            <p className="text-xs text-muted-foreground">إدارة النظام</p>
          </div>
        </div>
      </header>

      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 mb-4">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">نظرة عامة</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">الطلبات</span>
              {stats.pendingRequests > 0 && (
                <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center bg-destructive">
                  {stats.pendingRequests}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="checkers" className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">المتحققون</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">تفعيل المحادثات</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">مهافهمات الدفع</span>
              {supportMessages.length > 0 && (
                <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center bg-blue-500">
                  {supportMessages.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalCheckers}</p>
                      <p className="text-xs text-muted-foreground">إجمالي المتحققين</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Power className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.activeCheckers}</p>
                      <p className="text-xs text-muted-foreground">متحقق نشط</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.pendingRequests}</p>
                      <p className="text-xs text-muted-foreground">طلبات معلقة</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalTests}</p>
                      <p className="text-xs text-muted-foreground">اختبارات الولاء</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">الإجراءات السريعة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.pendingRequests > 0 && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setActiveTab("requests")}
                  >
                    <Clock className="w-4 h-4 mr-2 text-yellow-500" />
                    مراجعة {stats.pendingRequests} طلب معلق
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setActiveTab("checkers")}
                >
                  <Users className="w-4 h-4 mr-2" />
                  إدارة المتحققين
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start mt-2"
                  onClick={() => setActiveTab("messages")}
                >
                  <MessageSquare className="w-4 h-4 mr-2 text-blue-500" />
                  رسائل الدعم الفني ({supportMessages.length})
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="w-full grid grid-cols-4 mb-4">
                <TabsTrigger value="all">الكل ({requests.length})</TabsTrigger>
                <TabsTrigger value="pending">معلق ({filterRequests("pending").length})</TabsTrigger>
                <TabsTrigger value="approved">مقبول ({filterRequests("approved").length})</TabsTrigger>
                <TabsTrigger value="rejected">مرفوض ({filterRequests("rejected").length})</TabsTrigger>
              </TabsList>

              {["all", "pending", "approved", "rejected"].map(tab => (
                <TabsContent key={tab} value={tab} className="space-y-4">
                  {filterRequests(tab).length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      لا توجد طلبات
                    </div>
                  ) : (
                    filterRequests(tab).map(request => (
                      <Card key={request.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <User className="w-5 h-5" />
                              {request.display_name}
                            </CardTitle>
                            {getStatusBadge(request.status || "pending")}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              العمر: {request.age}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="w-4 h-4" />
                              الجنس: {request.gender === "male" ? "ذكر" : request.gender === "female" ? "أنثى" : "آخر"}
                            </div>
                          </div>

                          {request.languages && request.languages.length > 0 && (
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4 text-muted-foreground" />
                              <div className="flex flex-wrap gap-1">
                                {request.languages.map(lang => (
                                  <Badge key={lang} variant="outline" className="text-xs">
                                    {lang}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {request.experience && (
                            <div className="flex items-start gap-2">
                              <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
                              <p className="text-sm text-muted-foreground">{request.experience}</p>
                            </div>
                          )}

                          {request.social_media && Object.keys(request.social_media).filter(k => request.social_media[k]).length > 0 && (
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4 text-muted-foreground" />
                              <div className="flex flex-wrap gap-1">
                                {Object.keys(request.social_media).filter(k => request.social_media[k]).map(platform => (
                                  <Badge key={platform} variant="outline" className="text-[10px] capitalize bg-primary/5">
                                    {platform}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <p className="text-xs text-muted-foreground">
                            تاريخ التقديم: {new Date(request.created_at).toLocaleDateString("ar")}
                          </p>

                          {request.status === "pending" && (
                            <div className="flex gap-2 pt-2">
                              <Button
                                onClick={() => handleApprove(request)}
                                disabled={processing === request.id}
                                className="flex-1"
                              >
                                <Check className="w-4 h-4 mr-2" />
                                قبول وتفعيل
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleReject(request)}
                                disabled={processing === request.id}
                              >
                                <X className="w-4 h-4 mr-2" />
                                رفض
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>

          {/* Checkers Tab */}
          <TabsContent value="checkers" className="space-y-4">
            {checkers.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                لا يوجد متحققون بعد
              </div>
            ) : (
              checkers.map(checker => (
                <Card key={checker.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                          <User className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{checker.display_name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{checker.tests_count || 0} اختبار</span>
                            <span>•</span>
                            <span>⭐ {checker.rating || 0}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={checker.is_active ? "default" : "secondary"} className={checker.is_active ? "bg-green-500" : ""}>
                            {checker.is_active ? "نشط" : "معطل"}
                          </Badge>
                          {checker.is_online && (
                            <Badge variant="outline" className="text-xs border-green-500 text-green-500">
                              متصل
                            </Badge>
                          )}
                        </div>
                        <Switch
                          checked={checker.is_active}
                          onCheckedChange={() => toggleCheckerActive(checker)}
                          disabled={processing === checker.id}
                        />
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-border grid grid-cols-3 gap-2 text-sm text-center">
                      <div>
                        <p className="font-medium">{checker.price || 0} دج</p>
                        <p className="text-xs text-muted-foreground">السعر</p>
                      </div>
                      <div>
                        <p className="font-medium">{checker.age || "-"}</p>
                        <p className="text-xs text-muted-foreground">العمر</p>
                      </div>
                      <div>
                        <p className="font-medium">
                          {checker.gender === "male" ? "ذكر" : checker.gender === "female" ? "أنثى" : "-"}
                        </p>
                        <p className="text-xs text-muted-foreground">الجنس</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Payments/Tests Tab */}
          <TabsContent value="payments" className="space-y-4">
            {pendingPayments.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                لا توجد طلبات دفع معلقة حالياً.
              </div>
            ) : (
              <div className="grid gap-4">
                {pendingPayments.map((payment: any) => (
                  <Card key={payment.id}>
                    <CardContent className="pt-6 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-lg text-primary mb-2">طلب تفعيل محادثة 🔓</h3>
                        <div className="text-base font-medium space-y-1 mt-1 bg-secondary/30 p-3 rounded-lg border border-border">
                          <p className="flex items-center gap-2">
                            <span className="text-muted-foreground">تفعيل الدردشة بين:</span>
                            <span className="font-bold text-foreground">{payment.profiles?.full_name || "العميل"}</span>
                            <span className="text-muted-foreground">و</span>
                            <span className="font-bold text-foreground">{payment.checkers?.display_name || "المتحقق"}</span>
                          </p>
                          <p className="text-sm mt-2 text-muted-foreground">المبلغ: <span className="font-mono font-bold text-foreground">{payment.price || 0} USD</span></p>
                          <p className="text-xs text-muted-foreground">التاريخ: {new Date(payment.created_at).toLocaleDateString("ar")}</p>
                        </div>
                        {payment.receipt_url && (
                          <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-sm hover:underline mt-2 inline-block">
                            📎 عرض إيصال الدفع
                          </a>
                        )}
                      </div>
                      <Button
                        onClick={() => handleActivateChat(payment.id)}
                        disabled={processing === payment.id}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        تفعيل المحادثة
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-4">
            {supportMessages.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                لا توجد مفاوضات دفع حالية.
              </div>
            ) : (
              <div className="grid gap-4">
                {supportMessages.map((msg: any) => (
                  <Card key={msg.id} className="cursor-pointer hover:bg-accent/5 transition-colors" onClick={() => navigate(`/chat/${msg.id}`)}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg flex items-center justify-between">
                          <span>{msg.profiles?.full_name || "عميل"}</span>
                          <span className="text-xs font-normal text-muted-foreground">{new Date(msg.created_at).toLocaleString('ar')}</span>
                        </h3>
                        <p className="text-sm text-muted-foreground">اضغط لفتح المحادثة والمتابعة.</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};


export default Admin;
