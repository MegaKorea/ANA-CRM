# Lecture TipTap Editor Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace lecture create/edit modal with a WordPress-style TipTap page; inline images upload to CDN and their URLs persist in lecture `html` + `attachments` inside `body_json` (database).

**Architecture:** Two thin Next.js App Router pages share `LectureEditorPage`. TipTap runs client-only (`dynamic` + `ssr: false`). Save uses existing `useCreateSessionLecture` / `useUpdateSessionLecture`. Image bytes never go to Postgres—only URLs in JSON.

**Tech Stack:** Next.js 16, React 19, Ant Design 6, TipTap (`@tiptap/react`, starter-kit, link, text-align, image), existing `/api/upload` + lecture APIs.

## Global Constraints

- Routes: `/class/[classId]/sessions/[sessionId]/lectures/new` and `.../lectures/[lectureId]/edit`
- View remains `LectureDetailModal` (must render HTML safely, not plain text)
- No new Supabase tables; no image binary / base64 in DB
- Do not dump styles into `tab-schedule.module.scss` — use `lecture-editor.module.scss`
- Reuse `uploadSessionImage`, `getErrorMessage`, lecture validators
- Auth same as lecture write today
- After save: `/class/[classId]?tab=schedule` (+ preserve `date` if passed via query when navigating from schedule)

---

## File map

| File | Responsibility |
|------|----------------|
| `package.json` | TipTap deps |
| `lib/utils/lecture-html-attachments.ts` | Sync `<img src>` URLs ↔ `attachments[]` |
| `app/class/[id]/components/LectureTiptapEditor.tsx` | TipTap + toolbar + Add Media |
| `app/class/[id]/components/LectureEditorPage.tsx` | Layout, title, links, sidebar save |
| `app/class/[id]/components/lecture-editor.module.scss` | WP-like layout |
| `app/class/[id]/sessions/[sessionId]/lectures/new/page.tsx` | Create route |
| `app/class/[id]/sessions/[sessionId]/lectures/[lectureId]/edit/page.tsx` | Edit route |
| `SessionLecturesPanel.tsx` | Navigate to routes; remove edit modal |
| `LectureDetailModal.tsx` | Render `html` as HTML + images |

---

### Task 1: Install TipTap + HTML↔attachments helper

**Files:**
- Modify: `package.json` (via npm)
- Create: `lib/utils/lecture-html-attachments.ts`

**Interfaces:**
- Produces:
  - `collectImageAttachmentsFromHtml(html: string, existing?: SessionLectureAttachment[]): SessionLectureAttachment[]`
  - Merges `img[src]` from HTML with existing attachment metadata when URLs match

- [ ] **Step 1: Install packages**

```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-text-align @tiptap/extension-image
```

Expected: packages listed in `package.json` dependencies.

- [ ] **Step 2: Add helper**

Create `lib/utils/lecture-html-attachments.ts`:

```typescript
import type { SessionLectureAttachment } from '@/lib/types/session-lecture';

const IMG_SRC_RE = /<img[^>]+src=["']([^"']+)["']/gi;

export function extractImageUrlsFromHtml(html: string): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  const re = new RegExp(IMG_SRC_RE.source, 'gi');
  while ((match = re.exec(html)) !== null) {
    const url = match[1]?.trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
  }
  return urls;
}

export function collectImageAttachmentsFromHtml(
  html: string,
  existing: SessionLectureAttachment[] = [],
): SessionLectureAttachment[] {
  const byUrl = new Map(existing.map((a) => [a.url, a]));
  return extractImageUrlsFromHtml(html).map((url) => {
    const prev = byUrl.get(url);
    if (prev) return prev;
    const name = url.split('/').pop() || 'image';
    return { name, url, mime_type: null, size: null };
  });
}
```

- [ ] **Step 3: Smoke-check helper in Node**

```bash
npx --yes tsx -e "const { extractImageUrlsFromHtml } = require('./lib/utils/lecture-html-attachments.ts'); console.log(extractImageUrlsFromHtml('<p>x</p><img src=\"https://cdn.example/a.png\" />'))"
```

