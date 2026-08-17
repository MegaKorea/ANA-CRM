'use client';

import { Alert, Card, Empty, Skeleton, Typography } from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { SiInstagram } from 'react-icons/si';
import Image from 'next/image';
import { memo, type ReactNode } from 'react';
import { percentChange } from '@/lib/utils/lead-funnel';
import { useSmaxMessagingPerformance } from '@/lib/hooks/use-smax-messaging-performance';
import type { SmaxPlatformPerformance } from '@/lib/smax/types';
import styles from './ReportsMessagingPerformance.module.css';

const { Title, Text } = Typography;

type PlatformStyle = { color: string; icon?: ReactNode; imgSrc?: string };

const PLATFORM_STYLE: Record<string, PlatformStyle> = {
  messenger: { color: '#EC4899', imgSrc: '/Messenger.svg.webp' },
  zalo: { color: '#0068FF', imgSrc: '/zalo.jpg' },
  instagram: { color: '#E4405F', icon: <SiInstagram /> },
};

const FALLBACK_STYLE: PlatformStyle = { color: '#64748b', icon: <MessageOutlined /> };
const DONUT_SIZE = 132;
const DONUT_RADIUS = 48;
const DONUT_STROKE = 22;
const CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

type Props = {
  startDate: string;
  endDate: string;
  prevStartDate: string;
  prevEndDate: string;
};

function formatReplyTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '—';
  const total = Math.round(seconds);
  if (total < 60) return `${total} giây`;
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  if (mins < 60) return secs > 0 ? `${mins} phút ${secs} giây` : `${mins} phút`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hours} giờ ${remMins} phút` : `${hours} giờ`;
}

function styleFor(key: string) {
  return PLATFORM_STYLE[key] ?? FALLBACK_STYLE;
}

function Trend({
  deltaPct,
  lowerIsBetter,
}: {
  deltaPct: number | null;
  lowerIsBetter?: boolean;
}) {
  if (deltaPct == null) {
    return (
      <div className={styles.metricTrend}>
        <Text type="secondary" style={{ fontSize: 11 }}>
          —
        </Text>
      </div>
    );
  }
  const up = deltaPct >= 0;
  const good = lowerIsBetter ? !up : up;
  return (
    <div className={styles.metricTrend} style={{ color: good ? '#16a34a' : '#dc2626' }}>
      {up ? <ArrowUpOutlined /> : <ArrowDownOutlined />}{' '}
      {Math.abs(deltaPct).toLocaleString('vi-VN')}%
    </div>
  );
}

function Metric({
  label,
  value,
  deltaPct,
  lowerIsBetter,
}: {
  label: string;
  value: string;
  deltaPct: number | null;
  lowerIsBetter?: boolean;
}) {
  return (
    <div>
      <Text type="secondary" className={styles.metricLabel}>
        {label}
      </Text>
      <div className={styles.metricValue}>{value}</div>
      <Trend deltaPct={deltaPct} lowerIsBetter={lowerIsBetter} />
      <Text type="secondary" className={styles.metricFoot}>
        So với kỳ trước
      </Text>
    </div>
  );
}

/** Donut of message share per platform — plain SVG, no chart dependency. */
function PlatformDonut({ platforms }: { platforms: SmaxPlatformPerformance[] }) {
  const total = platforms.reduce((sum, p) => sum + p.messages, 0);
  if (total <= 0) return null;

  const center = DONUT_SIZE / 2;

  const segments = platforms.map((platform, index) => ({
    platform,
    share: platform.messages / total,
    startShare:
      platforms.slice(0, index).reduce((sum, p) => sum + p.messages, 0) / total,
  }));

  return (
    <div className={styles.donut}>
      <svg
        width={DONUT_SIZE}
        height={DONUT_SIZE}
        role="img"
        aria-label="Tỷ lệ tin nhắn theo nền tảng"
      >
        <g transform={`rotate(-90 ${center} ${center})`}>
          {segments.map(({ platform, share, startShare }) => (
            <circle
              key={platform.key}
              cx={center}
              cy={center}
              r={DONUT_RADIUS}
              fill="none"
              stroke={styleFor(platform.key).color}
              strokeWidth={DONUT_STROKE}
              strokeDasharray={`${share * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              strokeDashoffset={-startShare * CIRCUMFERENCE}
            />
          ))}
        </g>
        {segments.map(({ platform, share, startShare }) => {
          if (share < 0.08) return null;
          const angle = (startShare + share / 2) * 2 * Math.PI - Math.PI / 2;
          return (
            <text
              key={platform.key}
              x={center + Math.cos(angle) * DONUT_RADIUS}
              y={center + Math.sin(angle) * DONUT_RADIUS}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#fff"
              fontSize={12}
              fontWeight={700}
            >
              {Math.round(share * 100)}%
            </text>
          );
        })}
      </svg>
      <div className={styles.legend}>
        {platforms.map((platform) => (
          <span key={platform.key} className={styles.legendItem}>
            <span
              className={styles.legendDot}
              style={{ background: styleFor(platform.key).color }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {platform.label}
            </Text>
          </span>
        ))}
      </div>
    </div>
  );
}

