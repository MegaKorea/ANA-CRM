'use client';

import { useState } from 'react';
import { App, Button, DatePicker, Input, Modal, Space, Switch, Typography, theme } from 'antd';
import { TableOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import type { TeamSalesNoteEntry, TeamSalesReportRow } from '@/lib/services/team-sales-report.service';
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
  { key: 'dataNhan', title: 'Data nhận', format: formatNumberVi },
  { key: 'chamZalo', title: 'Chăm zalo', format: formatNumberVi },
  { key: 'tuongTacQuanTam', title: 'Tương tác/QT', format: formatNumberVi },
  { key: 'itTuongTac', title: 'Ít tương tác', format: formatNumberVi },
  { key: 'chuaTiepCan', title: 'Chưa tiếp cận', format: formatNumberVi },
  { key: 'racKqt', title: 'Rác/KQT', format: formatNumberVi },
  { key: 'slHvDen', title: 'SL HV đến', format: formatNumberVi },
  { key: 'slHvChot', title: 'SL HV chốt', format: formatNumberVi },
  { key: 'doanhThu', title: 'Doanh thu', format: formatCurrencyVnd },
  { key: 'congNo', title: 'Công nợ', format: formatCurrencyVnd },
] as const satisfies {
  key: keyof TeamSalesReportRow;
  title: string;
  format: (val: number) => string;
}[];

type MetricKey = (typeof METRIC_COLUMNS)[number]['key'];

