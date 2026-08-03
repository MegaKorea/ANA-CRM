import { Button, Tooltip } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import type { Lead } from '@/lib/services/lead.service';
import { getSmaxThreadUrl } from '@/app/lead/constants';
import { openInNewTab } from '@/lib/utils/openInNewTab';

interface SmaxThreadButtonProps {
  lead: Lead;
  stopPropagation?: boolean;
}

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
