export interface CoursesTable {
    Row: {
        id: string;
        code: string | null;
        name: string;
        description: string | null;
        level: 'beginner' | 'intermediate' | 'advanced' | null;
        fee: number;
        expected_students: number | null;
        expected_duration: string | null;
        status: 'active' | 'inactive';
        created_at: string | null;
        updated_at: string | null;
    };
    Insert: {
        id?: string;
        code?: string | null;
        name: string;
        description?: string | null;
        level?: 'beginner' | 'intermediate' | 'advanced' | null;
        fee?: number;
        expected_students?: number | null;
        expected_duration?: string | null;
        status?: 'active' | 'inactive';
        created_at?: string | null;
        updated_at?: string | null;
    };
    Update: {
        id?: string;
        code?: string | null;
        name?: string;
        description?: string | null;
        level?: 'beginner' | 'intermediate' | 'advanced' | null;
        fee?: number;
        expected_students?: number | null;
        expected_duration?: string | null;
        status?: 'active' | 'inactive';
        created_at?: string | null;
        updated_at?: string | null;
    };
    Relationships: [];
}
