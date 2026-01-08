
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
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

