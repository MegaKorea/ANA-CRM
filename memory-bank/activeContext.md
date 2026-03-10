# Active Context

## Trọng tâm hiện tại

- Quét toàn bộ `app/` để:
  - Refactor/clean code
  - Tối ưu Ant Design usage
  - Tăng tái sử dụng (shared components/utils)
  - Tối ưu hiệu năng (giảm re-render, giảm waterfall, tối ưu bundle)

## Các file đang có thay đổi (git status lúc bắt đầu)

- `app/class/[id]/components/TabBasicInfo.tsx`
- `app/class/[id]/components/TabSchedule.tsx`
- `app/class/[id]/page.tsx`
- `app/class/page.tsx`
- `lib/services/class.service.ts`

## Next steps

- Tiếp tục refactor theo cụm, ưu tiên:
  - Chuẩn hoá formatter/parser cho `InputNumber` (money) để dùng lại giữa `course`, `lead`, các form khác.
  - Chuẩn hoá error handling: nơi dùng `fetch('/api/*')` dùng `fetchJson`, nơi dùng axios tiếp tục dùng `lib/axios`.
  - Tách modal/drawer nặng bằng `next/dynamic` cho các trang list lớn để giảm bundle.

