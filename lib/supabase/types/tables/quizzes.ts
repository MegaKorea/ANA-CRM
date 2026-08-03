export interface QuizzesTable {
  Row: {
    id: string;
    class_id: string;
    session_id: string | null;
    title: string;
    duration_minutes: number;
    passing_score: number;
    is_published: boolean;
    has_essay: boolean;
    questions: unknown;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    class_id: string;
    session_id?: string | null;
    title: string;
    duration_minutes?: number;
    passing_score?: number;
    is_published?: boolean;
    has_essay?: boolean;
    questions?: unknown;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    class_id?: string;
    session_id?: string | null;
    title?: string;
    duration_minutes?: number;
    passing_score?: number;
    is_published?: boolean;
    has_essay?: boolean;
    questions?: unknown;
    updated_at?: string;
  };
}

export interface QuizAttemptsTable {
  Row: {
    id: string;
    quiz_id: string;
    student_id: string;
    score: number;
    total_questions: number;
    correct_answers: number;
    is_passed: boolean;
    status: string;
    user_answers: unknown;
    teacher_feedback: string | null;
    graded_by: string | null;
    submitted_at: string;
  };
  Insert: {
    id?: string;
    quiz_id: string;
    student_id: string;
    score?: number;
    total_questions?: number;
    correct_answers?: number;
    is_passed?: boolean;
    status?: string;
    user_answers?: unknown;
    teacher_feedback?: string | null;
    graded_by?: string | null;
    submitted_at?: string;
  };
  Update: {
    score?: number;
    total_questions?: number;
    correct_answers?: number;
    is_passed?: boolean;
    status?: string;
    user_answers?: unknown;
    teacher_feedback?: string | null;
    graded_by?: string | null;
    submitted_at?: string;
  };
}
