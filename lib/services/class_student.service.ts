import { createAdminClient } from '@/lib/supabase/admin';

export interface ClassStudent {
    id: string;
    class_id: string;
    student_id: number;
    status: string;
    enrollment_date: string;
    paid_amount: number;
    debt_amount: number;
    images: string[] | null;
    created_at: string;
    updated_at: string;
    leads?: {
        full_name: string;
        email: string;
        phone_number: string;
    };
}

export async function getClassStudents(classId: string): Promise<ClassStudent[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('class_students')
        .select(`
            id,
            class_id,
            student_id,
            status,
            enrollment_date,
            paid_amount,
            debt_amount,
            images,
            created_at,
            updated_at,
            leads (
                full_name,
                email,
                phone_number
            )
        `)
        .eq('class_id', classId)
        .order('enrollment_date', { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return (data as unknown as ClassStudent[]) || [];
}

export async function addClassStudent(classId: string, studentId: number): Promise<ClassStudent> {
    const supabase = createAdminClient();

    // 1. Fetch the lead to get phone number
    const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('phone_number')
        .eq('id', studentId)
        .single();

    if (leadError) {
        throw new Error(`Failed to fetch lead: ${leadError.message}`);
    }

    if (lead && lead.phone_number) {
        // 2. Ensure student account exists
        const { createStudentAccountIfNotExists } = await import('./student_account.service');
        await createStudentAccountIfNotExists(studentId, lead.phone_number);
    }

    // 3. Add to class
    const { data, error } = await supabase
        .from('class_students')
        .insert({ class_id: classId, student_id: studentId } as any)
        .select(`
            *,
            leads (
                full_name,
                email,
                phone_number
            )
        `)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data as unknown as ClassStudent;
}

export async function removeClassStudent(id: string): Promise<void> {
    const supabase = createAdminClient();
    const { error } = await supabase
        .from('class_students')
        .delete()
        .eq('id', id);

    if (error) {
        throw new Error(error.message);
    }
}

export async function updateClassStudent(id: string, updates: Partial<ClassStudent>): Promise<ClassStudent> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('class_students')
        .update(updates as never)
        .eq('id', id)
        .select(`
            id,
            class_id,
            student_id,
            status,
            enrollment_date,
            paid_amount,
            debt_amount,
            images,
            created_at,
            updated_at,
            leads (
                full_name,
                email,
                phone_number
            )
        `)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data as unknown as ClassStudent;
}
