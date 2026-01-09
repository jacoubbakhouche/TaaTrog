import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, MessageCircle, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import BottomNav from "@/components/BottomNav";


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

      console.log("Fetching conversations. User:", user.id, "Checker:", checkerId);

      let query = supabase
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
        .order("updated_at", { ascending: false });

      if (checkerId) {
        // User is a Checker: Get conversations where they are Client OR Checker
        // Note: Using raw string for OR filter to handle the complex logic
        // We want: (user_id = user.id AND deleted_for_user = false) OR (checker_id = checkerId AND deleted_for_checker = false)
        query = query.or(`and(user_id.eq.${user.id},deleted_for_user.is.false),and(checker_id.eq.${checkerId},deleted_for_checker.is.false)`);
      } else {
        // Regular User: Only where they are the client
        query = query.eq("user_id", user.id).eq("deleted_for_user", false);
      }

      const { data: convs, error } = await query;

      if (error) {
        console.error("Error fetching conversations:", error);
        setLoading(false);
        return;
      }

      console.log("Conversations found:", convs?.length);

      // Fetch last message and unread count
      const conversationsWithMessages = await Promise.all(
        (convs || []).map(async (conv: any) => {
          const { data: lastMsg } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .eq("is_read", false)
            .neq("sender_id", user.id); // Valid for both: if I am user, sender!=me (checker). If I am checker, sender!=me (user).

          return {
            ...conv,
            last_message: lastMsg || undefined,
            unread_count: count || 0,
          };
        })
      );

      // No Filtering: Show everything found by the query
      setConversations(conversationsWithMessages as Conversation[]);
      setLoading(false);
    };

    fetchConversations();

    // Realtime Subscription
    const channel = supabase
      .channel('public:conversations_list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        (payload) => {
          console.log("Conversation update received!", payload);
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    if (diff < oneDay && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
    } else if (diff < oneDay * 7) {
      return date.toLocaleDateString("ar-EG", { weekday: "short" });
    } else {
      return date.toLocaleDateString("ar-EG", { month: "short", day: "numeric" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 bg-card/95 backdrop-blur-md z-10 border-b border-border px-4 py-4 mb-2">
          <Skeleton className="h-7 w-24" />
        </header>
        <div className="space-y-2 px-4 mt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-10" />
                </div>
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-4">
        <h1 className="text-xl font-bold text-foreground">الرسائل</h1>
      </div>

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
          conversations.map((conv) => {
            const isImChecker = currentUserId === conv.checker_id || conv.checkers?.user_id === currentUserId;

            // Logic:
            // If I am the Checker -> Show Client Info (from `profiles` relation)
            // If I am the Client -> Show Checker Info (from `checkers` relation)

            const partnerName = isImChecker
              ? (conv.profiles?.full_name || "عميل")
              : (conv.checkers?.display_name || "مستخدم");

            const partnerAvatar = isImChecker
              ? conv.profiles?.avatar_url
              : conv.checkers?.avatar_url;

            return (
              <div
                key={conv.id}
                className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors relative group"
              >
                <div
                  className="flex-1 flex items-center gap-3 cursor-pointer min-w-0"
                  onClick={() => navigate(`/chat/${conv.id}`)}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary flex-shrink-0">
                    {partnerAvatar ? (
                      <img
                        src={partnerAvatar}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-foreground truncate">
                        {partnerName}
                      </h3>
                      {conv.last_message && (
                        <span className="text-xs text-muted-foreground flex-shrink-0 mr-2">
                          {formatDate(conv.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.last_message?.content || "ابدأ المحادثة"}
                      </p>
                      {(conv.unread_count ?? 0) > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mr-2">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!window.confirm("هل أنت متأكد من حذف هذه المحادثة؟")) return;

                    const isImUser = conv.user_id === currentUserId;

                    try {
                      let shouldHardDelete = false;

                      if (isImUser) {
                        if (conv.deleted_for_checker) shouldHardDelete = true;
                      } else {
                        if (conv.deleted_for_user) shouldHardDelete = true;
                      }

                      if (shouldHardDelete) {
                        const { error } = await supabase.from("conversations").delete().eq("id", conv.id);
                        if (error) throw error;
                      } else {
                        const updateData = isImUser
                          ? { deleted_for_user: true, cleared_at_for_user: new Date().toISOString() }
                          : { deleted_for_checker: true, cleared_at_for_checker: new Date().toISOString() };

                        const { error } = await supabase.from("conversations").update(updateData).eq("id", conv.id);
                        if (error) throw error;
                      }

                      setConversations(conversations.filter((c) => c.id !== conv.id));
                    } catch (err) {
                      console.error("Error deleting conversation:", err);
                      // alert("فشلت عملية الحذف"); 
                    }
                  }}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="حذف المحادثة"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
};


export default Messages;
