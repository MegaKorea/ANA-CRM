import { createAdminClient } from '@/lib/supabase/admin';
import bcrypt from 'bcryptjs';

export interface StudentAccount {
    id: string;
    phone_number: string;
    lead_id: number;
    status: 'active' | 'locked';
    created_at: string;
    updated_at: string;
}

/**
 * Creates a student account if one doesn't already exist for the given phone number.
 * Uses the phone number as the initial password.
 */
export async function createStudentAccountIfNotExists(leadId: number, phoneNumber: string): Promise<StudentAccount | null> {
    const supabase = createAdminClient();

    // 1. Check if account already exists
    const { data: existingAccount, error: fetchError } = await supabase
        .from('student_accounts')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "Row not found"
        console.error('Error checking existing student account:', fetchError);
        throw new Error('Failed to verify existing student account');
    }

    if (existingAccount) {
        return existingAccount as StudentAccount;
    }

    // 2. Create new account
    // Use the phone number as the default password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(phoneNumber, saltRounds);

    const { data: newAccount, error: insertError } = await supabase
        .from('student_accounts')
        .insert({
            lead_id: leadId,
            phone_number: phoneNumber,
            password_hash: passwordHash,
            status: 'active'
        })
        .select()
        .single();

    if (insertError) {
        console.error('Error creating student account:', insertError);
        // It's possible another concurrent request created it, try fetching one last time
        if (insertError.code === '23505') { // Unique violation
            const { data: retryAccount } = await supabase
                .from('student_accounts')
                .select('*')
                .eq('phone_number', phoneNumber)
                .single();
            if (retryAccount) return retryAccount as StudentAccount;
        }
        throw new Error('Failed to create student account');
    }

    return newAccount as StudentAccount;
}

export async function getStudentAccountByPhone(phoneNumber: string) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('student_accounts')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

    if (error && error.code !== 'PGRST116') {
        throw new Error(error.message);
    }
    return data;
}
