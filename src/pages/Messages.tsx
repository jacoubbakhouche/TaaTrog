import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, MessageCircle } from "lucide-react";


interface Conversation {
  id: string;
  checker_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  checkers: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    user_id: string;
  };
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
    is_read: boolean;
  };
  unread_count?: number;
}

const Messages = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setCurrentUserId(user.id);

      // Check if user is a checker
      const { data: checkerData } = await supabase
        .from("checkers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const checkerId = checkerData?.id;

      // Build query: user is client OR user is checker
      let query = supabase
        .from("conversations")
        .select("*, checkers(*)")
        .order("updated_at", { ascending: false });

      if (checkerId) {
        query = query.or(`user_id.eq.${user.id},checker_id.eq.${checkerId}`);
      } else {
        query = query.eq("user_id", user.id);
      }

      const { data: convs, error } = await query;

      if (error) {
        console.error("Error fetching conversations:", error);
        setLoading(false);
        return;
      }

      // Fetch last message and unread count for each conversation
      const conversationsWithMessages = await Promise.all(
        (convs || []).map(async (conv) => {
          const { data: lastMsg } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .eq("is_read", false)
            .neq("sender_id", user.id);

          return {
            ...conv,
            last_message: lastMsg || undefined,
            unread_count: count || 0,
          };
        })
      );

      setConversations(conversationsWithMessages);
      setLoading(false);
    };

    fetchConversations();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-4">
        <h1 className="text-xl font-bold text-foreground">الرسائل</h1>
      </div>

      {/* Conversations List */}
      <div className="divide-y divide-border">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">لا توجد محادثات</h3>
            <p className="text-sm text-muted-foreground">
              ابدأ محادثة جديدة مع أحد المتحققين
            </p>
          </div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => navigate(`/chat/${conv.id}`)}
              className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors text-right"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary flex-shrink-0">
                {conv.checkers?.avatar_url ? (
                  <img
                    src={conv.checkers.avatar_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-foreground truncate">
                    {conv.checkers?.display_name}
                  </h3>
                  {conv.last_message && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {new Date(conv.last_message.created_at).toLocaleDateString("ar")}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground truncate">
                    {conv.last_message?.content || "ابدأ المحادثة"}
                  </p>
                  {(conv.unread_count ?? 0) > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>


    </div>
  );
};

export default Messages;
