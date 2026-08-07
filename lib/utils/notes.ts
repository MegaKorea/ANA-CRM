import type { NoteItem } from '@/lib/supabase/types/tables/leads';

export function getLatestNoteContent(note: NoteItem[] | null | undefined): string | undefined {
  const notes = Array.isArray(note) ? note : [];
  return [...notes].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.content;
}