Expected: prints `[ 'https://cdn.example/a.png' ]` (or equivalent). If `tsx` fails on path aliases, run a one-off assert after TypeScript project compile instead:

```bash
npx tsc --noEmit
```

Expected: no errors from the new file.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json lib/utils/lecture-html-attachments.ts
git commit -m "chore: add TipTap deps and lecture image URL helper"
```

---

### Task 2: `LectureTiptapEditor` (toolbar + Add Media upload)

**Files:**
- Create: `app/class/[id]/components/LectureTiptapEditor.tsx`
- Create: `app/class/[id]/components/lecture-editor.module.scss` (editor + toolbar section first)

**Interfaces:**
- Consumes: `uploadSessionImage`, reject helpers, `getErrorMessage`
- Produces: `<LectureTiptapEditor value={string} onChange={(html: string) => void} onImageUploaded?: (file: UploadedImage) => void } disabled?: boolean />`

- [ ] **Step 1: Implement editor component**

`LectureTiptapEditor.tsx`:

```tsx
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import { Button, Space, Upload, message } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  StrikethroughOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  LinkOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import { useEffect, useRef } from 'react';
import {
  getImageUploadRejectMessage,
  getImageUploadRejectReason,
  uploadSessionImage,
  type UploadedImage,
} from '@/lib/utils/upload-session-image';
import { getErrorMessage } from '@/lib/utils/get-error-message';
import styles from './lecture-editor.module.scss';

type Props = {
  value: string;
  onChange: (html: string) => void;
  onImageUploaded?: (file: UploadedImage) => void;
  disabled?: boolean;
};

