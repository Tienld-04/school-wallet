import ExcelJS from 'exceljs';
import type {
  MerchantBreakdown,
  MerchantEarningsOverview,
  MerchantEarningsTimeSeriesPoint,
} from '../types';

const MONEY_FMT = '#,##0" đ"';
const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF4F46E5' },
};

interface ExportParams {
  from: string;
  to: string;
  overview: MerchantEarningsOverview | null;
  /** Time series ở mức "day" — chi tiết doanh thu theo từng ngày. */
  daily: MerchantEarningsTimeSeriesPoint[];
  byMerchant: MerchantBreakdown[];
  resolveMerchantName: (id: string) => string;
}

/** "2026-06-01" → Date local (tránh lệch timezone của new Date(isoString)). */
const parseLocalDate = (period: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(period);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
};

/** Date local → "yyyy-MM-dd" (khớp key period từ backend). */
const dateKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Mọi ngày trong [from, to] (bao gồm 2 đầu mút). */
const eachDay = (from: string, to: string): Date[] => {
  const start = parseLocalDate(from);
  const end = parseLocalDate(to);
  if (!start || !end) return [];
  const days: Date[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
};

const styleHeaderRow = (row: ExcelJS.Row) => {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = HEADER_FILL;
    cell.alignment = { vertical: 'middle' };
  });
};

/**
 * Xuất doanh thu của user chủ merchant ra file .xlsx (3 sheet).
 * Toàn bộ chạy trên trình duyệt — không gọi backend thêm.
 */
export async function exportMerchantRevenue({
  from,
  to,
  overview,
  daily,
  byMerchant,
  resolveMerchantName,
}: ExportParams): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'School Wallet';

  // ── Sheet 1: Tổng quan ──
  const s1 = wb.addWorksheet('Tổng quan');
  s1.columns = [{ width: 28 }, { width: 22 }];
  s1.mergeCells('A1:B1');
  const title = s1.getCell('A1');
  title.value = 'BÁO CÁO DOANH THU';
  title.font = { bold: true, size: 14, color: { argb: 'FF4F46E5' } };
  s1.getCell('A2').value = 'Khoảng thời gian';
  s1.getCell('B2').value = `${from} → ${to}`;
  s1.getCell('A2').font = { bold: true };

  const kpis: Array<[string, number | string, boolean]> = [
    ['Tổng khách trả', overview?.grossRevenue ?? 0, true],
    ['Thực nhận vào ví', overview?.netRevenue ?? 0, true],
    ['Phí nền tảng', overview?.totalFee ?? 0, true],
    ['Số giao dịch', overview?.transactionCount ?? 0, false],
    ['Trung bình thực nhận / GD', overview?.averageNetPerTx ?? 0, true],
    [
      'Top dịch vụ',
      overview?.topMerchantId ? resolveMerchantName(overview.topMerchantId) : '—',
      false,
    ],
    ['Doanh thu top dịch vụ', overview?.topMerchantNetRevenue ?? 0, true],
  ];
  let r = 4;
  for (const [label, value, isMoney] of kpis) {
    s1.getCell(`A${r}`).value = label;
    s1.getCell(`A${r}`).font = { bold: true };
    const valCell = s1.getCell(`B${r}`);
    valCell.value = value;
    if (isMoney) valCell.numFmt = MONEY_FMT;
    r += 1;
  }

  // ── Sheet 2: Theo ngày (chi tiết) ──
  const s2 = wb.addWorksheet('Theo ngày');
  s2.columns = [
    { header: 'Ngày', key: 'date', width: 14 },
    { header: 'Số GD', key: 'count', width: 10 },
    { header: 'Khách trả', key: 'gross', width: 16, style: { numFmt: MONEY_FMT } },
    { header: 'Phí nền tảng', key: 'fee', width: 16, style: { numFmt: MONEY_FMT } },
    { header: 'Thực nhận', key: 'net', width: 16, style: { numFmt: MONEY_FMT } },
  ];
  styleHeaderRow(s2.getRow(1));

  // Map period(yyyy-MM-dd) → điểm dữ liệu, để tra cứu khi điền từng ngày.
  const dailyMap = new Map(daily.map((p) => [p.period.slice(0, 10), p]));

  // Dòng "Tổng cộng" đặt NGAY dưới header (ở trên cùng).
  const totalRow = s2.addRow({
    date: 'Tổng cộng',
    count: daily.reduce((s, p) => s + p.count, 0),
    gross: daily.reduce((s, p) => s + p.grossRevenue, 0),
    fee: daily.reduce((s, p) => s + (p.grossRevenue - p.netRevenue), 0),
    net: daily.reduce((s, p) => s + p.netRevenue, 0),
  });
  totalRow.font = { bold: true };

  // Liệt kê MỌI ngày trong khoảng (kể cả ngày không có giao dịch → 0).
  for (const d of eachDay(from, to)) {
    const p = dailyMap.get(dateKey(d));
    const gross = p?.grossRevenue ?? 0;
    const net = p?.netRevenue ?? 0;
    const row = s2.addRow({
      date: d,
      count: p?.count ?? 0,
      gross,
      fee: gross - net,
      net,
    });
    row.getCell('date').numFmt = 'dd/mm/yyyy';
  }
  // Đóng băng header + dòng tổng để luôn thấy khi cuộn.
  s2.views = [{ state: 'frozen', ySplit: 2 }];

  // ── Sheet 3: Theo dịch vụ ──
  const s3 = wb.addWorksheet('Theo dịch vụ');
  s3.columns = [
    { header: 'Dịch vụ', key: 'name', width: 28 },
    { header: 'Số GD', key: 'count', width: 10 },
    { header: 'Khách trả', key: 'gross', width: 16, style: { numFmt: MONEY_FMT } },
    { header: 'Thực nhận', key: 'net', width: 16, style: { numFmt: MONEY_FMT } },
    { header: 'Tỉ lệ', key: 'pct', width: 10, style: { numFmt: '0.0%' } },
  ];
  styleHeaderRow(s3.getRow(1));
  const totalNet = byMerchant.reduce((s, m) => s + m.netRevenue, 0);
  for (const m of byMerchant) {
    s3.addRow({
      name: resolveMerchantName(m.merchantId),
      count: m.transactionCount,
      gross: m.grossRevenue,
      net: m.netRevenue,
      pct: totalNet > 0 ? m.netRevenue / totalNet : 0,
    });
  }
  if (byMerchant.length > 0) {
    const totalRow = s3.addRow({
      name: 'Tổng cộng',
      count: byMerchant.reduce((s, m) => s + m.transactionCount, 0),
      gross: byMerchant.reduce((s, m) => s + m.grossRevenue, 0),
      net: totalNet,
      pct: totalNet > 0 ? 1 : 0,
    });
    totalRow.font = { bold: true };
  }
  s3.views = [{ state: 'frozen', ySplit: 1 }];

  // ── Xuất & tải ──
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `doanh-thu_${from}_${to}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
