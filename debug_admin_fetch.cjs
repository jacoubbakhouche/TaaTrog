
const { createClient } = require('@supabase/supabase-js');

// Hardcoded for debugging purposes (Copied from .env output)
const supabaseUrl = "https://tpkrmxrgvzbzeyrvebfi.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwa3JteHJndnpiemV5cnZlYmZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MzM0MDQsImV4cCI6MjA4MTUwOTQwNH0.ZzmH_E6XGFshbX04AAYoFFN9BwKOpjvDmo5fqq5vhyo";

const supabase = createClient(supabaseUrl, supabaseKey);

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

    // 2. Test Joins
    console.log("Testing Joins...");

    const { data: joinData, error: joinError } = await supabase
        .from('activation_requests')
        .select(`
      id,
      profiles:user_id (full_name),
      checkers:checker_id (display_name)
    `);

    if (joinError) {
        // Inspect the error code/message carefully
        console.error("Join Query Error Details:");
        console.error(JSON.stringify(joinError, null, 2));
    } else {
        console.log("Join Query OK. Rows:", joinData?.length);
    }
}

debugFetch();
