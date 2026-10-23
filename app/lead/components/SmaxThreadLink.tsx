import { Typography } from 'antd';
import type { CSSProperties } from 'react';
import type { Lead } from '@/lib/services/lead.service';
import { getSmaxThreadUrl } from '@/app/lead/constants/lead-helpers';

interface SmaxThreadLinkProps {
  lead: Lead;
  strong?: boolean;
  style?: CSSProperties;
}

/**
 * The lead's name, linking to its Smax conversation when it has one and plain
 * text otherwise.
 */
export function SmaxThreadLink({ lead, strong, style }: SmaxThreadLinkProps) {
  const threadUrl = getSmaxThreadUrl(lead.smax_log);
  if (!threadUrl) {
    return (
      <Typography.Text strong={strong} style={style}>
        {lead.full_name}
      </Typography.Text>
    );
  }

  return (
    <Typography.Link
      href={threadUrl}
      target="_blank"
      rel="noopener noreferrer"
      strong={strong}
      style={style}
      title="Mở hội thoại Smax"
      onClick={(e) => e.stopPropagation()}
    >
      {lead.full_name}
    </Typography.Link>
  );
}
