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
    user_id?: string | null;
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

    const leadIds = students.map((s) => s.student_id).filter(Boolean);
    const phoneNumbers = students
        .map((s) => s.leads?.phone_number)
        .filter((phone): phone is string => Boolean(phone));

    if (leadIds.length > 0 || phoneNumbers.length > 0) {
        const orParts: string[] = [];
        if (leadIds.length > 0) orParts.push(`lead_id.in.(${leadIds.join(',')})`);
        if (phoneNumbers.length > 0) {
            const phones = phoneNumbers.map((p) => `"${p.replace(/"/g, '')}"`).join(',');
            orParts.push(`phone.in.(${phones})`);
        }

        const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, email, lead_id, phone')
            .or(orParts.join(','));

        if (!usersError && usersData) {
            const byLeadId = new Map<number, { id: string; email: string | null }>();
            const byPhone = new Map<string, { id: string; email: string | null; lead_id: number | null }>();

            for (const u of usersData as Array<{
                id: string;
                email: string | null;
                lead_id: number | null;
                phone: string | null;
            }>) {
                if (u.lead_id != null) {
                    byLeadId.set(u.lead_id, { id: u.id, email: u.email });
                }
                if (u.phone) {
                    byPhone.set(u.phone, { id: u.id, email: u.email, lead_id: u.lead_id });
                }
            }

            students.forEach((s) => {
                let user = byLeadId.get(s.student_id) ?? null;
                if (!user && s.leads?.phone_number) {
                    const byPh = byPhone.get(s.leads.phone_number);
                    if (byPh) {
                        user = { id: byPh.id, email: byPh.email };
                        if (byPh.lead_id == null) {
                            void supabase
                                .from('users')
                                .update({ lead_id: s.student_id } as never)
                                .eq('id', byPh.id);
                        }
                    }
                }
                if (user) {
                    s.user_id = user.id;
                    if (user.email) s.login_email = user.email;
                }
            });
        }
    }

    return students.toSorted((a, b) => {
        const givenName = (fullName: string) => {
            const parts = fullName.trim().split(/\s+/).filter(Boolean);
            return parts[parts.length - 1] || '';
        };
        return givenName(a.leads?.full_name || '').localeCompare(
            givenName(b.leads?.full_name || ''),
            'vi',
            { sensitivity: 'base' },
        );
    });
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
            await createStudentAccountIfNotExists(
                lead.phone_number,
                lead.full_name,
                lead.email,
                studentId,
            );
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