export const ReportsMessagingPerformance = memo(function ReportsMessagingPerformance({
  startDate,
  endDate,
  prevStartDate,
  prevEndDate,
}: Props) {
  const { data, isLoading, isError, error } = useSmaxMessagingPerformance(
    startDate,
    endDate,
  );
  const { data: prev, isSuccess: hasPrev } = useSmaxMessagingPerformance(
    prevStartDate,
    prevEndDate,
  );

  let body: ReactNode;
  if (isLoading) {
    body = <Skeleton active paragraph={{ rows: 6 }} />;
  } else if (isError) {
    body = (
      <Alert
        type="error"
        showIcon
        message="Không tải được hiệu suất nhắn tin"
        description={(error as Error)?.message || 'Vui lòng thử lại sau.'}
      />
    );
  } else if (!data || data.platforms.length === 0) {
    body = (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="Không có dữ liệu nhắn tin trong kỳ"
      />
    );
  } else {
    body = (
      <>
        <div className={styles.metrics}>
          <Metric
            label="Thời gian trả lời TB"
            value={formatReplyTime(data.avgReplyTimeSec)}
            deltaPct={
              hasPrev
                ? percentChange(data.avgReplyTimeSec, prev?.avgReplyTimeSec ?? 0)
                : null
            }
            lowerIsBetter
          />
          <Metric
            label="Tổng tin nhắn"
            value={data.totalMessages.toLocaleString('vi-VN')}
            deltaPct={
              hasPrev ? percentChange(data.totalMessages, prev?.totalMessages ?? 0) : null
            }
          />
          <Metric
            label="Dữ liệu (Data)"
            value={data.totalData.toLocaleString('vi-VN')}
            deltaPct={hasPrev ? percentChange(data.totalData, prev?.totalData ?? 0) : null}
          />
        </div>

        <Text type="secondary" className={styles.sectionLabel}>
          Theo nền tảng
        </Text>

        <div className={styles.platformRow}>
          <div className={styles.platformList}>
            {data.platforms.map((platform) => {
              const style = styleFor(platform.key);
              return (
                <div key={platform.key} className={styles.platform}>
                  {style.imgSrc ? (
                    <span className={styles.platformIcon}>
                      <Image
                        src={style.imgSrc}
                        alt={platform.label}
                        width={26}
                        height={26}
                        className={styles.platformImg}
                      />
                    </span>
                  ) : (
                    <span className={styles.platformIcon} style={{ background: style.color }}>
                      {style.icon}
                    </span>
                  )}
                  <div className={styles.platformMain}>
                    <div className={styles.platformValue}>
                      {platform.messages.toLocaleString('vi-VN')} tin nhắn
                    </div>
                    <Text type="secondary" className={styles.platformSub}>
                      TB trả lời {formatReplyTime(platform.avgReplyTimeSec)}
                    </Text>
                  </div>
                </div>
              );
            })}
          </div>
          <PlatformDonut platforms={data.platforms} />
        </div>
      </>
    );
  }

  return (
    <Card
      style={{ borderRadius: 12, overflow: 'hidden', height: '100%' }}
      styles={{ body: { padding: 0, height: '100%' } }}
    >
      <div className={styles.body}>
        <div className={styles.header}>
          <Title level={5} className={styles.title}>
            Hiệu suất nhắn tin
          </Title>
          <Text type="secondary" className={styles.hint}>
            SMAX · theo kỳ đã chọn
          </Text>
        </div>
        {body}
      </div>
    </Card>
  );
});
