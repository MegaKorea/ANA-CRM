import { createAdminClient } from '@/lib/supabase/admin';
import type { CreateClassInput, UpdateClassInput } from '@/lib/validators/class.validator';
import { fail, throwIfSupabaseError } from '@/errors';
import { HttpStatusCode } from '@/constants/enums';

const CLASS_DETAIL_SELECT = `
  *,
  courses (
    name,
    code,
    fee
  ),
  teacher:users!classes_teacher_id_fkey(
    id,
    full_name,
    email,
    phone
  )
`;

const CLASS_LIST_SELECT = `
  *,
  courses (
    name,
    code,
    fee
  ),
  class_students (
    id
  ),
  teacher:users!classes_teacher_id_fkey(
    id,
    full_name,
    email,
    phone
  )
`;

export interface Class {
  id: string;
  course_id: string;
  code: string | null;
  name: string;
  start_date: string | null;
  end_date: string | null;
  schedule: string | null;
  timetable: 'Sáng' | 'Chiều' | null;
  capacity: number | null;
  status: string | null;
  homeroom_teacher_id: string | null;
  created_at: string;
  updated_at: string;
  courses?: {
    name: string;
    code: string;
    fee: number;
  };
  teacher?: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
  };
  class_students?: { id: string }[];
}

export async function fetchAllClasses(studentPhone?: string): Promise<Class[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from('classes')
    .select(CLASS_LIST_SELECT)
    .order('created_at', { ascending: false });

  if (studentPhone) {
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .select('id')
      .eq('phone_number', studentPhone)
      .maybeSingle();

    throwIfSupabaseError(leadError, 'Không tìm được lead theo SĐT.');

    if (!leadData) {
      return [];
    }

    const leadId = (leadData as { id: number }).id;

    const { data: classStudentsData, error: classStudentsError } = await supabase
      .from('class_students')
      .select('class_id')
      .eq('student_id', leadId);

    throwIfSupabaseError(classStudentsError, 'Không đọc được danh sách lớp của học viên.');

    const enrolledClassIds =
      classStudentsData?.map((cs: { class_id: string }) => cs.class_id) ?? [];

    if (enrolledClassIds.length === 0) {
      return [];
    }

    query = query.in('id', enrolledClassIds);
  }

  const { data, error } = await query;
  throwIfSupabaseError(error, 'Không tải được danh sách lớp học.');

  return (data as unknown as Class[]) || [];
}

export async function getClass(id: string): Promise<Class> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('classes')
    .select(CLASS_DETAIL_SELECT)
    .eq('id', id)
    .single();

  throwIfSupabaseError(error, 'Không tải được lớp học.');

  return data as unknown as Class;
}

export async function createClass(input: CreateClassInput): Promise<Class> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('classes')
    .insert(input as never)
    .select(CLASS_DETAIL_SELECT)
    .single();

  throwIfSupabaseError(error, 'Tạo lớp học thất bại.');

  return data as unknown as Class;
}

export async function updateClass(id: string, input: UpdateClassInput): Promise<Class> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('classes')
    .update(input as never)
    .eq('id', id)
    .select(CLASS_DETAIL_SELECT)
    .single();

  throwIfSupabaseError(error, 'Cập nhật lớp học thất bại.');

  return data as unknown as Class;
}

export async function deleteClass(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { count, error: countError } = await supabase
    .from('class_students')
    .select('id', { count: 'exact', head: true })
    .eq('class_id', id);

  throwIfSupabaseError(countError, 'Không kiểm tra được sĩ số lớp.');
  if ((count ?? 0) > 0) {
    fail(
      'CLASS_HAS_STUDENTS',
      HttpStatusCode.CONFLICT,
      'Lớp đang còn học viên không thể xóa',
    );
  }

  const { error } = await supabase.from('classes').delete().eq('id', id);

  throwIfSupabaseError(error, 'Xóa lớp học thất bại.');
}
