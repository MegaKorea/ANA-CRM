# System Patterns (ANA-CRM)

## Kiến trúc tổng quan (tạm thời)

- Next.js App Router: các route trong `app/`.
- UI dùng Ant Design (antd).
- Logic gọi API/service nằm trong `lib/services/` (dựa trên repo hiện có).

## Pattern cần chuẩn hoá (mục tiêu refactor)

- **Data fetching**: tránh waterfalls; nơi nào cần client fetching thì chuẩn hoá (SWR/React Query nếu có, hoặc wrapper fetch).
- **Ant Design**:
  - Chuẩn hoá Form layout, validation, `Form.useForm`, và mapping `initialValues`.
  - Chuẩn hoá Table: pagination/sort/filter, column render, `rowKey`, memo hoá columns khi phù hợp.
  - Chuẩn hoá Modal/Drawer: open/close state, confirm loading, destroyOnClose khi cần.
- **Select (antd)**:
  - Ưu tiên dùng `options` + `optionFilterProp="label"` thay vì `Select.Option`/`Option` + `option.children` (typed tốt hơn, ít JSX hơn).
- **State & re-render**: tách component nặng, dùng memo/useMemo/useCallback đúng chỗ, tránh inline object/function props gây render lại.
- **Utilities**: format date/time, currency, parse/query params, mapping enums/status.
- **Bundle (client)**:
  - Tách Modal/Drawer nặng bằng `next/dynamic` để giảm JS bundle ban đầu của trang list.

## Pattern đã áp dụng

- **Class status**: dùng chung `lib/constants/classStatus.ts` (label/color/options + normalize) thay vì lặp map ở nhiều file.
- **Fetch internal API**: dùng `lib/utils/fetchJson.ts` để parse lỗi nhất quán (message/status/data) cho các hook dùng `/api/*`.
- **Form cancel/revert**: khi cần “Hủy bỏ” quay về dữ liệu ban đầu, dùng `form.setFieldsValue(initialValues)` thay vì `resetFields()` trong tình huống `initialValues` không được remount.
- **Number/currency formatting**:
  - Dùng `lib/utils/numberFormat.ts` cho `InputNumber` (formatter/parser integer) và format hiển thị theo `vi-VN`.
- **Dynamic modals**:
  - `app/class/page.tsx`, `app/course/page.tsx`, `app/lead/page.tsx`, `app/admin/user/page.tsx`, `app/admin/user/role/page.tsx` đã chuyển modal/drawer sang `next/dynamic`.

## Cần bổ sung sau khi quét

- Boundary server/client component, cấu trúc layout, middleware/auth, error handling.

