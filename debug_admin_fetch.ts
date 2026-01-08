
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Mock logging in as the Admin would require the session, which we can't easily get.
// However, we can try to inspect the TABLE structure publically or try the query anonymously to see if it's a structural error (Relation not found) vs Permission error.

async function debugFetch() {
    console.log("Testing activation_requests query...");

    // 1. Test basic select (No joins)
    const { data: basic, error: basicError } = await supabase
        .from('activation_requests')
        .select('id, status');

    if (basicError) {
        console.error("Basic Select Error:", basicError);
    } else {
        console.log("Basic Select OK. Rows:", basic?.length);
    }

    // 2. Test Joins (This is likely where it fails)
    // We suspect the FK relationship naming.
    console.log("Testing Joins...");

    const { data: joinData, error: joinError } = await supabase
        .from('activation_requests')
        .select(`
      id,
      profiles:user_id (full_name),
      checkers:checker_id (display_name)
    `);

    if (joinError) {
        console.error("Join Query Error:", JSON.stringify(joinError, null, 2));

        // Hint: If it says "Could not find a relationship", we need to check FKs.
    } else {
        console.log("Join Query OK:", joinData?.length);
    }
}

debugFetch();
