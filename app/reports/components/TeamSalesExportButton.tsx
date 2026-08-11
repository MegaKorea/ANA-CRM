'use client';

import { useState } from 'react';
import { App, Button, DatePicker, Modal, Space } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import type { TeamSalesReportRow } from '@/lib/services/team-sales-report.service';

const { RangePicker } = DatePicker;

async function fetchTeamSalesReportRows(
  startAt: string,
  endAt: string,
): Promise<TeamSalesReportRow[]> {
  const res = await fetch(
    `/api/reports/team-sales-export?startAt=${encodeURIComponent(startAt)}&endAt=${encodeURIComponent(endAt)}`,
  );
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || 'Xuất báo cáo thất bại');
  }
  const body = (await res.json()) as { rows: TeamSalesReportRow[] };
  return body.rows;
}

export function TeamSalesExportButton() {
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>([
    dayjs().subtract(1, 'day').hour(17).minute(0),
    dayjs().hour(10).minute(0),
  ]);

  const handleExport = async () => {
    if (!range?.[0] || !range?.[1]) {
      message.warning('Vui lòng chọn khung giờ báo cáo');
      return;
    }
    if (!range[0].isBefore(range[1])) {
      message.warning('Thời gian bắt đầu phải trước thời gian kết thúc');
      return;
    }

    setLoading(true);
    try {
      const startAt = range[0].toISOString();
      const endAt = range[1].toISOString();
      const rows = await fetchTeamSalesReportRows(startAt, endAt);
      const { exportTeamSalesReportToExcel } = await import(
        '@/lib/utils/export-team-sales-report'
      );
      await exportTeamSalesReportToExcel(rows);
      setOpen(false);
    } catch (error) {
      message.error((error as Error).message || 'Xuất báo cáo thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button icon={<DownloadOutlined />} onClick={() => setOpen(true)}>
        Xuất báo cáo
      </Button>

      <Modal
        title="Xuất báo cáo Team Sales"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleExport}
        okText="Xuất Excel"
        cancelText="Hủy"
        confirmLoading={loading}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <span>Khung giờ báo cáo</span>
          <RangePicker
            showTime={{ format: 'HH:mm' }}
            format="DD/MM/YYYY HH:mm"
            value={range}
            onChange={(dates) => setRange(dates as [Dayjs | null, Dayjs | null] | null)}
            style={{ width: '100%' }}
          />
        </Space>
      </Modal>
    </>
  );
}
