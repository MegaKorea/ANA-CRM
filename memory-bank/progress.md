# Progress

## Đã có

- Tạo bộ Memory Bank core files để theo dõi bối cảnh dự án và tiến độ refactor.
- Refactor/tối ưu một số cụm trong `app/`:
  - Module `class`: tách constants status, debounce filter, memo hoá `columns`, chuẩn hoá `Select` sang `options`, fix “Hủy bỏ” trong `TabBasicInfo`.
  - Module `course`: chuẩn hoá `Select` level sang `options`.
  - Module `lead`: loại bỏ `Select.Option` cho năm sinh, dùng `options` tĩnh.
- Chuẩn hoá hook fetch internal API: thêm `lib/utils/fetchJson.ts` và áp dụng cho `use-classes`, `use-courses`.
- Loại bỏ `@ts-ignore` trong `class.service.ts` và `course.service.ts` (thay bằng cast an toàn tối thiểu).
- Chuẩn hoá format số/tiền:
  - Thêm `lib/utils/numberFormat.ts` và áp dụng cho `InputNumber` (lead/course) + `Statistic` (dashboard) + hiển thị amount (lead table).
- Tối ưu bundle trang list:
  - Tách Modal/Drawer nặng bằng `next/dynamic` ở các trang `class`, `course`, `lead`, `admin/user`, `admin/user/role`.
- Loại bỏ xung đột route root:
  - Xoá `app/page.tsx` để tránh trùng route với `app/(dashboard)/page.tsx`.
- Refactor `DebouncedInput`:
  - Bỏ phụ thuộc `lodash/debounce`, dùng `setTimeout` thuần để giảm bundle.

## Đang làm

- Tiếp tục mở rộng refactor theo cụm (ưu tiên nơi có trùng lặp/điểm nóng hiệu năng).

## Kế tiếp

- Mở rộng chuẩn hoá:
  - Shared utilities cho format number/currency và InputNumber formatter/parser.
  - Chuẩn hoá error handling cho toàn bộ hooks/service (nếu còn chỗ throw message chung chung).

