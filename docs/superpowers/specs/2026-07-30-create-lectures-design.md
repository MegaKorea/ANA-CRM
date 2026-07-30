# Create Lectures — Design Spec

**Date:** 2026-07-30  
**Branch:** `feat/create-lectures`  
**Status:** Draft (revised to existing Supabase schema — pending re-approval)

## Goal

Teachers (TEA) create/edit **bài giảng buổi học** and (optionally later) **quiz** using tables already in Supabase. Staff + enrolled STU can view. No new `lectures` / `lecture_attachments` tables.

## Requirements (revised vs prior draft)

| Topic | Prior draft | Revised (existing DB) |
|-------|-------------|------------------------|
| Scopes | course / class / session independent many-rows | **Session** content lives on `class_sessions`; **quiz** on `quizzes` (`class_id` + optional `session_id`) |
| Cardinality | Many lectures per scope | **1 content payload per session** (`content` + `body_json` + `attachments`); many **quizzes** per class/session |
| Course / class lecture lists | Planned | **Not in DB today** — `courses` only has `description`; `classes` has no content fields (see Open question) |
| Write roles | TEA only | TEA only (unchanged) |
| Read roles | Staff + enrolled STU | Unchanged; reuse `resolveClassViewer` |
| Approach | New polymorphic tables | **Reuse remote schema**; sync TypeScript types in repo |

## Data model (existing Supabase)

### `class_sessions` — bài giảng buổi học

| Column | Type | Role for lectures |
|--------|------|-------------------|
| `id` | uuid | Session PK |
| `class_id` | uuid | Class FK |
| `content` | text \| null | Short title / summary text |
| `body_json` | jsonb | Rich body (default `{}`) — links, structured blocks, etc. |
| `attachments` | jsonb | File list (default `[]`) — CDN URLs from `/api/upload` |
| `has_content` | boolean | Flag when lecture content is present |
| `has_quiz` | boolean | Flag when a quiz is linked/published for this session |
| (+ existing) | | `session_number`, `date`, `teacher_id`, `room`, QR fields, timestamps |

**Semantics:** editing “bài giảng buổi X” = `PATCH` that session’s `content` / `body_json` / `attachments` / `has_content`. Not a separate lecture row.

**Suggested `attachments` item shape** (app convention; DB is free jsonb):

```json
{ "name": "slide.pdf", "url": "https://...", "mime_type": "application/pdf", "size": 12345 }
```

**Suggested `body_json` shape** (app convention):

```json
{
  "html": "<p>...</p>",
  "links": [{ "label": "Drive", "url": "https://..." }]
}
```

(Exact keys can be refined in implementation; keep backward-compatible with `{}`.)

### `quizzes` — quiz gắn lớp / buổi

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `class_id` | uuid | Required FK → `classes` |
| `session_id` | uuid \| null | Optional FK → `class_sessions` |
| `title` | text | Required |
| `duration_minutes` | int | Default 0 |
| `passing_score` | int | Default 0 |
| `is_published` | boolean | Default false |
| `has_essay` | boolean | Default false |
| `questions` | jsonb | Question bank payload |
| `created_at` / `updated_at` | timestamptz | |

### `quiz_attempts` — bài làm của học viên

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `quiz_id` | uuid | FK → `quizzes` |
| `student_id` | uuid | FK → `users` |
| `score`, `total_questions`, `correct_answers` | int | |
| `is_passed` | boolean | |
| `status` | text | Default `COMPLETED` |
| `user_answers` | jsonb | |
| `teacher_feedback` | text \| null | |
| `graded_by` | uuid \| null | FK → `users` |
| `submitted_at` | timestamptz | |

### Not present (gap)

- No `lectures` / `lecture_attachments` tables
- No course-level or class-level lecture content columns beyond `courses.description`

## API (revised)

### Session lecture (phase 1 core)

| Method | Path | Authz |
|--------|------|-------|
| GET | `/api/classes/[classId]/sessions/[sessionId]/lecture` (or extend existing session GET) | Class viewer (staff / enrolled STU) |
| PATCH | same | **TEA only** — body: `{ content?, body_json?, attachments?, has_content? }` |

Prefer extending existing session update route if it already allows TEA to PATCH `content`, then add `body_json` / `attachments` / `has_content` to validator + service + types.

### Quiz (phase 1 optional / phase 1b)

| Method | Path | Authz |
|--------|------|-------|
| GET | `/api/quizzes?class_id=&session_id=` | Class viewer |
| POST / PATCH / DELETE | `/api/quizzes`, `/api/quizzes/[id]` | TEA only |
| POST | `/api/quizzes/[id]/attempts` | Enrolled STU |
| GET / PATCH | attempts (grade) | TEA / owner STU as appropriate |

### Authorization

- **Write lecture/quiz:** `TEA`
- **Read:** `resolveClassViewer` for the session’s `class_id`
- Phase 1: do not restrict TEA to `subject_teachers` (same as prior)

### Errors

401 / 403 / 404 / 400 — existing `AppError` patterns.

## Services & hooks

- Sync types: `lib/supabase/types/tables/class_sessions.ts` (+ add `quizzes.ts`, `quiz_attempts.ts` to `TablesMap`)
- Extend `class_session.service` update path for lecture fields
- `lib/services/quiz.service.ts` + validators + `use-quizzes` when quiz UI ships
- **No** new migration for lectures tables (schema already on remote)

## UI (revised)

1. **Buổi học** (`TabSchedule` session detail): form “Bài giảng” — title/`content`, rich/`body_json`, links, attachments upload; toggle/`has_content`
2. **Quiz** (same session or class): create/publish quiz when in scope; set `has_quiz` on session when linked
3. **Course / class lecture tabs:** deferred until product decides how to store them (no columns today)

## Upload

Reuse `POST /api/upload`; push `{ name, url, ... }` into `class_sessions.attachments` jsonb array.

## Out of scope until decided

- Polymorphic `lectures` table (rejected — use existing)
- Course-level / class-level multi-lecture lists without schema support
- Inherit/copy across scopes

## Testing

- TEA PATCH session lecture fields; AO/STU PATCH → 403
- Enrolled STU GET lecture → 200; non-enrolled → 403
- Types include new columns; `tsc --noEmit` clean
- Quiz CRUD smoke when phase 1b included

## Architecture sketch

```
UI (TabSchedule lecture form)
    ↓
existing / extended session API
    ↓
class_session.service
    ↓
Supabase class_sessions (content, body_json, attachments, has_content, has_quiz)

UI (quiz) ──► quizzes / quiz_attempts
```

## Open question (need answer before planning)

**Khóa học / lớp học “bài giảng riêng”:** remote DB không có bảng/cột cho nhiều bài ở cấp course/class.

A. **Phase 1 chỉ buổi học** (+ quiz trên `quizzes`) — course/class bỏ tạm  
B. **Dùng `courses.description`** làm “bài” khóa (1 text, không file list)  
C. **Vẫn cần nhiều bài ở course/class** → phải thêm migration (mâu thuẫn “chỉ bảng sẵn có”)

## Changelog vs first approved draft

- Removed proposed `lectures` + `lecture_attachments`
- Mapped session lectures → `class_sessions` columns already on remote
- Mapped quiz → `quizzes` + `quiz_attempts`
- Marked course/class multi-lecture as blocked on schema
