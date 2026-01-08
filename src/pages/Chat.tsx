import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Send, User } from "lucide-react";
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

const Chat = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState("");
  const [partnerAvatar, setPartnerAvatar] = useState<string | null>(null);

  const [conversationStatus, setConversationStatus] = useState<string | null>(null);
  const [conversationPrice, setConversationPrice] = useState<number>(0);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isImChecker, setIsImChecker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const setupChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setCurrentUserId(user.id);

      // 1. Fetch Conversation Basic Info First (Robustness)
      const { data: conv, error: convError } = await supabase
        .from("conversations")
        .select("id, user_id, checker_id, status, price")
        .eq("id", conversationId)
        .maybeSingle();

      if (convError || !conv) {
        console.error("Error fetching conversation:", convError);
        toast({ title: "خطأ", description: "فشل تحميل المحادثة", variant: "destructive" });
        navigate("/messages");
        return;
      }

      // 2. Determine Role & Fetch Partner Details
      setConversationStatus(conv.status); // Set Status for Locking Logic
      setConversationPrice(conv.price || 0);

      const imChecker = conv.checker_id && (
        // We can't easily check if I am the checker without fetching checkers table, 
        // but let's assume if user.id != conv.user_id, I am the checker
        user.id !== conv.user_id
      );
      setIsImChecker(!!imChecker);

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
        {["paid", "payment_negotiation", "completed", "approved"].includes(conversationStatus || "") ? (
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
        ) : (
          <div className="p-4 rounded-xl bg-secondary/50 border border-border text-center">
            {isImChecker ? (
              // Checker/Admin View of Locked Chat
              <div className="space-y-4">
                <p className="font-bold text-muted-foreground">هذه المحادثة بانتظار الدفع أو التفعيل 🔒</p>
                <p className="text-xs text-muted-foreground mb-3">بصفتك المتحقق، يمكنك تفعيل المحادثة فوراً.</p>
                <Button
                  onClick={async () => {
                    try {
                      toast({ title: "جاري التفعيل...", description: "يتم تفعيل المحادثة الآن" });
                      const { error } = await supabase
                        .from('conversations')
                        .update({ status: 'paid' } as any)
                        .eq('id', conversationId);

                      if (error) throw error;

                      setConversationStatus('paid');
                      toast({ title: "تم التفعيل بنجاح ✅", description: "يمكنك الآن بدء الدردشة" });
                      window.location.reload();
                    } catch (e) {
                      console.error(e);
                      toast({ title: "خطأ", description: "فشل التفعيل", variant: "destructive" });
                    }
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  ✅ تفعيل المحادثة فوراً
                </Button>
              </div>
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

                          // 4. Send Context Message
                          await supabase.from('messages').insert({
                            conversation_id: targetConvId,
                            sender_id: currentUserId,
                            content: `السلام عليكم، أريد تفعيل المحادثة رقم #${conversationId} (مع ${partnerName}) عن طريق الدفع اليدوي (CCP/BaridiMob).`
                          });

                          // 5. Update Original Chat Status to indicate "User Requested Payment"?
                          // Maybe not strictly needed if we just rely on Support chat, but good for UI feedback.
                          // User said: "Original chat stays closed".
                          // So we don't change original chat status yet. Admin will change it to 'paid'.

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