export function LectureTiptapEditor({ value, onChange, onImageUploaded, disabled }: Props) {
  const skipEmit = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ inline: false, allowBase64: false }),
    ],
    content: value || '',
    editable: !disabled,
    onUpdate: ({ editor: ed }) => {
      if (skipEmit.current) return;
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      skipEmit.current = true;
      editor.commands.setContent(value || '', { emitUpdate: false });
      skipEmit.current = false;
    }
  }, [value, editor]);

  const insertImage = async (file: File) => {
    const reason = getImageUploadRejectReason(file);
    if (reason) {
      message.error(getImageUploadRejectMessage(reason));
      return Upload.LIST_IGNORE;
    }
    try {
      const uploaded = await uploadSessionImage(file);
      editor?.chain().focus().setImage({ src: uploaded.url, alt: uploaded.name }).run();
      onImageUploaded?.(uploaded);
      onChange(editor?.getHTML() ?? '');
    } catch (error: unknown) {
      message.error(getErrorMessage(error, 'Tải ảnh thất bại'));
    }
    return false;
  };

  if (!editor) return null;

  return (
    <div className={styles.tiptapShell}>
      <div className={styles.tiptapToolbar}>
        <Space wrap size={4}>
          <Upload
            accept="image/*"
            showUploadList={false}
            beforeUpload={(file) => {
              void insertImage(file);
              return false;
            }}
            disabled={disabled}
          >
            <Button size="small" icon={<PictureOutlined />} disabled={disabled}>
              Add Media
            </Button>
          </Upload>
          <Button size="small" icon={<BoldOutlined />} disabled={disabled}
            type={editor.isActive('bold') ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().toggleBold().run()} />
          <Button size="small" icon={<ItalicOutlined />} disabled={disabled}
            type={editor.isActive('italic') ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().toggleItalic().run()} />
          <Button size="small" icon={<StrikethroughOutlined />} disabled={disabled}
            type={editor.isActive('strike') ? 'primary' : 'default'}
            onClick={() => editor.chain().focus().toggleStrike().run()} />
          <Button size="small" icon={<UnorderedListOutlined />} disabled={disabled}
            onClick={() => editor.chain().focus().toggleBulletList().run()} />
          <Button size="small" icon={<OrderedListOutlined />} disabled={disabled}
            onClick={() => editor.chain().focus().toggleOrderedList().run()} />
          <Button size="small" disabled={disabled}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            H2
          </Button>
          <Button size="small" icon={<AlignLeftOutlined />} disabled={disabled}
            onClick={() => editor.chain().focus().setTextAlign('left').run()} />
          <Button size="small" icon={<AlignCenterOutlined />} disabled={disabled}
            onClick={() => editor.chain().focus().setTextAlign('center').run()} />
          <Button size="small" icon={<LinkOutlined />} disabled={disabled}
            onClick={() => {
              const url = window.prompt('URL liên kết');
              if (!url) return;
              editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
            }} />
        </Space>
      </div>
      <EditorContent editor={editor} className={styles.tiptapContent} />
    </div>
  );
}
```

Add matching SCSS for `.tiptapShell`, `.tiptapToolbar`, `.tiptapContent` (min-height ~280px, border, white background).

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: PASS (or only pre-existing unrelated errors).

- [ ] **Step 3: Commit**

```bash
git add app/class/[id]/components/LectureTiptapEditor.tsx app/class/[id]/components/lecture-editor.module.scss
git commit -m "feat: add TipTap lecture editor with Add Media upload"
```

---

### Task 3: Shared `LectureEditorPage` (WP two-column layout)

**Files:**
- Create: `app/class/[id]/components/LectureEditorPage.tsx`
- Modify: `app/class/[id]/components/lecture-editor.module.scss`

**Interfaces:**
- Consumes: create/update hooks, `useSessionLectures`, `useClass`, `collectImageAttachmentsFromHtml`, `LectureTiptapEditor`
- Produces: `<LectureEditorPage mode="create" | "edit" classId lectureId? sessionId />`

- [ ] **Step 1: Implement page shell**

Key behaviors:
- State: `title`, `html`, `links`, `attachments` (UploadedImage / SessionLectureAttachment)
- On image uploaded: append to `attachments` if URL not present
- On save: `attachments = collectImageAttachmentsFromHtml(html, attachments)` then mutate
- Dynamic import TipTap:

```tsx
const LectureTiptapEditor = dynamic(
  () => import('./LectureTiptapEditor').then((m) => m.LectureTiptapEditor),
  { ssr: false, loading: () => <Spin /> },
);
```

- Layout classes: `.editorLayout` (grid 1fr 280px), `.editorMain`, `.editorSidebar`, `.titleInput`
- Sidebar: class name, session date (from `useClassSessions` find session), primary Save, default Cancel
- Cancel / success navigate:

```tsx
router.push(`/class/${classId}?tab=schedule${date ? `&date=${date}` : ''}`);
```

Read optional `date` from `useSearchParams()`.

- Edit mode: load lecture from `useSessionLectures(sessionId)`; if missing after load → Result 404
- Title required before save; use `getErrorMessage` on failure

Links UI: Form.List or simple Ant Form fields (label + url) like current modal — keep `assertAllowedHttpUrl` / existing validator on submit via API.

- [ ] **Step 2: `tsc --noEmit`**

Expected: PASS for new files.

- [ ] **Step 3: Commit**

```bash
git add app/class/[id]/components/LectureEditorPage.tsx app/class/[id]/components/lecture-editor.module.scss
git commit -m "feat: add WordPress-style lecture editor page shell"
```

---

### Task 4: App Router pages (new + edit)

**Files:**
- Create: `app/class/[id]/sessions/[sessionId]/lectures/new/page.tsx`
- Create: `app/class/[id]/sessions/[sessionId]/lectures/[lectureId]/edit/page.tsx`

- [ ] **Step 1: Create pages**

`new/page.tsx`:

```tsx
'use client';

import { useParams } from 'next/navigation';
import { LectureEditorPage } from '@/app/class/[id]/components/LectureEditorPage';

