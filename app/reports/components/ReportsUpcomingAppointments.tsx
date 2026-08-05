'use client';

import { Alert, Card, Empty, Pagination, Skeleton, Typography } from 'antd';
import { FacebookOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { memo, useMemo, useState, type ReactNode } from 'react';
import { SiZalo } from 'react-icons/si';
import dayjs from 'dayjs';
import type {
  UpcomingAppointment,
  UpcomingAppointmentChannel,
} from '@/lib/services/appointment.service';
import { toVnDate } from '@/lib/utils/vn-date';
import { useUpcomingAppointments } from '@/lib/hooks/use-appointments';
import styles from './ReportsUpcomingAppointments.module.css';

const { Title, Text } = Typography;

const PAGE_SIZE = 4;

function addDaysIsoDate(isoDate: string, days: number): string {
  const cursor = new Date(`${isoDate}T12:00:00Z`);
  cursor.setUTCDate(cursor.getUTCDate() + days);
  return cursor.toISOString().slice(0, 10);
}

function formatDayLabel(isoDate: string, today: string, tomorrow: string): string {
  const display = dayjs(isoDate).format('DD/MM/YYYY');
  if (isoDate === today) return `Hôm nay · ${display}`;
  if (isoDate === tomorrow) return `Ngày mai · ${display}`;
  return display;
}

function ChannelIcon({ channel }: { channel: UpcomingAppointmentChannel }) {
  if (!channel) return <span className={styles.channelPlaceholder} aria-hidden />;

  if (channel === 'zalo') {
    return (
      <span className={`${styles.channel} ${styles.channelZalo}`} aria-label="Zalo">
        <SiZalo size={14} color="#fff" />
      </span>
    );
  }

  return (
    <span className={`${styles.channel} ${styles.channelFb}`} aria-label="Facebook">
      <FacebookOutlined style={{ fontSize: 12, color: '#fff' }} />
    </span>
  );
}

function AppointmentCard({
  item,
  today,
  tomorrow,
  onOpen,
}: {
  item: UpcomingAppointment;
  today: string;
  tomorrow: string;
  onOpen: (leadId: number) => void;
}) {
  const time = dayjs(item.appointment_date).format('HH:mm');
  const day = toVnDate(item.appointment_date);

  return (
    <button
      type="button"
      className={styles.card}
      onClick={() => onOpen(item.lead_id)}
    >
      <ChannelIcon channel={item.channel} />
      <div className={styles.info}>
        <div className={styles.meta}>
          <span className={styles.time}>{time}</span>
          <Text type="secondary" className={styles.dayHint}>
            {formatDayLabel(day, today, tomorrow)}
          </Text>
        </div>
        <Text className={styles.name} ellipsis>
          {item.lead_full_name || '—'}
        </Text>
        <Text type="secondary" className={styles.note} ellipsis>
          {item.note?.trim() || 'Lịch hẹn'}
        </Text>
      </div>
    </button>
  );
}

export const ReportsUpcomingAppointments = memo(function ReportsUpcomingAppointments() {
  const router = useRouter();
  const { data, isLoading, isError, error } = useUpcomingAppointments();
  const [page, setPage] = useState(1);

  const { today, tomorrow, items } = useMemo(() => {
    const todayIso = toVnDate(new Date().toISOString());
    const tomorrowIso = addDaysIsoDate(todayIso, 1);
    const sorted = [...(data ?? [])].toSorted(
      (a, b) =>
        new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime(),
    );
    return { today: todayIso, tomorrow: tomorrowIso, items: sorted };
  }, [data]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, currentPage]);

  const openLeadAppointment = (leadId: number) => {
    router.push(`/lead?appointment=${leadId}`);
  };

  let body: ReactNode;
  if (isLoading) {
    body = <Skeleton active paragraph={{ rows: 3 }} />;
  } else if (isError) {
    body = (
      <Alert
        type="error"
        showIcon
        message="Không tải được lịch hẹn"
        description={(error as Error | undefined)?.message || 'Vui lòng thử lại sau.'}
      />
    );
  } else if (items.length === 0) {
    body = <Empty description="Không có lịch hẹn sắp tới" />;
  } else {
    body = (
      <>
        <div className={styles.grid}>
          {pageItems.map((item) => (
            <AppointmentCard
              key={item.id}
              item={item}
              today={today}
              tomorrow={tomorrow}
              onOpen={openLeadAppointment}
            />
          ))}
        </div>
        {items.length > PAGE_SIZE ? (
          <div className={styles.pager}>
            <Pagination
              current={currentPage}
              pageSize={PAGE_SIZE}
              total={items.length}
              onChange={setPage}
              size="small"
              showSizeChanger={false}
            />
          </div>
        ) : null}
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
            Lịch hẹn & Chăm sóc sắp tới
          </Title>
          <Link href="/appointments" className={styles.viewAll}>
            Xem tất cả
          </Link>
        </div>
        <div className={styles.content}>{body}</div>
      </div>
    </Card>
  );
});
