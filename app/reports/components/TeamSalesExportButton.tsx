'use client';

import { useState } from 'react';
import { App, Button, Checkbox, DatePicker, Input, InputNumber, Modal, Space, Table, Typography, theme } from 'antd';
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
  splitByDay: boolean,
): Promise<TeamSalesReportRow[]> {
  const res = await fetch(
    `/api/reports/team-sales-export?startAt=${encodeURIComponent(startAt)}&endAt=${encodeURIComponent(endAt)}&splitByDay=${splitByDay}`,
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
  { key: 'dataNhan', title: 'Data nhận', width: 120, format: formatNumberVi },
  { key: 'chamZalo', title: 'Chăm zalo', width: 120, format: formatNumberVi },
  { key: 'tuongTacQuanTam', title: 'Tương tác/ quan tâm', width: 150, format: formatNumberVi },
  { key: 'itTuongTac', title: 'Ít tương tác', width: 130, format: formatNumberVi },
  { key: 'chuaTiepCan', title: 'Chưa tiếp cận', width: 130, format: formatNumberVi },
  { key: 'racKqt', title: 'Rác/KQT', width: 120, format: formatNumberVi },
  { key: 'slHvDen', title: 'SL HV đến', width: 120, format: formatNumberVi },
  { key: 'slHvChot', title: 'SL HV chốt', width: 120, format: formatNumberVi },
  { key: 'doanhThu', title: 'Doanh thu', width: 160, format: formatCurrencyVnd },
  { key: 'congNo', title: 'Công nợ', width: 160, format: formatCurrencyVnd },
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

const DEFAULT_SPAN_STYLE: React.CSSProperties = { display: 'block', width: '100%', cursor: 'text' };

interface EditableMetricCellProps {
  displayValue: React.ReactNode;
  editValue: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onChangeValue: (value: string) => void;
  onStopEdit: () => void;
  spanStyle?: React.CSSProperties;
}

function EditableMetricCell({
  displayValue,
  editValue,
  isEditing,
  onStartEdit,
  onChangeValue,
  onStopEdit,
  spanStyle = DEFAULT_SPAN_STYLE,
}: EditableMetricCellProps) {
  if (isEditing) {
    return (
      <Input.TextArea
        autoFocus
        autoSize={{ minRows: 1, maxRows: 4 }}
        variant="borderless"
        value={editValue}
        style={{ width: '100%', textAlign: 'center' }}
        onChange={(e) => onChangeValue(e.target.value)}
        onBlur={onStopEdit}
      />
    );
  }

  return (
    <span onClick={onStartEdit} style={spanStyle}>
      {displayValue}
    </span>
  );
}

// Doanh thu / Công nợ stay number-only and always keep their colored/"đ"
// formatting — only the underlying number changes, never the styling.
interface EditableNumericMetricCellProps {
  metricKey: MetricKey;
  value: number;
  format: (val: number) => string;
  token: Token;
  isEditing: boolean;
  onStartEdit: () => void;
  onChangeValue: (value: number) => void;
  onStopEdit: () => void;
}

function EditableNumericMetricCell({
  metricKey,
  value,
  format,
  token,
  isEditing,
  onStartEdit,
  onChangeValue,
  onStopEdit,
}: EditableNumericMetricCellProps) {
  if (isEditing) {
    return (
      <InputNumber
        autoFocus
        size="small"
        variant="borderless"
        controls={false}
        min={0}
        value={value}
        style={{ width: '100%', textAlign: 'center' }}
        onChange={(v) => onChangeValue(v ?? 0)}
        onBlur={onStopEdit}
        onPressEnter={onStopEdit}
      />
    );
  }

  return (
    <span onClick={onStartEdit} style={{ display: 'block', width: '100%', cursor: 'text' }}>
      {renderMetricValue(metricKey, value, format, token)}
    </span>
  );
}

interface CellEditControls {
  overrides: Record<string, string>;
  editingKey: string | null;
  onStartEdit: (key: string) => void;
  onStopEdit: () => void;
  onChangeValue: (key: string, value: string) => void;
}

const NOTE_SPAN_STYLE: React.CSSProperties = {
  display: 'block',
  width: '100%',
  minHeight: 22,
  cursor: 'text',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
};

function renderEditableTextCell(cellEdit: CellEditControls, cellKey: string, value: string) {
  const rawValue = cellEdit.overrides[cellKey] ?? value;
  return (
    <EditableMetricCell
      displayValue={rawValue}
      editValue={rawValue}
      isEditing={cellEdit.editingKey === cellKey}
      onStartEdit={() => cellEdit.onStartEdit(cellKey)}
      onChangeValue={(v) => cellEdit.onChangeValue(cellKey, v)}
      onStopEdit={cellEdit.onStopEdit}
      spanStyle={NOTE_SPAN_STYLE}
    />
  );
}

const NUMERIC_ONLY_METRIC_KEYS = new Set<MetricKey>(['doanhThu', 'congNo']);

function renderEditableCell(
  cellEdit: CellEditControls,
  token: Token,
  metricKey: MetricKey,
  format: (val: number) => string,
  cellKey: string,
  value: number,
) {
  const override = cellEdit.overrides[cellKey];
  const hasOverride = override !== undefined;
  const isEditing = cellEdit.editingKey === cellKey;

  if (NUMERIC_ONLY_METRIC_KEYS.has(metricKey)) {
    const numericValue = hasOverride ? Number(override) || 0 : value;
    return (
      <EditableNumericMetricCell
        metricKey={metricKey}
        value={numericValue}
        format={format}
        token={token}
        isEditing={isEditing}
        onStartEdit={() => cellEdit.onStartEdit(cellKey)}
        onChangeValue={(v) => cellEdit.onChangeValue(cellKey, String(v))}
        onStopEdit={cellEdit.onStopEdit}
      />
    );
  }

  const displayValue = hasOverride ? override : renderMetricValue(metricKey, value, format, token);
  const editValue = hasOverride ? override : String(value);

  return (
    <EditableMetricCell
      displayValue={displayValue}
      editValue={editValue}
      isEditing={isEditing}
      onStartEdit={() => cellEdit.onStartEdit(cellKey)}
      onChangeValue={(v) => cellEdit.onChangeValue(cellKey, v)}
      onStopEdit={cellEdit.onStopEdit}
    />
  );
}

function buildReportColumns(
  token: Token,
  cellEdit: CellEditControls,
  textCellEdit: CellEditControls,
) {
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
      width: 240,
      align: 'center' as const,
      render: (value: string, row: TeamSalesReportRow) =>
        renderEditableTextCell(textCellEdit, `${row.startAt}:ghiChu`, value),
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
  const [splitByDay, setSplitByDay] = useState(false);
  const [rows, setRows] = useState<TeamSalesReportRow[] | null>(null);

  const [cellOverrides, setCellOverrides] = useState<Record<string, string>>({});
  const [editingCellKey, setEditingCellKey] = useState<string | null>(null);
  const [textOverrides, setTextOverrides] = useState<Record<string, string>>({});
  const [editingTextKey, setEditingTextKey] = useState<string | null>(null);

  const resetAndClose = () => {
    setOpen(false);
    setRows(null);
    setCellOverrides({});
    setEditingCellKey(null);
    setTextOverrides({});
    setEditingTextKey(null);
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
      setRows(await fetchTeamSalesReportRows(startAt, endAt, splitByDay));
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

  const textCellEdit: CellEditControls = {
    overrides: textOverrides,
    editingKey: editingTextKey,
    onStartEdit: (key) => setEditingTextKey(key),
    onStopEdit: () => setEditingTextKey(null),
    onChangeValue: (key, value) => setTextOverrides((prev) => ({ ...prev, [key]: value })),
  };

  const reportColumns = buildReportColumns(token, cellEdit, textCellEdit);

  return (
    <>
      <Button type="primary" icon={<TableOutlined />} onClick={() => setOpen(true)}>
        Xem báo cáo
      </Button>

      <Modal
        open={open}
        onCancel={resetAndClose}
        maskClosable={false}
        width={rows ? '98vw' : 'min(92vw, 520px)'}
        centered
        style={rows ? { maxWidth: 1900 } : undefined}
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
              scroll={{ x: 'max-content' }}
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
                        <Table.Summary.Cell index={METRIC_COLUMNS.length + 1} align="center">
                          {renderEditableTextCell(textCellEdit, `${SUMMARY_ROW_KEY}:ghiChu`, '')}
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    )
                  : undefined
              }
            />
          </div>
        ) : (
          <Space orientation="vertical" style={{ width: '100%' }}>
            <span>Khung giờ báo cáo</span>
            <RangePicker
              showTime={{ format: 'HH:mm' }}
              format="DD/MM/YYYY HH:mm"
              value={range}
              onChange={(dates) => setRange(dates as [Dayjs | null, Dayjs | null] | null)}
              style={{ width: '100%' }}
            />
            <Checkbox checked={splitByDay} onChange={(e) => setSplitByDay(e.target.checked)}>
              Tách riêng từng ngày (mỗi ngày 1 dòng)
            </Checkbox>
          </Space>
        )}
      </Modal>
    </>
  );
}