export default function NewLecturePage() {
  const params = useParams();
  const classId = params.id as string;
  const sessionId = params.sessionId as string;
  return <LectureEditorPage mode="create" classId={classId} sessionId={sessionId} />;
}
```

`edit/page.tsx`: same with `mode="edit"` and `lectureId={params.lectureId as string}`.

Note: folder param for class is `[id]` matching existing `app/class/[id]`.

- [ ] **Step 2: Open routes in browser (manual)**

- `/class/<id>/sessions/<sessionId>/lectures/new` should render editor (auth required)
- Invalid edit id shows empty/404 state

- [ ] **Step 3: Commit**

```bash
git add "app/class/[id]/sessions"
git commit -m "feat: add lecture create and edit routes"
```

---

### Task 5: Wire `SessionLecturesPanel` + fix viewer HTML

**Files:**
- Modify: `app/class/[id]/components/SessionLecturesPanel.tsx`
- Modify: `app/class/[id]/components/LectureDetailModal.tsx`
- Modify: `app/class/[id]/components/tab-schedule.module.scss` (detail content styles for HTML: headings, img max-width)

- [ ] **Step 1: Panel navigation**

Replace `openCreate` / `openEdit` modal with:

```tsx
const router = useRouter();
const searchParams = useSearchParams();
const date = searchParams.get('date');

const goCreate = () => {
  if (!sessionId) return;
  const q = date ? `?date=${encodeURIComponent(date)}` : '';
  router.push(`/class/${classId}/sessions/${sessionId}/lectures/new${q}`);
};

const goEdit = (lectureId: string) => {
  if (!sessionId) return;
  const q = date ? `?date=${encodeURIComponent(date)}` : '';
  router.push(`/class/${classId}/sessions/${sessionId}/lectures/${lectureId}/edit${q}`);
};
```

Remove create/edit `Modal` + related form state (`modalOpen`, `editing`, form submit for create/edit). Keep delete + `LectureDetailModal` view.

- [ ] **Step 2: Render HTML in detail modal**

Replace text node with sanitized-ish render. Prefer DOMPurify if already in project; if not, phase-1 use:

```tsx
<div
  className={styles.lectureDetailContent}
  dangerouslySetInnerHTML={{ __html: lecture.html }}
/>
```

Only after confirming content is always staff-authored via authenticated API. Add CSS:

```scss
.lectureDetailContent {
  img { max-width: 100%; height: auto; border-radius: 8px; }
  p { margin: 0 0 0.75rem; }
}
```

If team requires sanitize package, add `isomorphic-dompurify` and wrap `DOMPurify.sanitize(lecture.html)` before set.

- [ ] **Step 3: Manual QA**

1. Thêm bài → editor page → Add Media → save → list shows lecture  
2. Reload → edit → image still in editor  
3. STU/view modal shows formatted HTML + images  
4. Links still work  

- [ ] **Step 4: Commit**

```bash
git add app/class/[id]/components/SessionLecturesPanel.tsx app/class/[id]/components/LectureDetailModal.tsx app/class/[id]/components/tab-schedule.module.scss
git commit -m "feat: open TipTap lecture pages from schedule and render HTML in viewer"
```

---

### Task 6: Spec sync commit

**Files:**
- Modify: `docs/superpowers/specs/2026-07-31-lecture-tiptap-editor-page-design.md` (already amended for inline images)

- [ ] **Step 1: Commit spec amendment if dirty**

```bash
git add docs/superpowers/specs/2026-07-31-lecture-tiptap-editor-page-design.md
git commit -m "docs: require TipTap inline images with URLs stored in body_json"
```

---

## Spec coverage checklist

| Spec item | Task |
|-----------|------|
| Create/edit routes | 4 |
| WP two-column layout | 3 |
| TipTap MVP toolbar | 2 |
| Add Media → CDN → URL in DB | 2 + 3 (`collectImageAttachmentsFromHtml`) |
| Links below editor | 3 |
| Sidebar save/cancel | 3 |
| Panel navigates; no edit modal | 5 |
| View modal shows HTML | 5 |
| No new tables / no binary in DB | 1–3 |

## Placeholder scan

No TBD/TODO left in tasks; commands and code blocks are concrete.