function sumRows(
  rows: TeamSalesReportRow[],
  cellOverrides: Record<string, string>,
): Record<MetricKey, number> {
  const totals = Object.fromEntries(METRIC_COLUMNS.map(({ key }) => [key, 0])) as Record<
    MetricKey,
    number
  >;
  for (const row of rows) {
    for (const { key } of METRIC_COLUMNS) {
      const override = cellOverrides[`${row.startAt}:${key}`];
      const parsed = override !== undefined ? Number(override) : NaN;
      totals[key] += Number.isFinite(parsed) ? parsed : row[key];
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
    return <Text style={{ color: token.colorSuccess, fontWeight: 700 }}>{format(value)}</Text>;
  }
  if (key === 'congNo') {
    return (
      <Text
        style={{
          color: value > 0 ? token.colorError : token.colorTextTertiary,
          fontWeight: 700,
        }}
      >
        {format(value)}
      </Text>
    );
  }
  return format(value);
}

interface EditableMetricCellProps {
  displayValue: React.ReactNode;
  editValue: string;
  isEditing: boolean;
  allowNewLine: boolean;
  onStartEdit: () => void;
  onChangeValue: (value: string) => void;
  onStopEdit: () => void;
}

function EditableMetricCell({
  displayValue,
  editValue,
  isEditing,
  allowNewLine,
  onStartEdit,
  onChangeValue,
  onStopEdit,
}: EditableMetricCellProps) {
  if (isEditing) {
    if (allowNewLine) {
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
      <Input
        autoFocus
        size="small"
        variant="borderless"
        value={editValue}
        style={{ width: '100%', textAlign: 'center' }}
        onChange={(e) => onChangeValue(e.target.value)}
        onBlur={onStopEdit}
        onPressEnter={onStopEdit}
      />
    );
  }

  return (
    <span
      onClick={onStartEdit}
      style={{
        display: 'block',
        width: '100%',
        cursor: 'text',
        whiteSpace: allowNewLine ? 'pre-wrap' : undefined,
      }}
    >
      {displayValue}
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

const NUMERIC_ONLY_METRIC_KEYS: readonly MetricKey[] = ['doanhThu', 'congNo'];

function renderEditableCell(
  cellEdit: CellEditControls,
  token: Token,
  metricKey: MetricKey,
  format: (val: number) => string,
  cellKey: string,
  value: number,
) {
  const isNumericOnly = NUMERIC_ONLY_METRIC_KEYS.includes(metricKey);
  const override = cellEdit.overrides[cellKey];
  const hasOverride = override !== undefined;
  const displayValue = hasOverride
    ? isNumericOnly
      ? renderMetricValue(metricKey, Number(override) || 0, format, token)
      : override
    : renderMetricValue(metricKey, value, format, token);
  const editValue = hasOverride ? override : String(value);

  return (
    <EditableMetricCell
      displayValue={displayValue}
      editValue={editValue}
      isEditing={cellEdit.editingKey === cellKey}
      allowNewLine={!isNumericOnly}
      onStartEdit={() => cellEdit.onStartEdit(cellKey)}
      onChangeValue={(v) =>
        cellEdit.onChangeValue(cellKey, isNumericOnly ? v.replace(/\D/g, '') : v)
      }
      onStopEdit={cellEdit.onStopEdit}
    />
  );
}

const SUMMARY_ROW_KEY = '__summary__';

interface ReportPeriodSectionProps {
  heading?: React.ReactNode;
  highlight?: boolean;
  values: Record<MetricKey, number>;
  cellKeyPrefix: string;
  cellEdit: CellEditControls;
  token: Token;
  notes?: TeamSalesNoteEntry[];
}

function ReportPeriodSection({
  heading,
  highlight,
  values,
  cellKeyPrefix,
  cellEdit,
  token,
  notes,
}: ReportPeriodSectionProps) {
  return (
    <div
      className={`${styles.periodBlock} ${highlight ? styles.periodBlockHighlight : ''}`}
      style={{ borderColor: highlight ? token.colorText : token.colorBorderSecondary }}
    >
      {heading ? (
        <div
          className={styles.periodSubHeader}
          style={{ borderColor: token.colorText, color: token.colorText }}
        >
          {heading}
        </div>
      ) : null}

      <div
        className={styles.metricStrip}
        style={{ borderColor: token.colorBorderSecondary, background: token.colorBgContainer }}
      >
        {METRIC_COLUMNS.map(({ key, title, format }) => (
          <div key={key} className={styles.metricCell} style={{ borderColor: token.colorBorderSecondary }}>
            <div className={styles.metricLabel} style={{ color: token.colorTextSecondary }}>
              {title}
            </div>
            <div className={styles.metricValue}>
              {renderEditableCell(cellEdit, token, key, format, `${cellKeyPrefix}:${key}`, values[key])}
            </div>
          </div>
        ))}
        <div className={styles.metricCell} style={{ borderColor: token.colorBorderSecondary }}>
          <div className={styles.metricLabel} style={{ color: token.colorTextSecondary }}>
            Note
          </div>
          <div className={styles.metricValue}>
            <EditableMetricCell
              displayValue={cellEdit.overrides[`${cellKeyPrefix}:note`] || '—'}
              editValue={cellEdit.overrides[`${cellKeyPrefix}:note`] ?? ''}
              isEditing={cellEdit.editingKey === `${cellKeyPrefix}:note`}
              allowNewLine
              onStartEdit={() => cellEdit.onStartEdit(`${cellKeyPrefix}:note`)}
              onChangeValue={(v) => cellEdit.onChangeValue(`${cellKeyPrefix}:note`, v)}
              onStopEdit={cellEdit.onStopEdit}
            />
          </div>
        </div>
      </div>

      {notes ? (
        <div className={styles.notesSection}>
          <div className={styles.notesTitle} style={{ borderColor: token.colorBorderSecondary }}>
            Ghi chú
          </div>
          {notes.length ? (
            <div className={styles.notesGrid}>
              {notes.map((entry, index) => (
                <div key={`${cellKeyPrefix}-${index}`} className={styles.noteItem}>
                  <span className={styles.noteHeading}>{entry.leadName}:</span>{' '}
                  <span style={{ color: token.colorTextSecondary }}>{entry.content}</span>
                </div>
              ))}
            </div>
          ) : (
            <Text type="secondary">Không có ghi chú nào trong khung giờ này.</Text>
          )}
        </div>
      ) : null}
    </div>
  );
}

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

  const resetAndClose = () => {
    setOpen(false);
    setRows(null);
    setSplitByDay(false);
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
      setRows(await fetchTeamSalesReportRows(startAt, endAt, splitByDay));
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Lấy dữ liệu báo cáo thất bại');
    } finally {
      setLoading(false);
    }
  };

  const totals = rows && rows.length > 1 ? sumRows(rows, cellOverrides) : null;

  const cellEdit: CellEditControls = {
    overrides: cellOverrides,
    editingKey: editingCellKey,
    onStartEdit: (key) => setEditingCellKey(key),
    onStopEdit: () => setEditingCellKey(null),
    onChangeValue: (key, value) => setCellOverrides((prev) => ({ ...prev, [key]: value })),
  };

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
        styles={rows ? { body: { padding: 0 } } : undefined}
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
          <div className={styles.reportShell}>
            <div className={styles.reportHeader} style={{ borderColor: token.colorBorderSecondary }}>
              <Title level={5} className={styles.reportTitle} style={{ margin: 0 }}>
                Báo cáo kết quả làm việc Team Sales
              </Title>
              {rows.length ? (
                <Text type="secondary" className={styles.periodSubtitle}>
                  {formatPeriodLabel(rows[0].startAt, rows[rows.length - 1].endAt)}
                </Text>
              ) : null}
            </div>

            <div className={styles.reportScroll}>
              {rows.map((row) => (
                <ReportPeriodSection
                  key={row.startAt}
                  heading={rows.length > 1 ? formatPeriodLabel(row.startAt, row.endAt) : null}
                  values={row}
                  cellKeyPrefix={row.startAt}
                  cellEdit={cellEdit}
                  token={token}
                  notes={row.ghiChu}
                />
              ))}

              {totals ? (
                <ReportPeriodSection
                  heading="TỔNG CỘNG"
                  highlight
                  values={totals}
                  cellKeyPrefix={SUMMARY_ROW_KEY}
                  cellEdit={cellEdit}
                  token={token}
                />
              ) : null}
            </div>
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
            <Space align="center" style={{ marginTop: 4 }}>
              <Switch checked={splitByDay} onChange={setSplitByDay} size="small" />
              <span>Xem theo từng ngày</span>
            </Space>
          </Space>
        )}
      </Modal>
    </>
  );
}
