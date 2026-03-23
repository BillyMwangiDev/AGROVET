import { useState } from 'react';
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Download,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useSalesTrend,
  useCategorySplit,
  useDashboardStats,
  useHourlySales,
  useSlowMovers,
  useCashierAudit,
  useDateRangeReport,
} from '@/hooks/useAnalytics';
import { buildExportUrl } from '@/api/analytics';
import { apiClient } from '@/api/client';
import { formatKES, parseDecimal } from '@/utils/formatCurrency';

// Default date range: last 30 days
function defaultDates() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'hourly',   label: 'Hourly Heatmap' },
  { id: 'slow',     label: 'Slow Movers' },
  { id: 'audit',    label: 'Cashier Audit' },
  { id: 'report',   label: 'Date Range Report' },
] as const;

// Colour palette for category PieChart
const PIE_COLORS = ['#0B3A2C', '#E4B83A', '#2a9c65', '#6B7A72', '#10b981', '#3b82f6'];

function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-100">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">{children}</table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground bg-brand-50 uppercase tracking-wide">
      {children}
    </th>
  );
}

function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <td className={`px-4 py-3 text-sm text-foreground ${mono ? 'font-mono' : ''}`}>
      {children}
    </td>
  );
}

export default function Analytics() {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]['id']>('overview');
  const [dateRange, setDateRange] = useState(defaultDates);

  const { data: weeklySalesData = [] } = useSalesTrend(7);
  const { data: categoryData = [] }    = useCategorySplit();
  const { data: statsData }            = useDashboardStats();
  const { data: hourlyData = [] }      = useHourlySales(30);
  const { data: slowMovers = [] }      = useSlowMovers(30);
  const { data: cashierAudit = [] }    = useCashierAudit(30);
  const { data: rangeReport }          = useDateRangeReport(dateRange.start, dateRange.end);

  const totalSales    = weeklySalesData.reduce((sum, day) => sum + day.sales, 0);
  const totalOrders   = weeklySalesData.reduce((sum, day) => sum + day.orders, 0);
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  // Chart-ready data
  const chartData = weeklySalesData.map(d => ({
    day:    d.date,
    sales:  typeof d.sales === 'string' ? parseDecimal(d.sales) : d.sales,
    orders: d.orders,
  }));

  // Hourly heatmap helpers
  const maxHourlyOrders = Math.max(...hourlyData.map(h => h.orders), 1);
  function heatStyle(orders: number): React.CSSProperties {
    const t = orders / maxHourlyOrders;
    const l = Math.round(14 + t * 36); // 14% → 50% lightness of hsl(162, 68%, L%)
    return {
      backgroundColor: orders === 0 ? '#f4f6f5' : `hsl(162, 68%, ${l}%)`,
      color: t > 0.5 ? 'white' : '#111915',
    };
  }

  async function handleExport(format: 'csv' | 'excel') {
    const url = buildExportUrl(format, dateRange.start, dateRange.end);
    const response = await apiClient.get(url, { responseType: 'blob' });
    const blob = new Blob([response.data]);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sales_${dateRange.start}_${dateRange.end}.${format === 'csv' ? 'csv' : 'xlsx'}`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-brand/8 text-brand text-xs font-semibold px-3 py-1 rounded-full mb-2 border border-brand/12">
            <BarChart3 className="w-3 h-3" aria-hidden="true" />
            Business Analytics
          </div>
          <h1 className="text-2xl font-extrabold text-foreground leading-tight">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Track performance across sales, products and staff</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => handleExport('csv')}>
            <Download className="w-3.5 h-3.5" aria-hidden="true" /> CSV
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => handleExport('excel')}>
            <Download className="w-3.5 h-3.5" aria-hidden="true" /> Excel
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: TrendingUp, bg: 'bg-brand',      label: 'Weekly Sales',       value: formatKES(totalSales),                       mono: true },
          { icon: ShoppingCart, bg: 'bg-gold-400',  label: 'Total Orders',       value: String(totalOrders),                         mono: false },
          { icon: TrendingUp, bg: 'bg-sage',        label: 'Avg Order Value',    value: formatKES(Math.round(avgOrderValue)),         mono: true },
          { icon: Users,      bg: 'bg-emerald-500', label: 'Total Customers',    value: String(statsData?.total_customers ?? '…'),   mono: false },
        ].map((m) => (
          <div key={m.label} className="bento-card bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${m.bg}`}>
              <m.icon className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className={`text-xl font-bold text-foreground truncate ${m.mono ? 'font-mono' : ''}`}>{m.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Nav */}
      <div className="flex flex-wrap gap-1 bg-brand-50/60 border border-brand/10 p-1 rounded-xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-brand shadow-sm border border-brand/10'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Weekly Sales + Orders ComposedChart — 3 cols */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-bold text-foreground mb-4">Weekly Sales Trend</h2>
              {chartData.length === 0 ? (
                <div className="h-56 flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">No data yet.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6B7A72' }} axisLine={false} tickLine={false} />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 11, fill: '#6B7A72' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11, fill: '#6B7A72' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) =>
                        name === 'sales' ? [formatKES(value), 'Sales'] : [value, 'Orders']
                      }
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.10)', fontSize: 12 }}
                      cursor={{ fill: 'rgba(11,58,44,0.05)' }}
                    />
                    <Bar dataKey="sales" yAxisId="left" fill="#0B3A2C" radius={[5,5,0,0]} maxBarSize={48} activeBar={{ fill: '#E4B83A' }} />
                    <Line dataKey="orders" yAxisId="right" stroke="#E4B83A" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Category Split PieChart — 2 cols */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-bold text-foreground mb-4">Sales by Category</h2>
              {categoryData.length === 0 ? (
                <div className="h-56 flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">No data yet.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => [`${v}%`, 'Share']}
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.10)', fontSize: 12 }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => <span style={{ fontSize: 11, color: '#6B7A72' }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Daily Performance Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="text-sm font-bold text-foreground">Daily Performance</h2>
            </div>
            <TableWrapper>
              <thead><tr>
                <Th>Day</Th><Th>Sales</Th><Th>Orders</Th><Th>Avg Order</Th>
              </tr></thead>
              <tbody>
                {weeklySalesData.map((day) => (
                  <tr key={day.date} className="border-t border-gray-50 hover:bg-brand-50/30 transition-colors">
                    <Td>{day.date}</Td>
                    <Td mono>{formatKES(day.sales)}</Td>
                    <Td>{day.orders}</Td>
                    <Td mono>{day.orders > 0 ? formatKES(Math.round(day.sales / day.orders)) : '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrapper>
          </div>
        </div>
      )}

      {/* ── Hourly Heatmap Tab ── */}
      {activeTab === 'hourly' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-foreground mb-5">Sales Activity by Hour (Last 30 Days)</h2>
          <div className="grid grid-cols-12 gap-2">
            {hourlyData.map((h) => (
              <div key={h.hour} className="flex flex-col items-center gap-1">
                <div
                  className="w-full h-14 rounded-xl flex items-center justify-center text-xs font-bold transition-all"
                  style={heatStyle(h.orders)}
                  title={`${h.label}: ${h.orders} orders, ${formatKES(h.sales)}`}
                >
                  {h.orders > 0 ? h.orders : ''}
                </div>
                <span className="text-[10px] text-muted-foreground">{h.label.replace(':00', '')}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span>Low</span>
            {[14, 22, 32, 44, 50].map(l => (
              <div key={l} className="w-6 h-4 rounded-md" style={{ backgroundColor: `hsl(162, 68%, ${l}%)` }} />
            ))}
            <span>High</span>
          </div>
        </div>
      )}

      {/* ── Slow Movers Tab ── */}
      {activeTab === 'slow' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-bold text-foreground">Slow-Moving Products (Last 30 Days)</h2>
          </div>
          {slowMovers.length === 0 ? (
            <div className="py-16 text-center">
              <AlertCircle className="w-8 h-8 text-brand/20 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No slow mover data available</p>
            </div>
          ) : (
            <TableWrapper>
              <thead><tr>
                <Th>Product</Th><Th>Category</Th><Th>Stock</Th><Th>Price</Th><Th>Units Sold</Th><Th>Status</Th>
              </tr></thead>
              <tbody>
                {slowMovers.map((p) => (
                  <tr key={p.id} className="border-t border-gray-50 hover:bg-brand-50/30 transition-colors">
                    <Td>{p.name}</Td>
                    <Td>{p.category ?? '—'}</Td>
                    <Td mono>{p.stock_level}</Td>
                    <Td mono>{formatKES(parseFloat(p.price))}</Td>
                    <Td mono>{p.qty_sold}</Td>
                    <td className="px-4 py-3">
                      {p.qty_sold === 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-100">
                          <AlertCircle className="w-3 h-3" aria-hidden="true" /> No Sales
                        </span>
                      ) : (
                        <span className="inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                          Slow
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrapper>
          )}
        </div>
      )}

      {/* ── Cashier Audit Tab ── */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-bold text-foreground">Cashier Performance (Last 30 Days)</h2>
          </div>
          {cashierAudit.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-8 h-8 text-brand/20 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No sales data yet</p>
            </div>
          ) : (
            <TableWrapper>
              <thead><tr>
                <Th>Cashier</Th><Th>Total Sales</Th><Th>Orders</Th><Th>Avg Sale</Th>
              </tr></thead>
              <tbody>
                {cashierAudit.map((c) => (
                  <tr key={c.cashier_id} className="border-t border-gray-50 hover:bg-brand-50/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-sm text-foreground">{c.name}</td>
                    <Td mono>{formatKES(c.total_sales)}</Td>
                    <Td>{c.order_count}</Td>
                    <Td mono>{formatKES(Math.round(c.avg_sale))}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrapper>
          )}
        </div>
      )}

      {/* ── Date Range Report Tab ── */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          {/* Date pickers */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Start Date</label>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(r => ({ ...r, start: e.target.value }))}
                  className="h-9 w-40 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">End Date</label>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(r => ({ ...r, end: e.target.value }))}
                  className="h-9 w-40 rounded-xl"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => handleExport('csv')}>
                  <Download className="w-3.5 h-3.5" aria-hidden="true" /> CSV
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => handleExport('excel')}>
                  <Download className="w-3.5 h-3.5" aria-hidden="true" /> Excel
                </Button>
              </div>
            </div>
          </div>

          {rangeReport && (
            <>
              {/* Summary metrics */}
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { label: 'Total Sales',    value: formatKES(rangeReport.total_sales) },
                  { label: 'Total Orders',   value: String(rangeReport.total_orders) },
                  { label: 'Avg Order Value',value: formatKES(Math.round(rangeReport.avg_order_value)) },
                ].map((m) => (
                  <div key={m.label} className="bento-card bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                    <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                    <p className="text-2xl font-extrabold font-mono text-foreground">{m.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* By Payment Method */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-50">
                    <h2 className="text-sm font-bold text-foreground">By Payment Method</h2>
                  </div>
                  <TableWrapper>
                    <thead><tr><Th>Method</Th><Th>Revenue</Th><Th>Orders</Th></tr></thead>
                    <tbody>
                      {rangeReport.by_payment_method.map((m) => (
                        <tr key={m.method} className="border-t border-gray-50 hover:bg-brand-50/30">
                          <Td>{m.method}</Td>
                          <Td mono>{formatKES(m.total)}</Td>
                          <Td>{m.count}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </TableWrapper>
                </div>

                {/* Top Products */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-50">
                    <h2 className="text-sm font-bold text-foreground">Top Products</h2>
                  </div>
                  <TableWrapper>
                    <thead><tr><Th>Product</Th><Th>Qty</Th><Th>Revenue</Th></tr></thead>
                    <tbody>
                      {rangeReport.top_products.map((p) => (
                        <tr key={p.name} className="border-t border-gray-50 hover:bg-brand-50/30">
                          <td className="px-4 py-3 font-medium text-sm text-foreground">{p.name}</td>
                          <Td mono>{p.qty}</Td>
                          <Td mono>{formatKES(p.revenue)}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </TableWrapper>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
