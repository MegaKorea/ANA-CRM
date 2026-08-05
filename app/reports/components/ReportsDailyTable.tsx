'use client';

import { Card, Empty, Pagination, Table, Typography, Spin, theme } from 'antd';
import dayjs from 'dayjs';
import { memo, useEffect, useMemo, useState } from 'react';
import { LeadStatisticsDayCard } from '@/app/lead/components/LeadStatisticsDayCard';
import type { LeadStatisticsChartRow } from '@/lib/hooks/use-lead-statistics';
import styles from './ReportsDailyTable.module.css';

const { Title, Text } = Typography;

const MOBILE_PAGE_SIZE = 10;
const DESKTOP_PAGE_SIZE = 10;

type Props = {
  chartData: LeadStatisticsChartRow[];
  isLoading: boolean;
};

export const ReportsDailyTable = memo(function ReportsDailyTable({
  chartData,
  isLoading,
}: Props) {
  const { token } = theme.useToken();
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [chartData]);

  const pagedDays = useMemo(() => {
    const start = (page - 1) * MOBILE_PAGE_SIZE;
    return chartData.slice(start, start + MOBILE_PAGE_SIZE);
  }, [chartData, page]);

  const columns = [
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
      render: (val: string) => dayjs(val).format('DD/MM/YYYY'),
    },
    { title: 'Tương Tác', dataIndex: 'fbMessages', key: 'fbMessages' },
    { title: 'Data', dataIndex: 'totalLeads', key: 'totalLeads' },
    { title: 'Đăng ký', dataIndex: 'registeredLeads', key: 'registeredLeads' },
    { title: 'Lịch hẹn', dataIndex: 'totalAppointments', key: 'totalAppointments' },
    { title: 'Đến tư vấn', dataIndex: 'arrivedAppointments', key: 'arrivedAppointments' },
  ];

  const summaryRow = () => {
    let tLeads = 0;
    let tRegLeads = 0;
    let tAppts = 0;
    let tArrAppts = 0;
    let tFbMsgs = 0;

    chartData.forEach(
      ({
        totalLeads,
        registeredLeads,
        totalAppointments,
        arrivedAppointments,
        fbMessages,
      }) => {
        tLeads += totalLeads;
        tRegLeads += registeredLeads;
        tAppts += totalAppointments;
        tArrAppts += arrivedAppointments;
        tFbMsgs += fbMessages || 0;
      },
    );

    return (
      <Table.Summary.Row
        style={{ backgroundColor: token.colorFillAlter, fontWeight: 'bold' }}
      >
        <Table.Summary.Cell index={0}>Tổng cộng</Table.Summary.Cell>
        <Table.Summary.Cell index={1}>{tFbMsgs}</Table.Summary.Cell>
        <Table.Summary.Cell index={2}>{tLeads}</Table.Summary.Cell>
        <Table.Summary.Cell index={3}>{tRegLeads}</Table.Summary.Cell>
        <Table.Summary.Cell index={4}>{tAppts}</Table.Summary.Cell>
        <Table.Summary.Cell index={5}>{tArrAppts}</Table.Summary.Cell>
      </Table.Summary.Row>
    );
  };

  return (
    <Card style={{ borderRadius: 12, overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
      <div className={styles.body}>
        <Title level={5} style={{ marginTop: 0, marginBottom: 12 }}>
          Bảng thống kê theo ngày
        </Title>

        <div className={styles.desktopOnly}>
          <Table
            columns={columns}
            dataSource={chartData}
            rowKey="date"
            loading={isLoading}
            pagination={{
              pageSize: DESKTOP_PAGE_SIZE,
              showSizeChanger: false,
            }}
            scroll={{ x: 'max-content' }}
            bordered
            summary={summaryRow}
          />
        </div>

        <div className={styles.mobileOnly}>
          {isLoading ? (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <Spin />
            </div>
          ) : chartData.length === 0 ? (
            <Empty description="Không có dữ liệu trong khoảng ngày đã chọn" />
          ) : (
            <>
              <div className={styles.dayList} role="list">
                {pagedDays.map((item) => (
                  <div role="listitem" key={item.date} className={styles.dayItem}>
                    <LeadStatisticsDayCard item={item} />
                  </div>
                ))}
              </div>
              {chartData.length > MOBILE_PAGE_SIZE ? (
                <div className={styles.pager}>
                  <Pagination
                    size="small"
                    current={page}
                    pageSize={MOBILE_PAGE_SIZE}
                    total={chartData.length}
                    onChange={setPage}
                    showSizeChanger={false}
                    simple
                  />
                </div>
              ) : null}
              <Text type="secondary" className={styles.footerHint}>
                {chartData.length} ngày trong khoảng đã chọn
              </Text>
            </>
          )}
        </div>
      </div>
    </Card>
  );
});
