
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findAdmin() {
  const adminEmail = 'yakoubbakhouche011@gmail.com';
  console.log('--- FINDING ADMIN PROFILE ---');
  // Profiles doesn't inherently have email, usually email is in auth.users. 
  // But maybe the profile has username or we can check if there's a trick.
  // Wait, I can't query auth.users from here easily with anon key unless RLS exposes email in a view or function.
  // Let's check if 'checkers' or 'profiles' has something useful.
  
  // Try to find a user with role 'admin' in profiles
  const { data: adminProfiles, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'admin');

  if (error) {
    console.error('Error fetching admin profiles:', error);
  } else {
    console.log('Admin profiles found:', adminProfiles?.length);
    console.log(JSON.stringify(adminProfiles, null, 2));
  }
}

findAdmin();

