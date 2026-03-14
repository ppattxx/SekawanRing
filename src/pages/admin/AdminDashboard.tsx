import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Area, BarChart, Bar, PieChart, Pie, Cell, Tooltip, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, ComposedChart, ReferenceLine } from "recharts";
import { dashboardService } from "../../services";
import type { DashboardSummary, SalesDataMonthly, SalesDataDaily } from "../../services/dashboardService";

type TrendFilter = "daily" | "monthly" | "yearly";
type DailyZoom = "week" | "month";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string }>;
  label?: string;
}

interface ChartDataPoint {
  label: string;
  revenue: number;
  profit: number;
  target?: number;
  lastYear?: number;
  fullDate?: string;
}

interface KpiCardProps {
  title: string;
  value: string;
  sub?: string;
  color: string;
  bgColor: string;
  trend?: "up" | "down" | "neutral";
  trendVal?: string | number;
  trendLabel?: string;
}

interface QuickInsight {
  type: "success" | "warning" | "alert";
  title: string;
  message: string;
  action?: string;
  actionLink?: string;
}

interface DailyChartProps {
  allDays: ChartDataPoint[];
  activeSeries: Record<string, boolean>;
  onToggleSeries: (key: string) => void;
  trendSeries: { key: string; label: string; color: string }[];
  selectedMonth: number;
  selectedYear: number;
}

const fmt = (n: number): string => {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(2)}M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  return `Rp ${(n / 1_000).toFixed(0)}rb`;
};

const fmtShort = (n: number): string => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}rb`;
  return `${n}`;
};

const getMonthName = (month: number, short = false): string => {
  const months = short ? ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"] : ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  return months[month - 1] || "";
};

const generateYearOptions = (maxYear: number = new Date().getFullYear(), minYear: number = 2020): number[] => {
  const years: number[] = [];
  for (let y = maxYear; y >= minYear; y--) years.push(y);
  return years;
};

const getDefaultCompareYear = (selectedYear: number, minYear: number = 2020): number => {
  const prevYear = selectedYear - 1;
  return prevYear >= minYear ? prevYear : minYear;
};

const DAY_NAMES_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const PROFIT_MARGIN = 0.3;

const groupByWeek = (dailyData: ChartDataPoint[]): { weeks: ChartDataPoint[][]; weekLabels: string[] } => {
  const chunkSize = 7;
  const weeks: ChartDataPoint[][] = [];
  const weekLabels: string[] = [];
  for (let i = 0; i < dailyData.length; i += chunkSize) {
    const chunk = dailyData.slice(i, i + chunkSize);
    weeks.push(chunk);
    weekLabels.push(`Minggu ${Math.floor(i / chunkSize) + 1}`);
  }
  return { weeks, weekLabels };
};

const generateQuickInsights = (summary: DashboardSummary): QuickInsight[] => {
  const insights: QuickInsight[] = [];
  const topCatalog = summary.orders_per_catalog.slice().sort((a, b) => Number(b.total_sold) - Number(a.total_sold))[0];
  if (topCatalog && Number(topCatalog.total_sold) > 0) {
    insights.push({
      type: "success",
      title: "Katalog Terlaris",
      message: `${topCatalog.name} terjual ${Number(topCatalog.total_sold).toLocaleString("id")} ekor`,
    });
  }
  const completionRate = summary.total_orders > 0 ? Math.round((summary.orders_per_status.completed / summary.total_orders) * 100) : 0;
  if (completionRate >= 80) {
    insights.push({
      type: "success",
      title: "Penyelesaian Tinggi",
      message: `${completionRate}% order berhasil diselesaikan — performa sangat baik!`,
    });
  }
  const pendingCount = summary.orders_per_status.pending || 0;
  if (pendingCount > 0) {
    insights.push({
      type: "warning",
      title: "Order Menunggu Konfirmasi",
      message: `${pendingCount} order masih pending, segera proses`,
      action: "Kelola Pesanan",
      actionLink: "/admin/orders",
    });
  }
  return insights;
};

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-2xl p-4 text-sm min-w-[180px]">
      <p className="font-bold text-gray-700 mb-2 border-b border-gray-100 pb-2 text-xs uppercase tracking-wider">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex justify-between items-center gap-4 mt-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-gray-500 text-xs">{p.name}</span>
          </div>
          <span className="font-bold text-gray-800 text-xs">{typeof p.value === "number" && p.value > 1000 ? fmt(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-xl p-3 text-xs">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.payload.color || d.fill }} />
        <span className="font-bold text-gray-700">{d.name}</span>
      </div>
      <p className="text-gray-500">
        {d.value?.toLocaleString("id")} {d.payload.unit || "order"}
      </p>
    </div>
  );
};

const KpiCard = ({ title, value, sub, color, bgColor, trend, trendVal, trendLabel }: KpiCardProps) => (
  <div className="rounded-2xl p-5 relative overflow-hidden hover:scale-[1.02] transition-all duration-200 shadow-sm cursor-default" style={{ background: bgColor, border: `1.5px solid ${color}22` }}>
    <div className="absolute -right-5 -top-5 w-28 h-28 rounded-full opacity-10" style={{ background: color }} />
    <div className="relative z-10">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-black text-gray-800 mt-1 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
    {trendVal !== undefined && (
      <div className={`mt-3 flex items-center gap-1 text-xs font-semibold ${trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-500" : "text-gray-400"}`}>
        <span className="text-base">{trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}</span>
        <span>{trendVal}%</span>
        <span className="text-gray-400 font-normal">{trendLabel ?? "vs periode lalu"}</span>
      </div>
    )}
  </div>
);

