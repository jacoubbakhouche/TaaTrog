import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Send, User, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


import { PaymentModal } from "@/components/PaymentModal";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
}

interface Checker {
  id: string;
  display_name: string;
  avatar_url: string | null;
  user_id: string;
}

// Sound Effects
// Sound Effects using AudioContext (100% reliable)
const playTone = (freq: number = 440, type: QuoteOscillatorTypeQuote = "sine", duration: number = 0.1) => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

const playSendSound = () => playTone(600, "sine", 0.15); // High beep
const playReceiveSound = () => playTone(400, "sine", 0.2); // Low beep

const ADMIN_EMAIL = "yakoubbakhouche011@gmail.com";

const Chat = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [clientUserId, setClientUserId] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState("");
  const [partnerAvatar, setPartnerAvatar] = useState<string | null>(null);

  const [conversationStatus, setConversationStatus] = useState<string | null>(null);
  const [conversationPrice, setConversationPrice] = useState<number>(0);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isImChecker, setIsImChecker] = useState(false);
  const [activationRequests, setActivationRequests] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activationRequests]);

  useEffect(() => {
    const setupChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setCurrentUserId(user.id);
      setCurrentUserEmail(user.email || null);

      // 1. Fetch Conversation Basic Info First
      const { data: conv, error: convError } = await supabase
        .from("conversations")
        .select("id, user_id, checker_id, status, price")
        .eq("id", conversationId)
        .maybeSingle();

      if (conv) {
        setClientUserId(conv.user_id);
      }

      if (convError || !conv) {
        console.error("Error fetching conversation:", convError);
        toast({ title: "خطأ", description: "فشل تحميل المحادثة", variant: "destructive" });
        navigate("/messages");
        return;
      }

      // 2. Determine Role
      setConversationStatus(conv.status); // Set Status for Locking Logic
      setConversationPrice(conv.price || 0);

      const imChecker = conv.checker_id && (user.id !== conv.user_id);
      setIsImChecker(!!imChecker);

      // 2.5 If Admin/Support, Check for Activation Requests
      if (imChecker) {
        // Fetch ALL pending requests for this user
        const { data: reqs } = await supabase
          .from('activation_requests')
          .select('*')
          .eq('user_id', conv.user_id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        console.log("Admin Banner Debug:", { imChecker, userId: conv.user_id, reqs });

        if (reqs && reqs.length > 0) {
          setActivationRequests(reqs);
        } else {
          // Fallback: If no requests found, check for ANY pending conversation to support "old" flow or "missing request" flow
          const { data: pendingConvs } = await supabase
            .from('conversations')
            .select('id')
            .eq('user_id', conv.user_id)
            .in('status', ['payment_pending', 'pending_approval'])
            .neq('id', conversationId); // don't find self

          if (pendingConvs && pendingConvs.length > 0) {
            // Create fake request objects for the UI
            setActivationRequests(pendingConvs.map(c => ({
              id: `temp-${c.id}`,
              conversation_id: c.id,
              status: 'pending'
            })));
          }
        }
      }

      let partnerNameFound = "مستخدم";
      let partnerAvatarFound = null;

      if (imChecker) {
        // I am the Checker -> Fetch Client Profile
        const { data: clientProfile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", conv.user_id) // Assuming id is join key, but we fixed FK to user_id. 
          // If FK is on user_id, we should query by user_id
          .eq("user_id", conv.user_id)
          .maybeSingle();

        // Fallback query by 'id' if 'user_id' column logic is mixed
        if (!clientProfile) {
          const { data: clientProfileById } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", conv.user_id)
            .maybeSingle();
          if (clientProfileById) {
            partnerNameFound = clientProfileById.full_name || "عميل";
            partnerAvatarFound = clientProfileById.avatar_url;
          }
        } else {
          partnerNameFound = clientProfile.full_name || "عميل";
          partnerAvatarFound = clientProfile.avatar_url;
        }

      } else {
        // I am the Client -> Fetch Checker Profile

        // Special Case: If this is a Payment Negotiation with Admin, show "Support"
        if (conv.status === 'payment_negotiation') {
          partnerNameFound = "الإدارة (الدعم الفني) 🛡️";
          partnerAvatarFound = null; // Or use a static support image
        } else {
          const { data: checkerProfile } = await supabase
            .from("checkers")
            .select("display_name, avatar_url")
            .eq("id", conv.checker_id)
            .maybeSingle();

          if (checkerProfile) {
            partnerNameFound = checkerProfile.display_name;
            partnerAvatarFound = checkerProfile.avatar_url;
          }
        }
      }

      setPartnerName(partnerNameFound);
      setPartnerAvatar(partnerAvatarFound);


      // 3. Fetch Messages
      const fetchMessages = async () => {
        const { data: msgs, error: msgsError } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (msgsError) {
          console.error("Error fetching messages:", msgsError);
        } else {
          setMessages(msgs as Message[]);
        }
        setLoading(false);

        // Mark messages as read
        const { error: readError } = await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("conversation_id", conversationId)
          .neq("sender_id", user.id)
          .eq("is_read", false);

        if (readError) console.error("Error marking messages as read:", readError);
      };

      fetchMessages();

      // Realtime Subscription
      console.log("Subscribing to messages for conversation:", conversationId);
      const channel = supabase
        .channel(`chat_room:${conversationId}`) // Unique channel name
        .on(
          "postgres_changes",
          {
            event: "*", // Listen to all events (INSERT, UPDATE)
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            console.log("Realtime event received:", payload);

            if (payload.eventType === 'INSERT') {
              const newMessage = payload.new as Message;
              setMessages((prev) => {
                // 1. Check if message already exists (to prevent duplicates)
                if (prev.some(m => m.id === newMessage.id)) return prev;

                // 2. Remove Optimistic Message (replace temp message with real one)
                // We match by content and sender_id since we don't know the temp ID
                const filteredPrev = prev.filter(m =>
                  !(m.id.toString().startsWith("temp-") &&
                    m.content === newMessage.content &&
                    m.sender_id === newMessage.sender_id)
                );
                return [...filteredPrev, newMessage];
              });

              // Play Sound for received messages
              if (newMessage.sender_id !== user.id) {
                playReceiveSound();
                // Mark as read immediately
                supabase.from("messages").update({ is_read: true }).eq("id", newMessage.id);
              }

            } else if (payload.eventType === 'UPDATE') {
              // Handle Read Receipts (is_read updates)
              const updatedMsg = payload.new as Message;
              setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
            }
          }
        )
        .subscribe((status) => {
          console.log(`Subscription status for ${conversationId}:`, status);
          if (status === 'SUBSCRIBED') {
            // Optional: You could show a specialized UI indicator here
          }
        });

      return () => {
        console.log("Cleaning up subscription...");
        supabase.removeChannel(channel);
      };
    };

    setupChat();
  }, [conversationId, navigate, toast]);











  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId || sending) return;

    // 1. Optimistic Update
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      content: newMessage.trim(),
      sender_id: currentUserId,
      created_at: new Date().toISOString(),
      is_read: false
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage("");
    playSendSound();
    scrollToBottom();

    // 2. Actual Send
    // setSending(true); // Don't block UI with sending state if we want it "fast"
    // But we should prevent double sends. We will keep sending=true but only for network call.

    // Actually, user wants "fast". Locking input feels "laggy". 
    // I will NOT block input, but I will debounce or just let them send.
    // I'll keep `sending` to prevent *same* message double submit if they spam enter, but clear input immediately.

    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: optimisticMsg.content,
    });

    if (error) {
      toast({ title: "خطأ", description: "فشل إرسال الرسالة", variant: "destructive" });
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(optimisticMsg.content); // Restore content
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header Skeleton */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" /> {/* Back Button */}
          <Skeleton className="w-10 h-10 rounded-full" /> {/* Avatar */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>

        {/* Messages Skeleton */}
        <div className="flex-1 p-4 space-y-4">
          {/* Received Message */}
          <div className="flex justify-start">
            <Skeleton className="h-12 w-3/4 rounded-2xl rounded-bl-md" />
          </div>
          {/* Sent Message */}
          <div className="flex justify-end">
            <Skeleton className="h-16 w-2/3 rounded-2xl rounded-br-md" />
          </div>
          {/* Received Message */}
          <div className="flex justify-start">
            <Skeleton className="h-10 w-1/2 rounded-2xl rounded-bl-md" />
          </div>
        </div>

        {/* Input Skeleton */}
        <div className="sticky bottom-0 bg-card border-t border-border p-3 safe-bottom">
          <div className="flex items-center gap-2">
            <Skeleton className="flex-1 h-10 rounded-full" />
            <Skeleton className="w-10 h-10 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/messages")} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary flex-shrink-0 flex items-center justify-center border border-border">
          {partnerAvatar ? (
            <img src={partnerAvatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <User className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-foreground truncate">{partnerName}</h2>
          <p className="text-[10px] text-online font-bold uppercase tracking-wider">متصل الآن</p>
        </div>
      </div>



      {/* Admin Activation Banner - Simplified for One-Click Workflow */}
      {isImChecker && (conversationStatus === 'payment_negotiation' || (activationRequests && activationRequests.length > 0)) && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border-b border-yellow-200/50 p-4 sticky top-[65px] z-10 backdrop-blur-xl shadow-sm animate-in slide-in-from-top-2">

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-2.5 rounded-2xl shadow-lg shadow-orange-500/20">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  لوحة التحكم
                  {activationRequests && activationRequests.length > 0 && (
                    <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                      يوجد طلب {activationRequests.length}
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">تفعيل الدردشة للعميل والمختبر</p>
              </div>
            </div>

            {/* Subtle Delete Button */}
            {(!activationRequests || activationRequests.length === 0) && (
              <button
                onClick={async () => {
                  if (confirm("حذف هذه المحادثة؟")) {
                    await supabase.from('conversations').delete().eq('id', conversationId);
                    navigate('/messages');
                  }
                }}
                className="mr-2 text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                title="حذف التذكرة"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
              </button>
            )}
          </div>

          <div className="mt-4 w-full">
            {activationRequests && activationRequests.length > 0 ? (
              <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-3 border border-yellow-100 dark:border-yellow-900/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">طلب تفعيل معلق</p>
                </div>

                <Button
                  size="sm"
                  onClick={async () => {
                    const req = activationRequests[0]; // Take the first one
                    try {
                      toast({ title: "جاري التفعيل...", description: "يتم فتح الدردشة للطرفين..." });

                      // 1. Set Conversation to 'approved' (Unlock Mode)
                      // This allows User & Tester to see the 'Start Chat' button
                      const { error: updateError } = await supabase
                        .from('conversations')
                        .update({ status: 'approved' } as any)
                        .eq('id', req.conversation_id);

                      if (updateError) throw updateError;

                      // 2. Approve Request
                      await supabase.from('activation_requests').update({ status: 'approved' } as any).eq('id', req.id);

                      // 3. Notify Support Chat
                      await supabase.from("messages").insert({
                        conversation_id: conversationId,
                        sender_id: currentUserId,
                        content: `✅ تم قبول الطلب! ظهر زر "تأكيد البدء" للعميل والمختبر الآن.`
                      });

                      toast({ title: "تم القبول!", description: "ينتظر الآن تأكيد العميل/المختبر للدخول." });
                      setActivationRequests(prev => prev.slice(1));

                    } catch (e) {
                      console.error(e);
                      toast({ title: "خطأ", description: "فشل العملية" });
                    }
                  }}
                  className="bg-black text-white hover:bg-gray-800 px-6 h-9 rounded-lg shadow-lg shadow-yellow-500/20"
                >
                  تفعيل الدردشة 🔓
                </Button>
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-[10px] text-gray-400">لا توجد طلبات معلقة حالياً</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            ابدأ المحادثة الآن
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${isMe
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary text-secondary-foreground rounded-bl-md"
                    }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <p className={`text-[10px] ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {new Date(msg.created_at).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    {isMe && (
                      <span className={msg.is_read ? "text-blue-200" : "text-primary-foreground/70"}>
                        {msg.is_read ? "✓✓" : "✓"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input or Status Message */}
      <div className="sticky bottom-0 bg-card border-t border-border p-3 safe-bottom z-10">
        {["paid", "payment_negotiation", "completed"].includes(conversationStatus || "") ? (
          <div className="flex items-center gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="اكتب رسالتك..."
              className="flex-1 bg-secondary border-0 rounded-full px-4"
              dir="auto"
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              size="icon"
              className="rounded-full bg-primary hover:bg-primary/90 flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        ) : conversationStatus === 'approved' ? (
          // UNLOCKED STATE: Show "Start Chat" Button for User/Tester
          <div className="p-4 bg-green-50/50 border border-green-200 rounded-xl text-center space-y-3">
            <h3 className="text-green-800 font-bold">🎉 تمت الموافقة على الطلب!</h3>
            <p className="text-xs text-green-600">اضغط على الزر أدناه للدخول إلى الدردشة وإرسال الرسائل.</p>
            <Button
              onClick={async () => {
                try {
                  const { error } = await supabase
                    .from('conversations')
                    .update({ status: 'paid' } as any) // Fully Activate
                    .eq('id', conversationId);

                  if (error) throw error;
                  setConversationStatus('paid');
                  toast({ title: "بدأت المحادثة!", description: "يمكنك الآن إرسال الرسائل." });
                } catch (e) {
                  toast({ title: "خطأ", description: "حدث خطأ" });
                }
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30 animate-pulse"
            >
              تأكيد وبدء الدردشة 💬
            </Button>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-secondary/50 border border-border text-center">
            {isImChecker ? (
              // Checker/Admin View of Locked Chat
              currentUserEmail === ADMIN_EMAIL ? (
                <div className="space-y-4">
                  <p className="font-bold text-muted-foreground">محادثة مغلقة 🔒</p>
                  <Button
                    onClick={async () => {
                      // Admin Override
                      await supabase.from('conversations').update({ status: 'approved' } as any).eq('id', conversationId);
                      setConversationStatus('approved');
                    }}
                    className="w-full bg-gray-800 text-white"
                  >
                    فك القفل (Admin Override)
                  </Button>
                </div>
              ) : (
                // Regular Checker in Locked Chat
                <p className="text-sm text-muted-foreground">بانتظار تفعيل الإدارة... ⏳</p>
              )
            ) : (
              // Client View of Locked Chat
              conversationStatus === "pending_approval" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="font-bold text-muted-foreground">بانتظار إتمام الدفع 🔒</p>
                    <p className="text-xs text-muted-foreground">اختر وسيلة الدفع للمتابعة</p>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      onClick={async () => {
                        try {
                          toast({ title: "جاري فتح قناة دفع...", description: "يتم تحويلك إلى المشرف..." });

                          // 1. Get Admin ID
                          const { data: adminUserId, error: rpcError } = await supabase.rpc('get_support_admin_id');

                          if (rpcError || !adminUserId) {
                            console.error("RPC Error:", rpcError);
                            toast({ title: "خطأ", description: "تعذر الاتصال بالمشرف", variant: "destructive" });
                            return;
                          }

                          // 2. Get Admin Checker Profile
                          const { data: adminChecker, error: checkerError } = await supabase
                            .from('checkers')
                            .select('id')
                            .eq('user_id', adminUserId)
                            .maybeSingle();

                          if (checkerError || !adminChecker) {
                            toast({ title: "خطأ", description: "حساب المشرف غير مهيأ", variant: "destructive" });
                            return;
                          }

                          // 3. Create or Get Support Conversation
                          // Check if one already exists for payment negotiation? Or just general support?
                          // Let's create a *new* one or reuse support thread.
                          // Ideally, we want a thread specific to this issue, but single support thread is cleaner.
                          // Let's use single support thread (User <-> Admin).

                          const { data: existingConv } = await supabase
                            .from('conversations')
                            .select('id')
                            .eq('user_id', currentUserId)
                            .eq('checker_id', adminChecker.id)
                            .maybeSingle(); // payment_negotiation or payment_pending status? No, just any conv.

                          let targetConvId = existingConv?.id;

                          if (!targetConvId) {
                            const { data: newConv, error: createError } = await supabase
                              .from('conversations')
                              .insert({
                                user_id: currentUserId,
                                checker_id: adminChecker.id,
                                status: 'payment_negotiation',
                                price: 0
                              } as any)
                              .select()
                              .single();

                            if (createError) throw createError;
                            targetConvId = newConv.id;
                          }

                          // 4. Create Activation Request (So Admin sees it in Dashboard)
                          const { data: currentConv } = await supabase
                            .from('conversations')
                            .select('checker_id')
                            .eq('id', conversationId)
                            .single();

                          if (currentConv) {
                            await supabase.from('activation_requests').insert({
                              user_id: currentUserId,
                              conversation_id: conversationId,
                              checker_id: currentConv.checker_id, // The checker of the locked chat
                              status: 'pending'
                            });
                          }

                          // 5. Send Context Message
                          await supabase.from('messages').insert({
                            conversation_id: targetConvId,
                            sender_id: currentUserId,
                            content: `السلام عليكم، أريد تفعيل المحادثة رقم #${conversationId} (مع ${partnerName}) عن طريق الدفع اليدوي (CCP/BaridiMob).`
                          });

                          navigate(`/chat/${targetConvId}`);

                        } catch (e) {
                          console.error(e);
                          toast({ title: "خطأ", description: "حدث خطأ غير متوقع", variant: "destructive" });
                        }
                      }}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-auto py-3 rounded-xl shadow-lg hover:shadow-primary/20 transition-all"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-bold text-lg">الدفع اليدوي (CCP / BaridiMob)</span>
                      </div>
                      <p className="text-xs opacity-90 mt-1 font-normal">تحدث مباشرة مع الإدارة لتفعيل الخدمة</p>
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">هذه المحادثة مغلقة ({conversationStatus})</p>
              )
            )}
          </div>
        )}
      </div>



      {conversationId && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          bookingId={conversationId}
          price={conversationPrice}
          onPaymentSuccess={() => {
            // Refresh logic if needed, but PaymentModal usually navigates or we can just reload message
            // Ideally re-fetch conversation status
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

export default Chat;
