# Lecture Tiptap Editor Page — Design

**Date:** 2026-07-31  
**Status:** Approved — includes inline TipTap images (URL in DB via `body_json`)  
**Related:** `2026-07-30-create-lectures-design.md` (session lectures in `body_json`)
## Goal

Replace the create/edit lecture **modal** with a dedicated **WordPress-style editor page** using **Tiptap**, while keeping student/teacher **view** in the existing detail modal.

## Decisions (locked)

| Topic | Choice |
|-------|--------|
| Scope | Create + edit on page; view stays `LectureDetailModal` |
| Routes | Nested under class + session |
| Toolbar | MVP + **Add Media (inline image)**: bold, italic, strike, lists, heading, link, text align, insert image; Visual only (no HTML tab) |
| Attachments / links | Links below editor (left); optional attachment list mirrors uploaded images; sidebar = save/cancel + session meta |
| Images | Upload file → CDN/storage (existing `uploadSessionImage`); **URL persisted in DB** inside lecture `html` (`<img src="...">`) and synced into `attachments[]` in `body_json` — **not** binary blobs in Postgres |
| Storage | Keep `html` string via Tiptap `getHTML()`; no TipTap JSON schema / no new tables |
| Approach | New Next.js pages + existing lecture APIs/hooks + TipTap Image extension |

## Non-goals (phase 1)

- Student read-only full page
- Visual/Text HTML toggle
- Tables, video embed, color picker, full kitchen-sink
- Storing image **bytes** in Postgres / base64 in `body_json`
- Changing lecture API contracts beyond accepting richer HTML
- Autosave / drafts beyond existing API

## Routes

| Mode | Path |
|------|------|
| Create | `/class/[classId]/sessions/[sessionId]/lectures/new` |
| Edit | `/class/[classId]/sessions/[sessionId]/lectures/[lectureId]/edit` |

After successful save: navigate back to  
`/class/[classId]?tab=schedule` (preserve `date` query if present when leaving the schedule).

Auth: same as lecture write today (staff / assigned teacher); unauthorized → 403 / redirect.

## Layout

Inspired by classic WP “Edit Post” (two columns).

### Desktop

```
┌─────────────────────────────────────────────────────────────┐
│ Breadcrumb: Lớp → Lịch → Bài giảng (Tạo / Sửa)              │
├──────────────────────────────────────────┬──────────────────┤
│ LEFT (~70%)                              │ RIGHT (~30%)     │
│  Title input (large)                     │ Session meta     │
│  [Add Media] + Tiptap toolbar + body     │  (class, date)   │
│  Links block (label + url list)          │ [Lưu/Cập nhật]   │
│                                          │ [Hủy]            │
└──────────────────────────────────────────┴──────────────────┘
```

### Images → database

1. User picks image (toolbar **Add Media** or paste).
2. Client uploads via `/api/upload` (`uploadSessionImage`) → CDN returns `url`.
3. TipTap inserts `<img src="{url}">` into the document.
4. On save, lecture row in `body_json.lectures[]` stores:
   - `html` containing those `<img>` tags (URLs)
   - `attachments[]` entries for each uploaded image URL (name, url, mime, size) so list/meta stays queryable
5. **Binary file stays on CDN**; Postgres only stores JSON with URLs (same pattern as today).

### Mobile

- Single column: title → editor → links → actions
- Primary save control sticky (top or bottom) for reachability

## Data model (unchanged)

`SessionLecture`:

- `title: string`
- `html: string` ← Tiptap HTML output
- `links: { label, url }[]`
- `attachments: { name, url, mime_type?, size? }[]`
- `sort_order`, `id`, `updated_at`

Reuse:

- `POST/PATCH` session lecture routes
- `useCreateSessionLecture` / `useUpdateSessionLecture`
- `uploadSessionImage` for attachment uploads

## UI behavior

### From schedule panel (`SessionLecturesPanel`)

- **Thêm** → `router.push(.../lectures/new)`
- **Sửa** → `router.push(.../lectures/[id]/edit)`
- Remove create/edit modal from panel
- Keep list + delete + open view modal

### Editor page

- Create: empty title/html/attachments/links
- Edit: load lecture by id from session lectures query; 404 empty if missing
- **Lưu / Cập nhật**: validate title (required); mutate; toast; navigate back
- **Hủy**: navigate back without save (no confirm in phase 1 unless dirty-state is cheap)
- Loading: use shared `ScheduleLoading` / Spin pattern already in class module

### Viewer

- `LectureDetailModal` continues to render `html` (ensure safe rendering — text/HTML policy as today; no new `dangerouslySetInnerHTML` without existing sanitize path)

## Tech stack

- `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-text-align`, `@tiptap/extension-image`
- Client-only editor via `next/dynamic` `{ ssr: false }`
- Styles: dedicated `lecture-editor.module.scss` (do not dump into `tab-schedule.module.scss`)
- Ant Design for form chrome / buttons; TipTap for body + Add Media
- Image upload: reuse `uploadSessionImage` + reject helpers

## File plan (implementation)

| Path | Role |
|------|------|
| `app/class/[id]/sessions/[sessionId]/lectures/new/page.tsx` | Create page shell |
| `app/class/[id]/sessions/[sessionId]/lectures/[lectureId]/edit/page.tsx` | Edit page shell |
| `app/class/[id]/components/LectureEditorPage.tsx` (or under `lectures/`) | Shared editor UI |
| `app/class/[id]/components/LectureTiptapEditor.tsx` | Tiptap + toolbar |
| `app/class/[id]/components/lecture-editor.module.scss` | Layout + editor chrome |
| `SessionLecturesPanel.tsx` | Navigate instead of modal edit |

Optional thin wrappers if create/edit pages stay &lt;20 lines each.

## Security / quality notes

- Persist only through existing authenticated lecture APIs
- Link URLs: keep `assertAllowedHttpUrl` / validator rules for `links[]`
- Do not expand HTML allowlist casually; prefer StarterKit defaults
- Exclude secrets / `.next` / sensitive `push.service` from unrelated commits

## Success criteria

1. Staff can create a lecture on the new page and see it in the session list
2. Staff can edit an existing lecture on the edit route; content round-trips as HTML
3. Students still open lectures in the detail modal (read-only)
4. Inline images upload to CDN; URLs appear in saved `html` and `attachments` in DB
5. External links block still works
6. No new Supabase tables; no image binary in Postgres

## Out of scope follow-ups

- Autosave
- Visual/HTML toggle
- Full-page student reader
- Image resize UI / captions