const TrendTabs = ({ value, onChange }: { value: TrendFilter; onChange: (v: TrendFilter) => void }) => {
  const tabs: { label: string; value: TrendFilter }[] = [
    { label: "Harian", value: "daily" },
    { label: "Bulanan", value: "monthly" },
    { label: "Tahunan", value: "yearly" },
  ];
  return (
    <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${value === tab.value ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

const SeriesToggle = ({ series, active, onToggle }: { series: { key: string; label: string; color: string }[]; active: Record<string, boolean>; onToggle: (key: string) => void }) => (
  <div className="flex flex-wrap gap-2">
    {series.map((s) => (
      <button
        key={s.key}
        onClick={() => onToggle(s.key)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${active[s.key] ? "bg-white shadow-sm border-gray-200 text-gray-700" : "bg-gray-100 border-transparent text-gray-400"}`}
      >
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color, opacity: active[s.key] ? 1 : 0.3 }} />
        {s.label}
      </button>
    ))}
  </div>
);

const DailyInteractiveChart = ({ allDays, activeSeries, onToggleSeries, trendSeries, selectedMonth, selectedYear }: DailyChartProps) => {
  const { weeks, weekLabels } = groupByWeek(allDays);
  const totalWeeks = weeks.length;
  const [zoom, setZoom] = useState<DailyZoom>("week");
  const [weekIndex, setWeekIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setWeekIndex(0);
  }, [selectedMonth, selectedYear]);

  const currentWeekDays = weeks[weekIndex] || [];
  const displayData: ChartDataPoint[] = zoom === "month" ? allDays : currentWeekDays;
  const weekRevenue = currentWeekDays.reduce((s, d) => s + d.revenue, 0);
  const monthRevenue = allDays.reduce((s, d) => s + d.revenue, 0);
  const avgRevenue = displayData.length > 0 ? displayData.reduce((s, d) => s + d.revenue, 0) / displayData.length : 0;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || zoom === "month") return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && weekIndex < totalWeeks - 1) setWeekIndex((p) => p + 1);
      if (diff < 0 && weekIndex > 0) setWeekIndex((p) => p - 1);
    }
    touchStartX.current = null;
  };

  const xInterval = zoom === "month" ? (allDays.length > 20 ? 2 : 0) : 0;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5">
            <button onClick={() => setZoom("week")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${zoom === "week" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500"}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
              Per Minggu
            </button>
            <button onClick={() => setZoom("month")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${zoom === "month" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500"}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
              Seluruh Bulan
            </button>
          </div>
          {zoom === "week" && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setWeekIndex((p) => Math.max(0, p - 1))}
                disabled={weekIndex === 0}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                ‹
              </button>
              <div className="flex gap-1">
                {weekLabels.map((_, i) => (
                  <button key={i} onClick={() => setWeekIndex(i)} className={`w-2 h-2 rounded-full transition-all duration-200 ${i === weekIndex ? "bg-emerald-500 w-4" : "bg-gray-300 hover:bg-gray-400"}`} />
                ))}
              </div>
              <button
                onClick={() => setWeekIndex((p) => Math.min(totalWeeks - 1, p + 1))}
                disabled={weekIndex === totalWeeks - 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                ›
              </button>
            </div>
          )}
        </div>
        {zoom === "week" && (
          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-3 py-1 rounded-lg border border-emerald-100">
              {weekLabels[weekIndex]} — {getMonthName(selectedMonth, true)} {selectedYear}
            </span>
            <span className="text-xs text-gray-400">Geser chart untuk pindah minggu</span>
          </div>
        )}
        {zoom === "month" && (
          <span className="text-xs text-gray-400">
            Semua hari — {getMonthName(selectedMonth)} {selectedYear}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          {
            label: zoom === "week" ? `Pendapatan ${weekLabels[weekIndex] || ""}` : "Pendapatan Bulan",
            val: fmt(zoom === "week" ? weekRevenue : monthRevenue),
            color: "#10b981",
            sub: zoom === "week" ? `dari ${fmt(monthRevenue)} bulan ini` : `${allDays.length} hari`,
          },
          {
            label: "Profit",
            val: fmt((zoom === "week" ? weekRevenue : monthRevenue) * PROFIT_MARGIN),
            color: "#0ea5e9",
            sub: `Margin ${(PROFIT_MARGIN * 100).toFixed(0)}%`,
          },
          {
            label: "Avg / Hari",
            val: fmt(avgRevenue),
            color: "#8b5cf6",
            sub: `dari ${displayData.length} hari`,
          },
          {
            label: "Hari Terbaik",
            val: (() => {
              const best = [...displayData].sort((a, b) => b.revenue - a.revenue)[0];
              return best ? best.label : "-";
            })(),
            color: "#f59e0b",
            sub: fmt(Math.max(...displayData.map((d) => d.revenue), 0)),
          },
        ].map((s) => (
          <div key={s.label} className="text-center bg-gray-50 rounded-xl py-2.5 px-2">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide truncate">{s.label}</p>
            <p className="text-sm font-black mt-0.5 truncate" style={{ color: s.color }}>
              {s.val}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5 truncate">{s.sub}</p>
          </div>
        ))}
      </div>

      <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} className="select-none">
        <ResponsiveContainer width="100%" height={380}>
          <ComposedChart data={displayData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="gDailyRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gDailyProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: zoom === "week" ? 12 : 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} interval={xInterval} />
            <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={52} />
            <Tooltip content={<CustomTooltip />} />
            {avgRevenue > 0 && <ReferenceLine y={avgRevenue} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: "rata-rata", fill: "#94a3b8", fontSize: 10, position: "insideTopRight" }} />}
            {activeSeries.target && <Area type="monotone" dataKey="target" name="Target" stroke="#d1d5db" strokeDasharray="5 5" fill="none" strokeWidth={1.5} dot={false} />}
            {activeSeries.revenue && (
              <Area
                type="monotone"
                dataKey="revenue"
                name="Pendapatan"
                stroke="#10b981"
                fill="url(#gDailyRev)"
                strokeWidth={zoom === "week" ? 3 : 2.5}
                dot={zoom === "week" ? { r: 5, fill: "#10b981", strokeWidth: 2, stroke: "#fff" } : { r: 2.5, fill: "#10b981", strokeWidth: 1.5, stroke: "#fff" }}
                activeDot={{ r: 7, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
              />
            )}
            {activeSeries.profit && (
              <Area
                type="monotone"
                dataKey="profit"
                name="Profit"
                stroke="#0ea5e9"
                fill="url(#gDailyProfit)"
                strokeWidth={zoom === "week" ? 2.5 : 2}
                dot={zoom === "week" ? { r: 4, fill: "#0ea5e9", strokeWidth: 2, stroke: "#fff" } : { r: 2, fill: "#0ea5e9", strokeWidth: 1.5, stroke: "#fff" }}
                activeDot={{ r: 6, fill: "#0ea5e9", stroke: "#fff", strokeWidth: 2 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {zoom === "week" && weeks.length > 1 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Overview Bulan — klik minggu untuk navigasi</p>
          <div className="flex gap-2 items-end h-12">
            {weeks.map((wk, i) => {
              const wkRev = wk.reduce((s, d) => s + d.revenue, 0);
              const maxWkRev = Math.max(...weeks.map((w) => w.reduce((s, d) => s + d.revenue, 0)), 1);
              const pct = Math.round((wkRev / maxWkRev) * 100);
              return (
                <button key={i} onClick={() => setWeekIndex(i)} className="flex-1 flex flex-col items-center gap-1 group">
                  <div
                    className="w-full rounded-t-md transition-all duration-300 relative"
                    style={{
                      height: `${Math.max(pct * 0.4, 6)}px`,
                      background: i === weekIndex ? "#10b981" : "#e2e8f0",
                    }}
                  />
                  <span className={`text-[9px] font-semibold transition-colors ${i === weekIndex ? "text-emerald-600" : "text-gray-400"}`}>M{i + 1}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
        <SeriesToggle series={trendSeries} active={activeSeries} onToggle={onToggleSeries} />
        {zoom === "week" && <p className="text-[10px] text-gray-400 hidden sm:block">💡 Tip: Geser kiri/kanan untuk pindah minggu</p>}
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [salesData, setSalesData] = useState<SalesDataMonthly | null>(null);
  const [dailySalesData, setDailySalesData] = useState<SalesDataDaily | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval] = useState(30000);

  const [trendFilter, setTrendFilter] = useState<TrendFilter>("daily");
  const [activeSeries, setActiveSeries] = useState<Record<string, boolean>>({
    revenue: true,
    profit: true,
    target: true,
  });
  const [barSelectedYear, setBarSelectedYear] = useState<number>(new Date().getFullYear());
  const [barCompareYear, setBarCompareYear] = useState<number>(() => getDefaultCompareYear(new Date().getFullYear()));
  const [statusView, setStatusView] = useState<"donut" | "bar">("donut");

  const toggleSeries = (key: string) => setActiveSeries((prev) => ({ ...prev, [key]: !prev[key] }));

  const loadDashboardData = useCallback(async () => {
    try {
      setError(null);
      const summaryData = await dashboardService.getSummary();
      setSummary(summaryData);
      const dailyData = await dashboardService.getSalesByMonth(selectedYear, selectedMonth);
      setDailySalesData(dailyData);
      const yearlyData = await dashboardService.getSalesByYear(selectedYear);
      setSalesData(yearlyData);
      setLastUpdated(new Date());
    } catch (err) {
      setError("Gagal memuat data dashboard. Periksa koneksi API.");
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadDashboardData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadDashboardData]);

  const allDaysData = useCallback((): ChartDataPoint[] => {
    if (!dailySalesData) return [];
    return dailySalesData.data.map((item) => {
      const revenue = Number(parseFloat(item.total)) || 0;
      const date = new Date(selectedYear, selectedMonth - 1, item.day);
      const dayName = DAY_NAMES_SHORT[date.getDay()];
      return {
        label: `${dayName} ${item.day}`,
        fullDate: `${item.day} ${getMonthName(selectedMonth, true)}`,
        revenue,
        profit: Math.round(revenue * PROFIT_MARGIN),
        target: Math.round(revenue * 1.1),
      };
    });
  }, [dailySalesData, selectedYear, selectedMonth]);

  const prepareMonthlyData = useCallback((): ChartDataPoint[] => {
    if (!salesData) return [];
    return salesData.data.map((item) => {
      const revenue = Number(parseFloat(item.total)) || 0;
      return {
        label: getMonthName(item.month, true),
        revenue,
        profit: Math.round(revenue * PROFIT_MARGIN),
        target: Math.round(revenue * 1.15),
        lastYear: Math.round(revenue * 0.78),
      };
    });
  }, [salesData]);

  const prepareYearlyData = useCallback((): ChartDataPoint[] => {
    if (!salesData) return [];
    const totalRevYear = salesData.data.reduce((s, d) => s + (Number(parseFloat(d.total)) || 0), 0);
    return [
      { year: selectedYear - 3, factor: 0.55 },
      { year: selectedYear - 2, factor: 0.68 },
      { year: selectedYear - 1, factor: 0.82 },
      { year: selectedYear, factor: 1.0 },
    ].map(({ year, factor }) => {
      const revenue = Math.round(totalRevYear * factor);
      return { label: `${year}`, revenue, profit: Math.round(revenue * PROFIT_MARGIN), target: Math.round(revenue * 1.1) };
    });
  }, [salesData, selectedYear]);

  const prepareBarData = useCallback((): ChartDataPoint[] => {
    if (!salesData) return [];
    return salesData.data.map((item) => {
      const revenue = Number(parseFloat(item.total)) || 0;
      return {
        label: getMonthName(item.month, true),
        revenue,
        profit: Math.round(revenue * PROFIT_MARGIN),
        target: Math.round(revenue * 1.15),
        lastYear: Math.round(revenue * 0.78),
      };
    });
  }, [salesData]);

  const prepareCategoryData = useCallback(() => {
    if (!summary) return [];
    const colors = ["#10b981", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ef4444", "#ec4899", "#14b8a6"];
    return summary.orders_per_catalog.map((cat, i) => ({
      name: cat.name,
      value: Number(cat.total_sold) || 0,
      color: colors[i % colors.length],
      unit: "ekor",
    }));
  }, [summary]);

  const prepareOrderStatusData = useCallback(() => {
    if (!summary) return [];
    const s = summary.orders_per_status;
    return [
      { name: "Selesai", value: s.completed || 0, color: "#10b981" },
      { name: "Pending", value: s.pending || 0, color: "#f59e0b" },
      { name: "Dibayar", value: s.paid || 0, color: "#0ea5e9" },
      { name: "Dikirim", value: s.shipped || 0, color: "#8b5cf6" },
    ].filter((d) => d.value > 0);
  }, [summary]);

  const allDays = allDaysData();
  const monthlyData = prepareMonthlyData();
  const yearlyData = prepareYearlyData();
  const barData = prepareBarData();
  const categoryData = prepareCategoryData();
  const orderStatusData = prepareOrderStatusData();
  const quickInsights = summary ? generateQuickInsights(summary) : [];

  const trendData = trendFilter === "daily" ? allDays : trendFilter === "monthly" ? monthlyData : yearlyData;
  const totalRevenue = trendData.reduce((s, m) => s + m.revenue, 0);
  const totalProfit = trendData.reduce((s, m) => s + m.profit, 0);
  const totalOrders = summary?.total_orders || 0;
  const completedOrders = summary?.orders_per_status.completed || 0;
  const avgOrderValue = totalRevenue / (totalOrders || 1);
  const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;
  const profitMarginPct = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : "0";
  const revenuePerCompletedOrder = completedOrders > 0 ? totalRevenue / completedOrders : 0;

  const getTrend = (key: "revenue" | "profit") => {
    if (trendData.length < 2) return { val: "0", dir: "neutral" as const };
    const last = trendData[trendData.length - 1][key];
    const prev = trendData[trendData.length - 2][key];
    if (!prev) return { val: "0", dir: "neutral" as const };
    const diff = ((last - prev) / prev) * 100;
    return { val: Math.abs(diff).toFixed(1), dir: diff >= 0 ? ("up" as const) : ("down" as const) };
  };

  const revTrend = getTrend("revenue");
  const profitTrend = getTrend("profit");

  const bestPeriod = trendData.length > 0 ? trendData.reduce((a, b) => (b.revenue > a.revenue ? b : a), trendData[0]) : null;

  const trendSeries = [
    { key: "revenue", label: "Pendapatan", color: "#10b981" },
    { key: "profit", label: "Profit", color: "#0ea5e9" },
    { key: "target", label: "Target", color: "#d1d5db" },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4" />
        <p className="text-gray-500 text-sm">Memuat data dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-sm">
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={loadDashboardData} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const nonDailyData = trendFilter === "monthly" ? monthlyData : yearlyData;
  const nonDailyAvg = nonDailyData.length > 0 ? nonDailyData.reduce((s, d) => s + d.revenue, 0) / nonDailyData.length : 0;
  const nonDailyBest = nonDailyData.length > 0 ? nonDailyData.reduce((a, b) => (b.revenue > a.revenue ? b : a), nonDailyData[0]) : null;
  const trendLabelMap: Record<TrendFilter, string> = {
    daily: `Harian — ${getMonthName(selectedMonth)} ${selectedYear}`,
    monthly: `Bulanan — Tahun ${selectedYear}`,
    yearly: `Tahunan — 4 tahun terakhir`,
  };
  const trendLabel = trendLabelMap[trendFilter];

  return (
    <div className="space-y-7 pb-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">Sales Dashboard</h2>
          <p className="text-gray-500 mt-1 text-sm">
            Diperbarui: {lastUpdated.toLocaleTimeString("id-ID")}
            &nbsp;·&nbsp;
            <span className="text-emerald-600 font-medium">Tahun {selectedYear}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-400 outline-none">
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-400 outline-none">
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {getMonthName(i + 1)}
              </option>
            ))}
          </select>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors border ${autoRefresh ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}
          >
            {autoRefresh ? "🔄 Auto ON" : "⏸ Auto OFF"}
          </button>
          <button onClick={loadDashboardData} className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-semibold transition-colors">
            ↻ Refresh
          </button>
        </div>
      </div>

      {quickInsights.length > 0 && (
        <div className="flex flex-col gap-2">
          {quickInsights.map((insight, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border-l-4 flex items-center gap-3 ${insight.type === "success" ? "bg-emerald-50 border-emerald-500" : insight.type === "warning" ? "bg-amber-50 border-amber-500" : "bg-red-50 border-red-500"}`}
            >
              <div className="flex-1">
                <span className={`text-sm font-bold mr-2 ${insight.type === "success" ? "text-emerald-800" : insight.type === "warning" ? "text-amber-800" : "text-red-800"}`}>{insight.title}</span>
                <span className={`text-sm ${insight.type === "success" ? "text-emerald-700" : insight.type === "warning" ? "text-amber-700" : "text-red-700"}`}>{insight.message}</span>
              </div>
              {insight.action && insight.actionLink && (
                <Link
                  to={insight.actionLink}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap ${
                    insight.type === "success" ? "bg-emerald-600 text-white hover:bg-emerald-700" : insight.type === "warning" ? "bg-amber-600 text-white hover:bg-amber-700" : "bg-red-600 text-white hover:bg-red-700"
                  }`}
                >
                  {insight.action} →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Pendapatan" value={fmt(totalRevenue)} sub={`Tahun ${selectedYear}`} color="#10b981" bgColor="#f0fdf4" trend={revTrend.dir} trendVal={revTrend.val} />
        <KpiCard title="Estimasi Profit" value={fmt(totalProfit)} sub={`Margin ${profitMarginPct}%`} color="#0ea5e9" bgColor="#f0f9ff" trend={profitTrend.dir} trendVal={profitTrend.val} />
        <KpiCard title="Total Pesanan" value={totalOrders.toLocaleString("id")} sub={`${completedOrders} selesai`} color="#8b5cf6" bgColor="#faf5ff" trend="neutral" />
        <KpiCard title="Rata-rata per Order" value={fmt(avgOrderValue)} sub="Nilai transaksi rata-rata" color="#f59e0b" bgColor="#fffbeb" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Tingkat Selesai"
          value={`${completionRate}%`}
          sub={`${completedOrders} dari ${totalOrders} order`}
          color="#10b981"
          bgColor="#f0fdf4"
          trend={completionRate >= 80 ? "up" : "down"}
          trendVal={completionRate}
          trendLabel={completionRate >= 80 ? "tingkat baik" : "belum optimal"}
        />
        <KpiCard title="Revenue / Order Selesai" value={fmt(revenuePerCompletedOrder)} sub="Efisiensi konversi" color="#0ea5e9" bgColor="#f0f9ff" />
        <KpiCard title="Katalog Aktif" value={`${categoryData.filter((c) => c.value > 0).length}`} sub={`dari ${categoryData.length} katalog`} color="#8b5cf6" bgColor="#faf5ff" />
        <KpiCard title="Pendapatan Tertinggi" value={fmt(bestPeriod?.revenue || 0)} sub={`Periode: ${bestPeriod?.label || "-"}`} color="#f59e0b" bgColor="#fffbeb" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-gray-800">Tren Pendapatan & Profit</h3>
            <p className="text-xs text-gray-400 mt-0.5">{trendLabel}</p>
          </div>
          <TrendTabs value={trendFilter} onChange={setTrendFilter} />
        </div>

        {trendFilter === "daily" && <DailyInteractiveChart allDays={allDays} activeSeries={activeSeries} onToggleSeries={toggleSeries} trendSeries={trendSeries} selectedMonth={selectedMonth} selectedYear={selectedYear} />}

        {trendFilter !== "daily" && (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-5 pt-3 border-t border-gray-100">
              {[
                { label: "Total Revenue", val: fmt(nonDailyData.reduce((s, d) => s + d.revenue, 0)), color: "#10b981" },
                { label: "Total Profit", val: fmt(nonDailyData.reduce((s, d) => s + d.profit, 0)), color: "#0ea5e9" },
                { label: "Avg / Periode", val: fmt(nonDailyAvg), color: "#8b5cf6" },
                { label: "Tertinggi", val: fmt(nonDailyBest?.revenue || 0), color: "#f59e0b" },
                { label: "Margin", val: `${profitMarginPct}%`, color: "#10b981" },
                { label: "Jml Periode", val: `${nonDailyData.length}`, color: "#6b7280" },
              ].map((s) => (
                <div key={s.label} className="text-center bg-gray-50 rounded-xl py-2 px-1">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">{s.label}</p>
                  <p className="text-sm font-black mt-0.5" style={{ color: s.color }}>
                    {s.val}
                  </p>
                </div>
              ))}
            </div>
            <SeriesToggle series={trendSeries} active={activeSeries} onToggle={toggleSeries} />
            <ResponsiveContainer width="100%" height={400} className="mt-4">
              <ComposedChart data={nonDailyData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gMRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gMProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={52} />
                <Tooltip content={<CustomTooltip />} />
                {nonDailyAvg > 0 && <ReferenceLine y={nonDailyAvg} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: "rata-rata", fill: "#94a3b8", fontSize: 10, position: "insideTopRight" }} />}
                {activeSeries.target && <Area type="monotone" dataKey="target" name="Target" stroke="#d1d5db" strokeDasharray="5 5" fill="none" strokeWidth={1.5} dot={false} />}
                {activeSeries.revenue && (
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Pendapatan"
                    stroke="#10b981"
                    fill="url(#gMRev)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
                  />
                )}
                {activeSeries.profit && (
                  <Area
                    type="monotone"
                    dataKey="profit"
                    name="Profit"
                    stroke="#0ea5e9"
                    fill="url(#gMProfit)"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#0ea5e9", strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 5, fill: "#0ea5e9", stroke: "#fff", strokeWidth: 2 }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-bold text-gray-800">📅 Perbandingan Revenue Bulanan</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {barSelectedYear} vs {barCompareYear}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">Tahun Utama:</span>
              <select
                value={barSelectedYear}
                onChange={(e) => {
                  const newYear = Number(e.target.value);
                  setBarSelectedYear(newYear);
                  if (barCompareYear >= newYear) {
                    setBarCompareYear(getDefaultCompareYear(newYear));
                  }
                }}
                className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-emerald-400 outline-none font-medium text-gray-700"
              >
                {generateYearOptions(new Date().getFullYear(), 2020).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-gray-300 text-sm">vs</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">Bandingkan:</span>
              <select
                value={barCompareYear}
                onChange={(e) => setBarCompareYear(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-emerald-400 outline-none font-medium text-gray-700"
              >
                {generateYearOptions(new Date().getFullYear(), 2020)
                  .filter((y) => y !== barSelectedYear)
                  .map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={barData} margin={{ top: 5, right: 20, left: 10, bottom: 0 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={52} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="lastYear" name={`${barCompareYear}`} fill="#039f00" radius={[4, 4, 0, 0]} maxBarSize={32} />
            <Bar dataKey="revenue" name={`${barSelectedYear}`} fill="#035100" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-700">🔄 Status Pesanan</h3>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {(["donut", "bar"] as const).map((v) => (
                <button key={v} onClick={() => setStatusView(v)} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${statusView === v ? "bg-white shadow-sm text-gray-700" : "text-gray-400"}`}>
                  {v === "donut" ? "Donut" : "Bar"}
                </button>
              ))}
            </div>
          </div>
          {statusView === "donut" ? (
            <>
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={58} outerRadius={90} paddingAngle={3} dataKey="value">
                    {orderStatusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {orderStatusData.map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                      <span className="text-gray-600">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">{s.value}</span>
                      <span className="text-gray-400">({totalOrders > 0 ? Math.round((s.value / totalOrders) * 100) : 0}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={orderStatusData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={55} />
                <Tooltip formatter={(v) => [`${v} order`, ""]} />
                <Bar dataKey="value" name="Order" radius={[0, 6, 6, 0]} maxBarSize={28}>
                  {orderStatusData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-bold text-gray-700 mb-4">🍩 Distribusi Penjualan Katalog</h3>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={58} outerRadius={90} paddingAngle={3} dataKey="value">
                {categoryData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-2 max-h-[130px] overflow-y-auto pr-1">
            {categoryData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                  <span className="text-gray-600 truncate max-w-[110px]">{item.name}</span>
                </div>
                <span className="font-bold text-gray-800">{item.value} ekor</span>
              </div>
            ))}
          </div>
        </div>

        {/* <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-gray-700">Penjualan per Jenis Burung</h3>
          </div>
          <p className="text-[10px] text-gray-400 mb-4 uppercase tracking-wide">
            Total terjual: {totalSoldAllAge.toLocaleString("id")} ekor
          </p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {soldByAgeCategory.map((cat) => {
              const pct = totalSoldAllAge > 0 ? Math.round((cat.sold! / totalSoldAllAge) * 100) : 0;
              const isTop = cat.sold === maxAgeSold && cat.sold! > 0;
              return (
                <div
                  key={cat.slug}
                  className="rounded-xl p-3 relative overflow-hidden transition-all hover:scale-[1.02]"
                  style={{ background: cat.bgColor, border: `1.5px solid ${cat.color}22` }}
                >
                  {isTop && (
                    <span className="absolute top-1.5 right-1.5 text-[9px] bg-amber-400 text-white font-bold px-1.5 py-0.5 rounded-full">
                      TERLARIS
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-1.5">
                    <div>
                      <p className="text-xs font-bold text-gray-700">{cat.label}</p>
                      <p className="text-[10px] text-gray-400">{cat.ageRange}</p>
                    </div>
                  </div>
                  <p className="text-xl font-black" style={{ color: cat.color }}>
                    {cat.sold!.toLocaleString("id")}
                    <span className="text-xs font-normal text-gray-400 ml-1">ekor</span>
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{pct}% dari total</p>
                </div>
              );
            })}
          </div>
          <div className="space-y-2.5 pt-3 border-t border-gray-100">
            {[...soldByAgeCategory]
              .sort((a, b) => (b.sold || 0) - (a.sold || 0))
              .map((cat, i) => {
                const pct = maxAgeSold > 0 ? Math.round(((cat.sold || 0) / maxAgeSold) * 100) : 0;
                const sharePct = totalSoldAllAge > 0 ? Math.round(((cat.sold || 0) / totalSoldAllAge) * 100) : 0;
                return (
                  <div key={cat.slug}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                        <span className={`w-4 h-4 rounded text-[9px] flex items-center justify-center font-black flex-shrink-0 ${
                          i === 0 ? "bg-amber-400 text-white"
                            : i === 1 ? "bg-slate-400 text-white"
                              : i === 2 ? "bg-orange-400 text-white"
                                : "bg-gray-200 text-gray-500"
                        }`}>{i + 1}</span>
                        <span>{cat.label}</span>
                        <span className="text-gray-400 font-normal">({cat.ageRange})</span>
                      </span>
                      <span className="font-bold text-gray-800">
                        {(cat.sold || 0).toLocaleString("id")} ekor
                        <span className="text-gray-400 font-normal ml-1">({sharePct}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: cat.color }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div> */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
          <h3 className="text-base font-bold mb-1">Ringkasan Finansial</h3>
          <p className="text-gray-400 text-xs mb-5">Estimasi berdasarkan margin {(PROFIT_MARGIN * 100).toFixed(0)}%</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Total Revenue", value: fmt(totalRevenue), color: "#10b981" },
              { label: "Estimasi Profit", value: fmt(totalProfit), color: "#0ea5e9" },
              { label: "Estimasi HPP", value: fmt(totalRevenue - totalProfit), color: "#f59e0b" },
              { label: "Profit Margin", value: `${profitMarginPct}%`, color: "#8b5cf6" },
            ].map((item) => (
              <div key={item.label} className="bg-white/10 rounded-xl p-4 hover:bg-white/15 transition-colors">
                <p className="text-gray-400 text-xs">{item.label}</p>
                <p className="text-xl font-black mt-1" style={{ color: item.color }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
        {/* <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
          <h3 className="text-base font-bold mb-4">⚡ Aksi Cepat</h3>
          <div className="grid grid-cols-1 gap-3">
            <Link to="/admin/products" className="flex items-center gap-3 p-3.5 bg-white/20 rounded-xl hover:bg-white/30 transition-all">
              <div className="bg-white/30 p-2.5 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm">Tambah Produk</p>
                <p className="text-xs text-white/70">Buat produk baru ke katalog</p>
              </div>
            </Link>
            <Link to="/admin/orders" className="flex items-center gap-3 p-3.5 bg-white/20 rounded-xl hover:bg-white/30 transition-all">
              <div className="bg-white/30 p-2.5 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm">Kelola Pesanan</p>
                <p className="text-xs text-white/70">Update status & lacak order</p>
              </div>
            </Link>
            <button onClick={loadDashboardData} className="flex items-center gap-3 p-3.5 bg-white/20 rounded-xl hover:bg-white/30 transition-all w-full text-left">
              <div className="bg-white/30 p-2.5 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm">Refresh Data</p>
                <p className="text-xs text-white/70">Perbarui semua statistik</p>
              </div>
            </button>
          </div>
        </div> */}
      </div>

      {autoRefresh && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-full text-xs shadow-xl flex items-center gap-2 z-50">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span>Auto-refresh aktif (30s)</span>
        </div>
      )}
    </div>
  );
}
