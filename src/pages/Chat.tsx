import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Send, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";

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

      // Subscribe to new messages
      console.log("Subscribing to messages for conversation:", conversationId);
      const channel = supabase
        .channel(`messages:${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            console.log("New message received via realtime:", payload.new);
            const newMessage = payload.new as Message;
            setMessages((prev) => {
              if (prev.some(m => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });

            // Mark as read immediately if chat is open
            if (newMessage.sender_id !== user.id) {
              supabase
                .from("messages")
                .update({ is_read: true })
                .eq("id", newMessage.id)
                .then(({ error }) => {
                  if (error) console.error("Error marking msg as read:", error);
                });
            }
          }
        )
        .subscribe((status) => {
          console.log(`Realtime status for conversation ${conversationId}:`, status);
        });

      return () => {
        console.log("Unsubscribing from messages:", conversationId);
        supabase.removeChannel(channel);
      };
    };

    setupChat();
  }, [conversationId, navigate, toast]);







  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId || sending) return;

    setSending(true);
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: newMessage.trim(),
    });

    if (error) {
      toast({ title: "خطأ", description: "فشل إرسال الرسالة", variant: "destructive" });
    } else {
      setNewMessage("");
    }
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                  <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {new Date(msg.created_at).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input or Status Message */}
      <div className="sticky bottom-[76px] bg-card border-t border-border p-3 safe-bottom z-10">
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

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => setIsPaymentModalOpen(true)}
                      variant="outline"
                      className="w-full text-xs h-auto py-2 flex flex-col gap-1 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                    >
                      <span className="font-bold">PayPal / بطاقة</span>
                      <span className="text-[10px] text-muted-foreground">دفع إلكتروني آمن</span>
                    </Button>

                    <Button
                      onClick={async () => {
                        // New Logic: Switch to Payment Negotiation (Admin joins chat)
                        try {
                          toast({ title: "جاري الطلب...", description: "يتم استدعاء المشرف للمحادثة..." });

                          const { error } = await supabase
                            .from('conversations')
                            .update({ status: 'payment_negotiation' } as any)
                            .eq('id', conversationId);

                          if (error) throw error;

                          setConversationStatus('payment_negotiation');
                          toast({ title: "تم الطلب بنجاح ✅", description: "المشرف سينضم للمحادثة قريباً لإتمام الدفع." });

                          // Reload to unlock chat input
                          window.location.reload();

                        } catch (e) {
                          console.error(e);
                          toast({ title: "خطأ", description: "حدث خطأ أثناء الطلب", variant: "destructive" });
                        }
                      }}
                      variant="outline"
                      className="w-full text-xs h-auto py-2 flex flex-col gap-1 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                    >
                      <span className="font-bold">موافقة / طلب دفع 🤝</span>
                      <span className="text-[10px] text-muted-foreground">تحدث مع المشرف للدفع</span>
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

      <BottomNav />

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
