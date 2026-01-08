
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStatusColumn() {
    console.log('--- CHECKING STATUS COLUMN ---');
    // Try to select status. If column doesn't exist, it should error.
    const { data, error } = await supabase
        .from('conversations')
        .select('id, status')
        .limit(1);

    if (error) {
        console.log('Error selecting status:', error.message);
        if (error.message.includes('does not exist')) {
            console.log('CONFIRMED: status column missing');
        }
    } else {
        console.log('Success selecting status. Column exists.');
    }
}

checkStatusColumn();
