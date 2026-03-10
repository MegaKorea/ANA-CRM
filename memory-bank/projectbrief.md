# Project Brief (ANA-CRM)

## Mục tiêu

- **Tối ưu & clean code** cho frontend (Next.js + React + Ant Design), ưu tiên các phần trong `app/`.
- **Tái sử dụng**: gom các pattern trùng lặp (form/table/modal/upload, mapping enum, format date/money, fetch) thành utilities/components.
- **Hiệu năng**: giảm re-render, tránh waterfall data fetching, tối ưu bundle và client boundaries.

## Phạm vi

- Thư mục chính: `app/` (Next.js App Router).
- Phần liên quan: `components/`, `lib/` (services), và các shared utilities khi cần.

## Nguyên tắc

- Ưu tiên thay đổi **an toàn**: giữ nguyên hành vi UI/business logic, refactor theo từng cụm nhỏ có thể review.
- Theo best-practices của Next.js/React (Vercel): giảm waterfalls, tối ưu boundary server/client, hạn chế props serialization, tránh import nặng.

## Trạng thái

- Memory Bank vừa được tạo lần đầu; nội dung chi tiết sẽ được cập nhật sau khi quét codebase.

