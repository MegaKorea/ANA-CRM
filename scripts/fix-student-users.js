const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Simple parse from .env since dotenv is a pain sometimes in barenode
const envVars = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
    const parts = line.split('=');
    if (parts.length >= 2) acc[parts[0]] = parts.slice(1).join('=').trim();
    return acc;
}, {});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['NEXT_PUBLIC_SERVICE_ROLE_KEY']; // Must use service role

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanBadUsers() {
    console.log('Fetching bad users...');

    // Find students who mistakenly got put into public.users
    const { data: students, error: getErr } = await supabase.from('student_accounts').select('auth_id').not('auth_id', 'is', null);

    if (getErr || !students || students.length === 0) {
        console.log('No students found or error:', getErr);
        return;
    }

    const ids = students.map(s => s.auth_id);
    console.log(`Found ${ids.length} student auth_ids. Deleting them from public.users...`);

    const { error: delErr } = await supabase.from('users').delete().in('id', ids);
    if (delErr) {
        console.error('Failed to delete users:', delErr);
    } else {
        console.log('Successfully deleted mistakenly added public.users records.');
    }
}

cleanBadUsers();
