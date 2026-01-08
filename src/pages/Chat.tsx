import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Send, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";

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

      const fetchMessages = async () => {
        // Fetch conversation with checker and client info
        const { data: conv, error: convError } = await supabase
          .from("conversations")
          .select(`
            *,
            checkers:checker_id (
              id,
              display_name,
              avatar_url,
              user_id
            ),
            profiles:user_id (
              full_name,
              avatar_url
            )
          `)
          .eq("id", conversationId)
          .maybeSingle() as any;

        if (convError || !conv) {
          console.error("Error fetching conversation:", convError);
          toast({ title: "خطأ", description: "فشل تحميل المحادثة", variant: "destructive" });
          navigate("/messages");
          return;
        }

        const isImChecker = conv.checkers?.user_id === user.id;
        setPartnerName(isImChecker ? (conv.profiles?.full_name || "عميل") : conv.checkers?.display_name);
        setPartnerAvatar(isImChecker ? conv.profiles?.avatar_url : conv.checkers?.avatar_url);

        // Fetch messages
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
              // Avoid duplicates
              if (prev.some(m => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });

            // If message is from partner, mark as read
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
        <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary flex-shrink-0">
          {partnerAvatar ? (
            <img src={partnerAvatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-6 h-6 text-muted-foreground" />
            </div>
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

      {/* Input */}
      <div className="sticky bottom-[76px] bg-card border-t border-border p-3 safe-bottom z-10">
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
      </div>

      <BottomNav />
    </div>
  );
};

export default Chat;
