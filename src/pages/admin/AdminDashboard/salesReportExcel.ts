import ExcelJS from "exceljs";

import type { DashboardSummary, SalesDataDaily, SalesDataMonthly } from "../../../services/dashboardService";
import { dashboardService } from "../../../services";

type ExportType = "monthly" | "yearly";

const PROFIT_MARGIN = 0.3;

const formatDateISO = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getMonthName = (month: number) => new Date(2024, month - 1).toLocaleDateString("id-ID", { month: "long" });

const rupiahNumFmt = "[$Rp-421] #,##0";
const percentNumFmt = "0.0%";

const styleTitleRow = (cell: ExcelJS.Cell) => {
  cell.font = { bold: true, size: 16, color: { argb: "FF111827" } };
  cell.alignment = { vertical: "middle", horizontal: "left" };
};

const styleSubTitleRow = (cell: ExcelJS.Cell) => {
  cell.font = { size: 10, color: { argb: "FF6B7280" } };
  cell.alignment = { vertical: "middle", horizontal: "left" };
};

const styleSectionHeader = (cell: ExcelJS.Cell) => {
  cell.font = { bold: true, size: 12, color: { argb: "FF111827" } };
  cell.alignment = { vertical: "middle", horizontal: "left" };
};

const styleTableHeaderRow = (row: ExcelJS.Row) => {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  row.height = 20;
  row.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } };
    cell.border = {
      top: { style: "thin", color: { argb: "FFE5E7EB" } },
      left: { style: "thin", color: { argb: "FFE5E7EB" } },
      bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
      right: { style: "thin", color: { argb: "FFE5E7EB" } },
    };
  });
};

