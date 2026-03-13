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
    login_email?: string;
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

    const students = (data as unknown as ClassStudent[]) || [];

    // Fetch login emails from users table
    const phoneNumbers = students
        .map(s => s.leads?.phone_number)
        .filter((phone): phone is string => Boolean(phone));

    if (phoneNumbers.length > 0) {
        const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('phone, email')
            .in('phone', phoneNumbers);

        if (!usersError && usersData) {
            const phoneToEmailMap = new Map<string, string>();
            (usersData as any[]).forEach(u => {
                if (u.phone && u.email) {
                    phoneToEmailMap.set(u.phone, u.email);
                }
            });

            students.forEach(s => {
                if (s.leads?.phone_number) {
                    s.login_email = phoneToEmailMap.get(s.leads.phone_number);
                }
            });
        }
    }

    return students;
}

export async function addClassStudent(classId: string, studentId: number): Promise<ClassStudent> {
    const supabase = createAdminClient();
    const { data: leadRaw, error: leadError } = await supabase
        .from('leads')
        .select('phone_number, full_name, email')
        .eq('id', studentId)
        .single();

    const lead = leadRaw as any;

    if (leadError) {
        throw new Error(`Failed to fetch lead: ${leadError.message}`);
    }

    if (lead && lead.phone_number) {
        try {
            const { createStudentAccountIfNotExists } = await import('./user.service');
            await createStudentAccountIfNotExists(lead.phone_number, lead.full_name, lead.email);
        } catch (e) {
            console.error('Failed to create student account during class enrollment:', e);
        }
    }
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
