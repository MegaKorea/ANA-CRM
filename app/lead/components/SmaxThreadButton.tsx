import { Button, Tooltip } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import type { Lead } from '@/lib/services/lead.service';
import { getSmaxThreadUrl } from '@/app/lead/constants';
import { openInNewTab } from '@/lib/utils/openInNewTab';

interface SmaxThreadButtonProps {
  lead: Lead;
  /** Chặn sự kiện click nổi bọt (dùng khi đặt trong Card có onClick, ví dụ mobile). */
  stopPropagation?: boolean;
}

/**
 * Nút mở hội thoại Smax (thread_url) ở tab mới.
 * Trả về `null` nếu lead không có thread_url hợp lệ — dùng chung cho bảng desktop và card mobile.
 */
export function SmaxThreadButton({ lead, stopPropagation }: SmaxThreadButtonProps) {
  const threadUrl = getSmaxThreadUrl(lead.smax_log);
  if (!threadUrl) {
    return null;
  }

  return (
    <Tooltip title="Mở hội thoại Smax">
      <Button
        size="small"
        type="text"
        icon={<MessageOutlined style={{ fontSize: 15, color: 'var(--accent-600)' }} />}
        onClick={(e) => {
          if (stopPropagation) {
            e.stopPropagation();
          }
          openInNewTab(threadUrl);
        }}
      />
    </Tooltip>
  );
}