const styleBodyRange = (worksheet: ExcelJS.Worksheet, fromRow: number, toRow: number, fromCol: number, toCol: number) => {
  for (let r = fromRow; r <= toRow; r++) {
    for (let c = fromCol; c <= toCol; c++) {
      const cell = worksheet.getCell(r, c);
      cell.border = {
        top: { style: "thin", color: { argb: "FFE5E7EB" } },
        left: { style: "thin", color: { argb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
        right: { style: "thin", color: { argb: "FFE5E7EB" } },
      };
      if (r % 2 === 0) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9FAFB" } };
      }
    }
  }
};

const safeSummary = async (): Promise<DashboardSummary | null> => {
  try {
    return await dashboardService.getSummary();
  } catch {
    return null;
  }
};

const safeDaily = async (year: number, month: number): Promise<SalesDataDaily | null> => {
  try {
    return await dashboardService.getSalesByMonth(year, month);
  } catch {
    return null;
  }
};

const safeMonthly = async (year: number): Promise<SalesDataMonthly | null> => {
  try {
    return await dashboardService.getSalesByYear(year);
  } catch {
    return null;
  }
};

const addKpiBlock = (worksheet: ExcelJS.Worksheet, startRow: number, metrics: Array<{ label: string; value: number; numFmt?: string }>) => {
  const labelCol = 1;
  const valueCol = 3;

  metrics.forEach((m, idx) => {
    const r = startRow + idx;
    worksheet.getCell(r, labelCol).value = m.label;
    worksheet.getCell(r, labelCol).font = { bold: true, color: { argb: "FF374151" } };

    const valCell = worksheet.getCell(r, valueCol);
    valCell.value = m.value;
    valCell.font = { bold: true, color: { argb: "FF111827" } };
    valCell.numFmt = m.numFmt || rupiahNumFmt;
  // Keep values close (merged cells + default right-align makes them appear too far).
  valCell.alignment = { vertical: "middle", horizontal: "left" };

    worksheet.mergeCells(r, 1, r, 2);
    worksheet.mergeCells(r, 3, r, 6);

    for (let c = 1; c <= 6; c++) {
      worksheet.getCell(r, c).border = {
        top: { style: "thin", color: { argb: "FFE5E7EB" } },
        left: { style: "thin", color: { argb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
        right: { style: "thin", color: { argb: "FFE5E7EB" } },
      };
    }
  });
};

const autoWidth = (worksheet: ExcelJS.Worksheet, min = 10, max = 45) => {
  worksheet.columns.forEach((col) => {
    if (!col) return;
    let widest = Math.max(min, typeof col.width === "number" ? col.width : min);
    col.eachCell?.({ includeEmpty: true }, (cell) => {
      const raw = cell.value;
      const text = raw == null ? "" : typeof raw === "object" ? JSON.stringify(raw) : String(raw);
      widest = Math.max(widest, Math.min(max, text.length + 2));
    });
    col.width = widest;
  });
};

export const generateSalesReportExcel = async (params: { type: ExportType; year: number; month?: number }): Promise<Blob> => {
  const { type, year, month } = params;

  const [summary, monthly, daily] = await Promise.all([
    safeSummary(),
    safeMonthly(year),
    type === "monthly" && month ? safeDaily(year, month) : Promise.resolve(null),
  ]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sekawan Ring";
  workbook.created = new Date();

  const ringkasan = workbook.addWorksheet("Ringkasan", {
    views: [{ state: "frozen", ySplit: 3 }],
    properties: { defaultRowHeight: 18 },
  });

  ringkasan.columns = [
    { key: "c1", width: 26 },
    { key: "c2", width: 6 },
    { key: "c3", width: 16 },
    { key: "c4", width: 14 },
    { key: "c5", width: 12 },
    { key: "c6", width: 12 },
  ];

  const title = type === "monthly" && month ? `Rekap Penjualan — ${getMonthName(month)} ${year}` : `Rekap Penjualan — Tahun ${year}`;
  ringkasan.mergeCells("A1:F1");
  ringkasan.getCell("A1").value = title;
  styleTitleRow(ringkasan.getCell("A1"));

  ringkasan.mergeCells("A2:F2");
  ringkasan.getCell("A2").value = `Dibuat: ${new Date().toLocaleString("id-ID")} • Margin Profit asumsi: ${(PROFIT_MARGIN * 100).toFixed(0)}%`;
  styleSubTitleRow(ringkasan.getCell("A2"));

  let periodRevenue = 0;
  if (type === "monthly" && month && daily) {
    periodRevenue = daily.data.reduce((s, d) => s + (Number.parseFloat(d.total) || 0), 0);
  } else if (monthly) {
    periodRevenue = monthly.data.reduce((s, d) => s + (Number.parseFloat(d.total) || 0), 0);
  }
  const periodProfit = Math.round(periodRevenue * PROFIT_MARGIN);

  const metricRowsStart = 4;
  ringkasan.getCell("A3").value = "Ringkasan Periode";
  styleSectionHeader(ringkasan.getCell("A3"));
  ringkasan.mergeCells("A3:F3");

  addKpiBlock(ringkasan, metricRowsStart, [
    { label: "Total Pendapatan (Periode)", value: Math.round(periodRevenue), numFmt: rupiahNumFmt },
    { label: "Estimasi Profit (Periode)", value: Math.round(periodProfit), numFmt: rupiahNumFmt },
    { label: "Estimasi HPP (Periode)", value: Math.round(periodRevenue - periodProfit), numFmt: rupiahNumFmt },
  ]);

  const sectionStart = metricRowsStart + 5;

  ringkasan.getCell(`A${sectionStart}`).value = "Pesanan per Status";
  styleSectionHeader(ringkasan.getCell(`A${sectionStart}`));
  ringkasan.mergeCells(`A${sectionStart}:F${sectionStart}`);

  const statusHeaderRow = ringkasan.getRow(sectionStart + 1);
  statusHeaderRow.values = ["", "Status", "Jumlah"];
  ringkasan.mergeCells(sectionStart + 1, 2, sectionStart + 1, 4);
  ringkasan.mergeCells(sectionStart + 1, 5, sectionStart + 1, 6);
  styleTableHeaderRow(statusHeaderRow);

  const statusRows = summary
    ? [
        { status: "Pending", count: summary.orders_per_status.pending || 0 },
        { status: "Dibayar", count: summary.orders_per_status.paid || 0 },
        { status: "Dikirim", count: summary.orders_per_status.shipped || 0 },
        { status: "Selesai", count: summary.orders_per_status.completed || 0 },
      ]
    : [];

  statusRows.forEach((r, idx) => {
    const rowIdx = sectionStart + 2 + idx;
    ringkasan.mergeCells(rowIdx, 2, rowIdx, 4);
    ringkasan.mergeCells(rowIdx, 5, rowIdx, 6);
    ringkasan.getCell(rowIdx, 2).value = r.status;
    const countCell = ringkasan.getCell(rowIdx, 5);
    countCell.value = r.count;
    countCell.numFmt = "#,##0";
    countCell.alignment = { vertical: "middle", horizontal: "center" };
  });
  if (statusRows.length) {
    styleBodyRange(ringkasan, sectionStart + 2, sectionStart + 1 + statusRows.length + 1, 2, 6);
  }

  const catStart = sectionStart + 2 + Math.max(statusRows.length, 1) + 3;
  ringkasan.getCell(`A${catStart}`).value = "Penjualan per Katalog (Top)";
  styleSectionHeader(ringkasan.getCell(`A${catStart}`));
  ringkasan.mergeCells(`A${catStart}:F${catStart}`);

  const catHeaderRow = ringkasan.getRow(catStart + 1);
  catHeaderRow.values = ["", "Katalog", "Terjual (ekor)"];
  ringkasan.mergeCells(catStart + 1, 2, catStart + 1, 4);
  ringkasan.mergeCells(catStart + 1, 5, catStart + 1, 6);
  styleTableHeaderRow(catHeaderRow);

  const catalogRows = (summary?.orders_per_catalog || [])
    .slice()
    .sort((a, b) => (Number(b.total_sold) || 0) - (Number(a.total_sold) || 0))
    .slice(0, 10)
    .map((c) => ({ name: c.name, sold: Number(c.total_sold) || 0 }));

  catalogRows.forEach((r, idx) => {
    const rowIdx = catStart + 2 + idx;
    ringkasan.mergeCells(rowIdx, 2, rowIdx, 4);
    ringkasan.mergeCells(rowIdx, 5, rowIdx, 6);
    ringkasan.getCell(rowIdx, 2).value = r.name;
    const soldCell = ringkasan.getCell(rowIdx, 5);
    soldCell.value = r.sold;
    soldCell.numFmt = "#,##0";
    soldCell.alignment = { vertical: "middle", horizontal: "center" };
  });
  if (catalogRows.length) {
    styleBodyRange(ringkasan, catStart + 2, catStart + 1 + catalogRows.length + 1, 2, 6);
  }

  if (type === "monthly" && month) {
    const detailHarian = workbook.addWorksheet("Detail Harian", {
      views: [{ state: "frozen", ySplit: 1 }],
      properties: { defaultRowHeight: 18 },
    });

    detailHarian.columns = [
      { header: "No", key: "no", width: 6 },
      { header: "Tanggal", key: "tanggal", width: 14 },
      { header: "Hari", key: "hari", width: 12 },
      { header: "Pendapatan", key: "revenue", width: 18 },
      { header: "Estimasi Profit", key: "profit", width: 18 },
      { header: "Akumulasi Pendapatan", key: "cumRevenue", width: 20 },
      { header: "Akumulasi Profit", key: "cumProfit", width: 18 },
      { header: "Catatan", key: "note", width: 28 },
    ];

    const header = detailHarian.getRow(1);
    styleTableHeaderRow(header);

    const rows = (daily?.data || []).slice().sort((a, b) => a.day - b.day);
    let runningRev = 0;
    let runningProfit = 0;

    rows.forEach((d, idx) => {
      const revenue = Number.parseFloat(d.total) || 0;
      const profit = Math.round(revenue * PROFIT_MARGIN);
      runningRev += revenue;
      runningProfit += profit;

      const dateObj = new Date(year, month - 1, d.day);
      const dayName = dateObj.toLocaleDateString("id-ID", { weekday: "long" });

      detailHarian.addRow({
        no: idx + 1,
        tanggal: formatDateISO(dateObj),
        hari: dayName,
        revenue: Math.round(revenue),
        profit,
        cumRevenue: Math.round(runningRev),
        cumProfit: Math.round(runningProfit),
        note: "",
      });
    });

    if (rows.length) {
      const totalRow = detailHarian.addRow({
        no: "",
        tanggal: "TOTAL",
        hari: "",
        revenue: Math.round(runningRev),
        profit: Math.round(runningProfit),
        cumRevenue: "",
        cumProfit: "",
        note: "",
      });
      totalRow.font = { bold: true };
    }

    detailHarian.getColumn("revenue").numFmt = rupiahNumFmt;
    detailHarian.getColumn("profit").numFmt = rupiahNumFmt;
    detailHarian.getColumn("cumRevenue").numFmt = rupiahNumFmt;
    detailHarian.getColumn("cumProfit").numFmt = rupiahNumFmt;
    detailHarian.getColumn("revenue").alignment = { vertical: "middle", horizontal: "right" };
    detailHarian.getColumn("profit").alignment = { vertical: "middle", horizontal: "right" };
    detailHarian.getColumn("cumRevenue").alignment = { vertical: "middle", horizontal: "right" };
    detailHarian.getColumn("cumProfit").alignment = { vertical: "middle", horizontal: "right" };

    styleBodyRange(detailHarian, 2, detailHarian.rowCount, 1, detailHarian.columnCount);
    autoWidth(detailHarian);
  }

  const detailBulanan = workbook.addWorksheet("Detail Bulanan", {
    views: [{ state: "frozen", ySplit: 1 }],
    properties: { defaultRowHeight: 18 },
  });

  detailBulanan.columns = [
    { header: "No", key: "no", width: 6 },
    { header: "Bulan", key: "bulan", width: 14 },
    { header: "Pendapatan", key: "revenue", width: 18 },
    { header: "Estimasi Profit", key: "profit", width: 18 },
    { header: "MoM %", key: "mom", width: 10 },
    { header: "Akumulasi Pendapatan", key: "cumRevenue", width: 20 },
  ];

  styleTableHeaderRow(detailBulanan.getRow(1));

  const monthsRows = (monthly?.data || []).slice().sort((a, b) => a.month - b.month);
  let cum = 0;
  let prev = 0;

  monthsRows.forEach((m, idx) => {
    const revenue = Number.parseFloat(m.total) || 0;
    const profit = Math.round(revenue * PROFIT_MARGIN);
    cum += revenue;

    const mom = idx === 0 || prev === 0 ? null : (revenue - prev) / prev;
    prev = revenue;

    detailBulanan.addRow({
      no: idx + 1,
      bulan: getMonthName(m.month),
      revenue: Math.round(revenue),
      profit,
      mom,
      cumRevenue: Math.round(cum),
    });
  });

  if (monthsRows.length) {
    const totalRow = detailBulanan.addRow({
      no: "",
      bulan: "TOTAL",
      revenue: Math.round(cum),
      profit: Math.round(cum * PROFIT_MARGIN),
      mom: "",
      cumRevenue: "",
    });
    totalRow.font = { bold: true };
  }

  detailBulanan.getColumn("revenue").numFmt = rupiahNumFmt;
  detailBulanan.getColumn("profit").numFmt = rupiahNumFmt;
  detailBulanan.getColumn("cumRevenue").numFmt = rupiahNumFmt;
  detailBulanan.getColumn("mom").numFmt = percentNumFmt;
  detailBulanan.getColumn("revenue").alignment = { vertical: "middle", horizontal: "right" };
  detailBulanan.getColumn("profit").alignment = { vertical: "middle", horizontal: "right" };
  detailBulanan.getColumn("cumRevenue").alignment = { vertical: "middle", horizontal: "right" };
  detailBulanan.getColumn("mom").alignment = { vertical: "middle", horizontal: "right" };

  styleBodyRange(detailBulanan, 2, detailBulanan.rowCount, 1, detailBulanan.columnCount);
  autoWidth(detailBulanan);

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};
