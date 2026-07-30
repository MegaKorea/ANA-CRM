# Create Lectures — Design Spec

**Date:** 2026-07-30  
**Branch:** `feat/create-lectures`  
**Status:** Revised — use existing tables only (no new tables); pending final approval

## Goal

Teachers (TEA) manage **many lectures per class session** and **many quizzes per session**, using only tables/columns already on Supabase. Staff + enrolled STU can view. **No new tables.**

## Confirmed decisions

| Topic | Decision |
|-------|----------|
| Session lectures | **Many** per buổi |
| Session quizzes | **Many** per buổi (`quizzes.session_id`) |
| Storage for lectures | JSON array in `class_sessions.body_json` — **no new `lectures` table** |
| DB changes | **No new tables.** Prefer **no migration** if remote columns already exist; only sync app types. Optional: document column defaults only. |
| Write | TEA only |
| Read | Staff + enrolled STU (`resolveClassViewer`) |
| Course / class multi-lecture | Out of scope for phase 1 (no suitable columns for multi-item lists) |

## Data model (existing only)

### `class_sessions` — container for session lecture list

| Column | Use |
|--------|-----|
| `body_json` | `{ "lectures": Lecture[] }` — source of truth for nhiều bài |
| `attachments` | Optional session-level files (or leave `[]` and keep files on each lecture) |
| `content` | Optional short session summary (not “the one lecture”) |
| `has_content` | `true` iff `lectures.length > 0` |
| `has_quiz` | `true` iff ≥ 1 quiz linked to this session (maintain on quiz write) |

**Lecture item shape** (app convention inside `body_json.lectures[]`):

```json
{
  "id": "uuid",
  "title": "string",
  "html": "string",
  "links": [{ "label": "string", "url": "string" }],
  "attachments": [{ "name": "string", "url": "string", "mime_type": "string?", "size": "number?" }],
  "sort_order": 0,
  "updated_at": "ISO-8601"
}
```

Empty / legacy: `body_json` is `{}` or missing `lectures` → treat as `[]`.

### `quizzes` — nhiều quiz / buổi (đã có)

- Required: `class_id`, `title`, `questions`, …
- Optional: `session_id` → gắn buổi
- Many rows share the same `session_id`

### `quiz_attempts` — bài làm HV (đã có)

Unchanged; used when STU submits / TEA grades.

### Explicitly not creating

- `lectures`
- `lecture_attachments`
- New FK tables for course/class lecture lists

## API

### Lectures (mutate JSON on session)

| Method | Path | Authz | Behavior |
|--------|------|-------|----------|
| GET | `/api/classes/[classId]/sessions/[sessionId]/lectures` | Class viewer | Return `body_json.lectures` (+ maybe session summary) |
| POST | same | TEA | Append lecture (generate `id`), set `has_content` |
| PATCH | `.../lectures/[lectureId]` | TEA | Update one item in array |
| DELETE | `.../lectures/[lectureId]` | TEA | Remove item; update `has_content` |

Implementation: read session → modify array → write `body_json` + `has_content` in one update (optimistic concurrency via `updated_at` if needed).

### Quizzes

| Method | Path | Authz |
|--------|------|-------|
| GET | `/api/quizzes?class_id=&session_id=` | Class viewer |
| POST / PATCH / DELETE | `/api/quizzes`, `/api/quizzes/[id]` | TEA |
| Attempts | `/api/quizzes/[id]/attempts` … | STU submit / TEA grade |

On quiz create/delete for a session, recompute `class_sessions.has_quiz`.

### Authz / errors

Same as before: TEA write; `resolveClassViewer` for read; 401/403/404/400 via existing error helpers.

## Services & types

- Sync `ClassSessionsTable` with remote: `body_json`, `attachments`, `has_content`, `has_quiz`
- Add `quizzes` + `quiz_attempts` to `TablesMap`
- `lecture.service` (or session lecture helpers): array CRUD on `body_json`
- `quiz.service` + validators + hooks
- **No** `CREATE TABLE` migration for lectures

## UI

1. **Session detail** (`TabSchedule`): list lectures; TEA add/edit/delete; STU/staff read-only  
2. Same surface: list quizzes for session; TEA CRUD; publish flag  
3. Upload → CDN `/api/upload` → push into that lecture’s `attachments[]`

## Out of scope (phase 1)

- Course/class multi-lecture catalogs  
- New SQL tables  
- Polymorphic lecture rows  
- Restrict TEA to `subject_teachers` only  

## Testing

- TEA add 2+ lectures on one session; GET returns both  
- TEA add 2+ quizzes with same `session_id`  
- Non-TEA write → 403; non-enrolled STU → 403  
- `tsc --noEmit` after type sync  

## Architecture

```
UI Session lectures/quizzes
    ↓
/api/.../lectures  →  patch class_sessions.body_json.lectures
/api/quizzes       →  quizzes (+ has_quiz on session)
    ↓
Supabase (existing tables only)
```

## DB “sửa” thực tế

| Action | Needed? |
|--------|---------|
| `CREATE TABLE` | **No** |
| New columns on `class_sessions` | **No** (already: `body_json`, `attachments`, `has_content`, `has_quiz`) |
| App convention for `body_json.lectures` | **Yes** |
| Sync TypeScript types to remote | **Yes** |

If a local migration file is desired for documentation only, it can be a no-op comment migration — prefer skipping DDL entirely.
