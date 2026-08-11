import type { TeamSalesReportRow } from '@/lib/services/team-sales-report.service';
import { VN_TIMEZONE } from '@/lib/utils/vn-date';

const REPORT_TITLE = 'BÁO CÁO KẾT QUẢ LÀM VIỆC TEAM SALES';

const COLUMNS = [
  { header: 'Stt', width: 8 },
  { header: 'Ngày', width: 30 },
  { header: 'Data nhận', width: 12 },
  { header: 'Chăm zalo', width: 12 },
  { header: 'Tương tác/ quan tâm', width: 16 },
  { header: 'Ít tương tác', width: 16 },
  { header: 'Chưa tiếp cận', width: 14 },
  { header: 'Rác/KQT', width: 12 },
  { header: 'SL HV đến', width: 12 },
  { header: 'SL HV chốt', width: 12 },
  { header: 'Doanh thu', width: 16 },
  { header: 'Công nợ', width: 16 },
  { header: 'Ghi chú', width: 24 },
] as const;

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

type SumField =
  | 'dataNhan'
  | 'chamZalo'
  | 'tuongTacQuanTam'
  | 'itTuongTac'
  | 'chuaTiepCan'
  | 'racKqt'
  | 'slHvDen'
  | 'slHvChot'
  | 'doanhThu'
  | 'congNo';

const SUM_FIELDS: SumField[] = [
  'dataNhan',
  'chamZalo',
  'tuongTacQuanTam',
  'itTuongTac',
  'chuaTiepCan',
  'racKqt',
  'slHvDen',
  'slHvChot',
  'doanhThu',
  'congNo',
];

function sumRows(rows: TeamSalesReportRow[]): Record<SumField, number> {
  const totals = Object.fromEntries(SUM_FIELDS.map((field) => [field, 0])) as Record<
    SumField,
    number
  >;
  for (const row of rows) {
    for (const field of SUM_FIELDS) {
      totals[field] += row[field];
    }
  }
  return totals;
}

export async function exportTeamSalesReportToExcel(
  rows: TeamSalesReportRow[],
  fileName = `bao-cao-team-sales-${Date.now()}.xlsx`,
): Promise<void> {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Báo cáo');

  sheet.columns = COLUMNS.map((col) => ({ width: col.width }));

  const titleRow = sheet.addRow([REPORT_TITLE]);
  sheet.mergeCells(titleRow.number, 1, titleRow.number, COLUMNS.length);
  titleRow.font = { bold: true, size: 13 };
  titleRow.height = 22;

  sheet.addRow([]);

  const headerRow = sheet.addRow(COLUMNS.map((col) => col.header));
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9E8C8' },
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
  headerRow.height = 34;

  rows.forEach((row, index) => {
    const dataRow = sheet.addRow([
      index + 1,
      formatPeriodLabel(row.startAt, row.endAt),
      row.dataNhan,
      row.chamZalo,
      row.tuongTacQuanTam,
      row.itTuongTac,
      row.chuaTiepCan,
      row.racKqt,
      row.slHvDen,
      row.slHvChot,
      row.doanhThu,
      row.congNo,
      row.ghiChu,
    ]);
    dataRow.eachCell((cell) => {
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    dataRow.getCell(11).numFmt = '#,##0';
    dataRow.getCell(12).numFmt = '#,##0';
    dataRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    dataRow.getCell(13).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  });

  if (rows.length > 1) {
    const totals = sumRows(rows);
    const totalRow = sheet.addRow([
      '',
      'Tổng',
      totals.dataNhan,
      totals.chamZalo,
      totals.tuongTacQuanTam,
      totals.itTuongTac,
      totals.chuaTiepCan,
      totals.racKqt,
      totals.slHvDen,
      totals.slHvChot,
      totals.doanhThu,
      totals.congNo,
      '',
    ]);
    totalRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    totalRow.getCell(11).numFmt = '#,##0';
    totalRow.getCell(12).numFmt = '#,##0';
    totalRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
