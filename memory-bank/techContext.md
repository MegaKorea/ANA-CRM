# Tech Context (ANA-CRM)

## Stack (tạm thời)

- Next.js (App Router) `16.1.4`
- React `19.2.3` + TypeScript `^5`
- Ant Design (antd) `^6.2.1` + `@ant-design/icons`
- State/Data:
  - TanStack React Query `^5`
  - Zustand `^5`
- Backend/Auth:
  - Supabase (`@supabase/supabase-js`, auth helpers)
- HTTP:
  - Axios (wrapper tại `lib/axios/index.ts`)
  - `fetch` cho một số Next API routes (đã chuẩn hoá qua `lib/utils/fetchJson.ts`)

## Thư mục liên quan

- `app/`: route/pages/components theo App Router
- `components/`: shared UI components
- `lib/services/`: service gọi API

## Ràng buộc/kỳ vọng

- Refactor ưu tiên **không đổi hành vi**.
- Tối ưu hiệu năng theo best practices của Vercel/Next.js.

## Cần cập nhật

- Phiên bản framework/libs (đã lấy từ `package.json`)
- Quy ước lint/format/test và scripts (sau khi quét repo)

