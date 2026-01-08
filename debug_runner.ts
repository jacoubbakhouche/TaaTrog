
import { createClient } from '@supabase/supabase-js';

// Wait, I don't have user session here.
// I will use Service Role to Bypass RLS and check DATA INTEGRITY.
// Then I will manually check RLS logic.

const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || 'MISSING_KEY');

async function debug() {
  console.log('--- Debugging Conversations ---');
  
  // 1. Fetch latest conversation
  const { data: convs, error } = await supabase
    .from('conversations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching convs:', error);
    return;
  }

  if (convs.length === 0) {
    console.log('No conversations found.');
    return;
  }

  const conv = convs[0];
  console.log('Latest Conversation:', conv);

  // 2. Test the Join Query (simulating Chat.tsx but with Service Role first)
  console.log('--- Testing Join Query ---');
  const { data: joinData, error: joinError } = await supabase
    .from('conversations')
    .select(`
      *,
      checkers:checker_id (id, display_name, user_id),
      profiles:user_id (id, full_name) 
    `)
    .eq('id', conv.id)
    .single();

  if (joinError) {
    console.error('Detail Query Failed:', joinError);
  } else {
    console.log('Detail Query Success:', joinData);
  }
}

debug();

