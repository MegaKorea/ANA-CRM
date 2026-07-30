# Create Lectures — Design Spec

**Date:** 2026-07-30  
**Branch:** `feat/create-lectures`  
**Status:** Approved for planning

## Goal

Enable teachers (TEA) to create and manage lecture content at three independent scopes: course, class, and class session. Staff and enrolled students can view; only TEA can create/update/delete. Quiz linking is out of scope for phase 1.

## Requirements (confirmed)

| Topic | Decision |
|-------|----------|
| Scopes | Course, class, session — **independent** (no inherit/copy) |
| Cardinality | **Many lectures** per scope at all three levels |
| Content | Title + rich text + external links + file attachments |
| Write roles | **TEA only** |
| Read roles | Staff with LMS access + STU who can access the related course/class |
| Approach | Single polymorphic `lectures` table + shared UI |

## Data model

### Table `lectures`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `scope_type` | text | `course` \| `class` \| `session` |
| `scope_id` | text/uuid | Matches `courses.id`, `classes.id`, or `class_sessions.id` |
| `title` | text | Required |
| `content` | text | Nullable; HTML or plain/markdown (phase 1: textarea / light markdown) |
| `links` | jsonb | Array of `{ label: string, url: string }`, default `[]` |
| `sort_order` | int | Default 0; simple ordering |
| `created_by` | uuid | FK → `users.id` (author TEA) |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

Indexes: `(scope_type, scope_id, sort_order)`.

Application-level validation that `scope_id` exists for the given `scope_type` (no polymorphic DB FK).

### Table `lecture_attachments`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `lecture_id` | uuid FK → lectures | ON DELETE CASCADE |
| `name` | text | Display filename |
| `url` | text | CDN URL from existing upload |
| `mime_type` | text | Nullable |
| `size` | int | Nullable (bytes) |
| `sort_order` | int | Default 0 |
| `created_at` | timestamptz | |

## API

| Method | Path | Authz |
|--------|------|-------|
| GET | `/api/lectures?scope_type=&scope_id=` | Logged-in; viewer must pass scope access check |
| POST | `/api/lectures` | TEA only |
| GET | `/api/lectures/[id]` | Same as list for that lecture’s scope |
| PATCH | `/api/lectures/[id]` | TEA only |
| DELETE | `/api/lectures/[id]` | TEA only |

### Request / response shape (conceptual)

**Create body:** `{ scope_type, scope_id, title, content?, links?, attachments?: [{ name, url, mime_type?, size? }], sort_order? }`

**List item:** lecture fields + `attachments[]` + optional author display name.

### Authorization details

**Write:** role code `TEA`. Phase 1 does **not** restrict TEA to classes they teach (`subject_teachers`); can tighten later.

**Read — by scope:**

- `class`: reuse `resolveClassViewer` (staff OK; STU must be enrolled).
- `session`: resolve session → `class_id`, then same class viewer check.
- `course`: staff OK if authenticated for LMS; STU only if enrolled in at least one class of that course (or equivalent existing course-access rule if present).

### Errors

- 401 unauthenticated
- 403 not enrolled / not TEA on write
- 404 missing scope or lecture
- 400 validation (empty title, invalid URL in links, invalid `scope_type`)

Follow existing `AppError` / `fail` / `handleRouteError` patterns.

## Services & hooks

- `lib/services/lecture.service.ts` — CRUD + attachment sync
- `lib/services/lecture_access.service.ts` (or extend class/course access helpers) — scope viewer resolution
- `lib/validators/lecture.validator.ts`
- `lib/hooks/use-lectures.ts` — React Query list/mutations keyed by `[scope_type, scope_id]`
- Types under `lib/supabase/types/tables/`

## UI

### Shared `LecturePanel`

Props: `scopeType`, `scopeId`, `canEdit` (true for TEA).

- List lectures (title, content preview, attachment/link counts)
- Detail: content, links, download/open attachments
- TEA: create/edit modal (title, content textarea, link list editor, file upload), delete confirm
- Non-TEA: read-only

### Placement

1. **Course** (`/course`): drawer (or modal) “Bài giảng” from course list row/actions
2. **Class** (`/class/[id]`): new tab **Bài giảng** alongside basic_info / teachers / students / schedule
3. **Session** (`TabSchedule`): from session detail → “Bài giảng buổi này” opening `LecturePanel` with `scope=session`

### Upload

Reuse `POST /api/upload` (CDN `cfig.ibytecdn.org`). Store returned URL on `lecture_attachments`. Phase 1 accepts types/sizes the CDN already allows (images today; extend upload API if PDF/video needed — note as implementation task if current endpoint is image-only).

## Out of scope (phase 1)

- Quiz create / attach
- Inherit or copy lectures across scopes
- Advanced rich-text editor / drag-and-drop reorder
- Restrict TEA write to assigned classes only
- Dedicated course detail page (unless already exists; MVP uses drawer from list)

## Testing

- API: TEA CRUD success; AO/STU write → 403; STU not enrolled → 403; staff/enrolled STU list → 200
- UI smoke: class tab, course drawer, session modal
- `tsc --noEmit` clean

## Architecture sketch

```
UI LecturePanel
    ↓ React Query
/api/lectures[+id]
    ↓
lecture.service + lecture_access
    ↓
Supabase: lectures, lecture_attachments
```

## Open implementation notes

1. Confirm whether `/api/upload` must be extended beyond images for PDF/docs.
2. SQL migration goes under `lib/supabase/migrations/` (same pattern as existing class/course migrations).
3. Course-level STU access: implement via “enrolled in any class of course” unless a stronger rule already exists.
