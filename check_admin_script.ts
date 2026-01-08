
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const ADMIN_EMAIL = "yakoubbakhouche011@gmail.com";

async function checkAdmin() {
    console.log("Checking Admin Status...");

    // 1. Check if user exists (we can't list users easily with anon key, but we can try to find their profile/checker)
    // Actually, we can't query auth.users from client. 
    // We will assume the user exists if they can login. 
    // We will look for a checker profile linked to any user, but we need the User ID.

    // Since we are running this as a script, we don't have the User ID easily unless we login or use a service key.
    // I will use a simple query to find ANY checker that matches the display name or just see what checkers exist.

    const { data: checkers, error } = await supabase
        .from('checkers')
        .select('*');

    if (error) {
        console.error("Error fetching checkers:", error);
        return;
    }

    console.log("Found Checkers:", checkers.length);
    checkers.forEach(c => {
        console.log(`- Checker: ${c.display_name} (ID: ${c.id}, UserID: ${c.user_id}, Active: ${c.is_active})`);
    });

    // Check if any conversation is in 'payment_negotiation'
    const { data: convs } = await supabase
        .from('conversations')
        .select('id, status, checker_id, user_id')
        .eq('status', 'payment_negotiation');

    console.log("Payment Negotiations found:", convs?.length);
    if (convs) console.table(convs);
}

checkAdmin();
