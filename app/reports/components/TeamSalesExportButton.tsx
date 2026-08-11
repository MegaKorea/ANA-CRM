'use client';

import { useState } from 'react';
import { App, Button, DatePicker, InputNumber, Modal, Space, Table, Typography, theme } from 'antd';
import { BarChartOutlined, TableOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import type { TeamSalesReportRow } from '@/lib/services/team-sales-report.service';
import { formatCurrencyVnd, formatNumberVi } from '@/lib/utils/numberFormat';
import { VN_TIMEZONE } from '@/lib/utils/vn-date';
import styles from './TeamSalesExportButton.module.scss';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

type Token = ReturnType<typeof theme.useToken>['token'];

async function fetchTeamSalesReportRows(
  startAt: string,
  endAt: string,
): Promise<TeamSalesReportRow[]> {
  const res = await fetch(
    `/api/reports/team-sales-export?startAt=${encodeURIComponent(startAt)}&endAt=${encodeURIComponent(endAt)}`,
  );
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || 'Lấy dữ liệu báo cáo thất bại');
  }
  const body = (await res.json()) as { rows: TeamSalesReportRow[] };
  return body.rows;
}

function formatVnHourDayMonth(iso: string): string {
  const date = new Date(iso);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: VN_TIMEZONE,
    hour: '2-digit',
    day: '2-digit',
    month: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${Number(get('hour'))}h ngày ${get('day')}/${get('month')}`;
}

function formatPeriodLabel(startAt: string, endAt: string): string {
  return `Từ ${formatVnHourDayMonth(startAt)} đến ${formatVnHourDayMonth(endAt)}`;
}

const METRIC_COLUMNS = [
  { key: 'dataNhan', title: 'Data nhận', width: 100, format: formatNumberVi },
  { key: 'chamZalo', title: 'Chăm zalo', width: 100, format: formatNumberVi },
  { key: 'tuongTacQuanTam', title: 'Tương tác/ quan tâm', width: 130, format: formatNumberVi },
  { key: 'itTuongTac', title: 'Ít tương tác', width: 110, format: formatNumberVi },
  { key: 'chuaTiepCan', title: 'Chưa tiếp cận', width: 110, format: formatNumberVi },
  { key: 'racKqt', title: 'Rác/KQT', width: 100, format: formatNumberVi },
  { key: 'slHvDen', title: 'SL HV đến', width: 100, format: formatNumberVi },
  { key: 'slHvChot', title: 'SL HV chốt', width: 100, format: formatNumberVi },
  { key: 'doanhThu', title: 'Doanh thu', width: 140, format: formatCurrencyVnd },
  { key: 'congNo', title: 'Công nợ', width: 140, format: formatCurrencyVnd },
] as const satisfies {
  key: keyof TeamSalesReportRow;
  title: string;
  width: number;
  format: (val: number) => string;
}[];

type MetricKey = (typeof METRIC_COLUMNS)[number]['key'];

function sumRows(rows: TeamSalesReportRow[]): Record<MetricKey, number> {
  const totals = Object.fromEntries(METRIC_COLUMNS.map(({ key }) => [key, 0])) as Record<
    MetricKey,
    number
  >;
  for (const row of rows) {
    for (const { key } of METRIC_COLUMNS) {
      totals[key] += row[key];
    }
  }
  return totals;
}

function renderMetricValue(
  key: MetricKey,
  value: number,
  format: (val: number) => string,
  token: Token,
) {
  if (key === 'doanhThu') {
    return <Text style={{ color: token.colorSuccess, fontWeight: 600 }}>{format(value)}</Text>;
  }
  if (key === 'congNo') {
    return (
      <Text
        style={{
          color: value > 0 ? token.colorError : token.colorTextTertiary,
          fontWeight: value > 0 ? 600 : 400,
        }}
      >
        {format(value)}
      </Text>
    );
  }
  return format(value);
}

// Click a number to edit it right there — looks like plain text at rest (and
// in a screenshot), no border/background hint. Local-only: never sent
// anywhere, cleared when the report modal is closed.
interface EditableMetricCellProps {
  metricKey: MetricKey;
  rawValue: number;
  format: (val: number) => string;
  token: Token;
  isEditing: boolean;
  onStartEdit: () => void;
  onChangeValue: (value: number) => void;
  onStopEdit: () => void;
}

function EditableMetricCell({
  metricKey,
  rawValue,
  format,
  token,
  isEditing,
  onStartEdit,
  onChangeValue,
  onStopEdit,
}: EditableMetricCellProps) {
  if (isEditing) {
    return (
      <InputNumber
        autoFocus
        size="small"
        variant="borderless"
        controls={false}
        min={0}
        value={rawValue}
        style={{ width: '100%', textAlign: 'center' }}
        onChange={(value) => onChangeValue(value ?? 0)}
        onBlur={onStopEdit}
        onPressEnter={onStopEdit}
      />
    );
  }

  return (
    <span onClick={onStartEdit} style={{ display: 'block', width: '100%', cursor: 'text' }}>
      {renderMetricValue(metricKey, rawValue, format, token)}
    </span>
  );
}

interface CellEditControls {
  overrides: Record<string, number>;
  editingKey: string | null;
  onStartEdit: (key: string) => void;
  onStopEdit: () => void;
  onChangeValue: (key: string, value: number) => void;
}

function renderEditableCell(
  cellEdit: CellEditControls,
  token: Token,
  metricKey: MetricKey,
  format: (val: number) => string,
  cellKey: string,
  value: number,
) {
  return (
    <EditableMetricCell
      metricKey={metricKey}
      rawValue={cellEdit.overrides[cellKey] ?? value}
      format={format}
      token={token}
      isEditing={cellEdit.editingKey === cellKey}
      onStartEdit={() => cellEdit.onStartEdit(cellKey)}
      onChangeValue={(v) => cellEdit.onChangeValue(cellKey, v)}
      onStopEdit={cellEdit.onStopEdit}
    />
  );
}

function buildReportColumns(token: Token, cellEdit: CellEditControls) {
  return [
    {
      title: 'Ngày',
      key: 'period',
      width: 220,
      align: 'center' as const,
      render: (_: unknown, row: TeamSalesReportRow) => formatPeriodLabel(row.startAt, row.endAt),
    },
    ...METRIC_COLUMNS.map(({ key, title, width, format }) => ({
      title,
      dataIndex: key,
      key,
      width,
      align: 'center' as const,
      render: (value: number, row: TeamSalesReportRow) =>
        renderEditableCell(cellEdit, token, key, format, `${row.startAt}:${key}`, value),
    })),
    {
      title: 'Ghi chú',
      dataIndex: 'ghiChu',
      key: 'ghiChu',
      align: 'center' as const,
      ellipsis: true,
    },
  ];
}

const SUMMARY_ROW_KEY = '__summary__';

export function TeamSalesExportButton() {
  const { message } = App.useApp();
  const { token } = theme.useToken();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>([
    dayjs().subtract(1, 'day').hour(17).minute(0),
    dayjs().hour(10).minute(0),
  ]);
  const [rows, setRows] = useState<TeamSalesReportRow[] | null>(null);
  // Local-only overrides for cells the user clicked to edit — never persisted,
  // cleared whenever the report modal is closed.
  const [cellOverrides, setCellOverrides] = useState<Record<string, number>>({});
  const [editingCellKey, setEditingCellKey] = useState<string | null>(null);

  const resetAndClose = () => {
    setOpen(false);
    setRows(null);
    setCellOverrides({});
    setEditingCellKey(null);
  };

  const handleViewReport = async () => {
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
      setRows(await fetchTeamSalesReportRows(startAt, endAt));
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Lấy dữ liệu báo cáo thất bại');
    } finally {
      setLoading(false);
    }
  };

  const totals = rows && rows.length > 1 ? sumRows(rows) : null;

  const cellEdit: CellEditControls = {
    overrides: cellOverrides,
    editingKey: editingCellKey,
    onStartEdit: (key) => setEditingCellKey(key),
    onStopEdit: () => setEditingCellKey(null),
    onChangeValue: (key, value) => setCellOverrides((prev) => ({ ...prev, [key]: value })),
  };

  const reportColumns = buildReportColumns(token, cellEdit);

  return (
    <>
      <Button type="primary" icon={<TableOutlined />} onClick={() => setOpen(true)}>
        Xem báo cáo
      </Button>

      <Modal
        open={open}
        onCancel={resetAndClose}
        width={rows ? '95vw' : 'min(92vw, 520px)'}
        centered
        style={rows ? { maxWidth: 1680 } : undefined}
        styles={rows ? { body: { paddingTop: 4 } } : undefined}
        footer={
          rows
            ? [
                <Button key="back" onClick={() => setRows(null)}>
                  Chọn lại khung giờ
                </Button>,
                <Button key="close" type="primary" onClick={resetAndClose}>
                  Đóng
                </Button>,
              ]
            : [
                <Button key="cancel" onClick={resetAndClose}>
                  Hủy
                </Button>,
                <Button key="view" type="primary" loading={loading} onClick={handleViewReport}>
                  Xem báo cáo
                </Button>,
              ]
        }
      >
        {rows ? (
          <div>
            <div className={styles.headerRow}>
              <BarChartOutlined style={{ color: token.colorPrimary, fontSize: 18 }} />
              <Title level={5} className={styles.reportTitle} style={{ margin: 0 }}>
                BÁO CÁO KẾT QUẢ LÀM VIỆC TEAM SALES
              </Title>
            </div>
            {rows.length ? (
              <div
                className={styles.periodBadge}
                style={{ background: token.colorPrimaryBg, color: token.colorPrimary }}
              >
                <Text style={{ color: token.colorPrimary }}>
                  {formatPeriodLabel(rows[0].startAt, rows[rows.length - 1].endAt)}
                </Text>
              </div>
            ) : null}
            <Table
              className={styles.tableWrapper}
              columns={reportColumns}
              dataSource={rows}
              rowKey={(row) => row.startAt}
              pagination={false}
              bordered
              size="middle"
              tableLayout="fixed"
              scroll={{ x: 'max-content', y: 'calc(75vh - 220px)' }}
              onRow={(_, index) =>
                index !== undefined && index % 2 === 1
                  ? { style: { backgroundColor: token.colorFillQuaternary } }
                  : {}
              }
              summary={
                totals
                  ? () => (
                      <Table.Summary.Row
                        style={{
                          backgroundColor: token.colorPrimaryBg,
                          borderTop: `2px solid ${token.colorPrimary}`,
                        }}
                      >
                        <Table.Summary.Cell index={0} align="center">
                          <Text strong style={{ color: token.colorPrimary }}>
                            Tổng
                          </Text>
                        </Table.Summary.Cell>
                        {METRIC_COLUMNS.map(({ key, format }, index) => (
                          <Table.Summary.Cell key={key} index={index + 1} align="center">
                            {renderEditableCell(
                              cellEdit,
                              token,
                              key,
                              format,
                              `${SUMMARY_ROW_KEY}:${key}`,
                              totals[key],
                            )}
                          </Table.Summary.Cell>
                        ))}
                        <Table.Summary.Cell index={METRIC_COLUMNS.length + 1} />
                      </Table.Summary.Row>
                    )
                  : undefined
              }
            />
          </div>
        ) : (
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
        )}
      </Modal>
    </>
  );
}
