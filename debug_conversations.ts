
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  // 1. Get current session (simulated since we run in node, we need to hardcode a user ID for testing if we can, 
  // but better to just list all conversations to see if ANY exist)
  
  console.log('--- FETCHING ALL CONVERSATIONS ---');
  const { data: convs, error } = await supabase.from('conversations').select('*');
  if (error) {
    console.error('Error fetching conversations:', error);
  } else {
    console.log('Conversations found:', convs?.length);
    console.log(JSON.stringify(convs, null, 2));
  }
}

checkData();

