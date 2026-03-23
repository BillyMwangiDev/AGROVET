import { useEffect, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Users,
  Package,
  CalendarX,
  ShoppingCart,
  Syringe,
  FileSpreadsheet,
  Banknote,
  Smartphone,
  CreditCard,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Link } from 'react-router-dom';
import { useDashboardStats, useSalesTrend } from '@/hooks/useAnalytics';
import { parseDecimal, formatKES } from '@/utils/formatCurrency';
import gsap from 'gsap';

// ── Payment method icon ────────────────────────────────────────────────────────
function PaymentIcon({ method }: { method: string }) {
  const m = method?.toLowerCase();
  if (m === 'mpesa' || m === 'm-pesa') return <Smartphone className="w-3.5 h-3.5 text-emerald-600" />;
  if (m === 'card') return <CreditCard className="w-3.5 h-3.5 text-blue-500" />;
  return <Banknote className="w-3.5 h-3.5 text-gold-500" />;
}

function PaymentBadge({ method }: { method: string }) {
  const m = method?.toLowerCase();
  const styles =
    m === 'mpesa' || m === 'm-pesa'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
      : m === 'card'
      ? 'bg-blue-50 text-blue-700 border-blue-100'
      : 'bg-gold-50 text-gold-600 border-gold-100';
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${styles}`}>
      <PaymentIcon method={method} />
      {method}
    </span>
  );
}

// ── Skeleton shimmer card ──────────────────────────────────────────────────────
function StatSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="skeleton-shimmer h-3 w-24 rounded-full mb-3" />
      <div className="skeleton-shimmer h-7 w-32 rounded-lg mb-2" />
      <div className="skeleton-shimmer h-3 w-16 rounded-full" />
    </div>
  );
}

export default function DashboardOverview() {
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: trendData = [] } = useSalesTrend(7);

  // GSAP stagger entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardsRef.current.filter(Boolean),
        { opacity: 0, y: 22, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power2.out',
        },
      );
    });
    return () => ctx.revert();
  }, []);

  const salesToday  = parseDecimal(stats?.today_sales_total ?? 0);
  const ordersToday = stats?.today_orders_count ?? 0;
  const customers   = stats?.total_customers ?? 0;
  const lowStock    = stats?.low_stock_count ?? 0;
  const expiring    = (stats?.expiring_soon_count ?? 0) + (stats?.expired_count ?? 0);

  // Chart data — format for Recharts
  const chartData = trendData.map(d => ({
    day:    d.date,
    sales:  typeof d.sales === 'string' ? parseDecimal(d.sales) : d.sales,
    orders: d.orders,
  }));

  const STAT_CARDS = [
    {
      title: 'Sales Today',
      value: statsLoading ? null : formatKES(salesToday),
      icon: TrendingUp,
      iconBg: 'bg-brand',
      trend: null,
    },
    {
      title: 'Orders Today',
      value: statsLoading ? null : String(ordersToday),
      icon: ShoppingBag,
      iconBg: 'bg-gold-400',
      trend: null,
    },
    {
      title: 'Total Customers',
      value: statsLoading ? null : String(customers),
      icon: Users,
      iconBg: 'bg-sage',
      trend: null,
    },
    {
      title: 'Low Stock',
      value: statsLoading ? null : String(lowStock),
      icon: Package,
      iconBg: lowStock > 0 ? 'bg-red-500' : 'bg-emerald-500',
      alert: lowStock > 0,
      trend: null,
    },
    {
      title: 'Expiring ≤30d',
      value: statsLoading ? null : String(expiring),
      icon: CalendarX,
      iconBg: expiring > 0 ? 'bg-orange-500' : 'bg-emerald-500',
      alert: expiring > 0,
      trend: null,
    },
  ];

  const QUICK_ACTIONS = [
    { label: 'New Sale',         href: '/admin/pos',         Icon: ShoppingCart,    primary: true  },
    { label: 'Book AI Service',  href: '/admin/ai-records',  Icon: Syringe,         primary: false },
    { label: 'Update Stock',     href: '/admin/inventory',   Icon: Package,         primary: false },
    { label: 'Import Excel',     href: '/admin/excel-import',Icon: FileSpreadsheet, gold: true     },
  ];

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-brand/8 text-brand text-xs font-semibold px-3 py-1 rounded-full mb-2 border border-brand/12">
            <Sparkles className="w-3 h-3" aria-hidden="true" />
            Today's Overview
          </div>
          <h1 className="text-2xl font-extrabold text-foreground leading-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Here's what's happening at Nicmah Agrovet today.</p>
        </div>
      </div>

      {/* ── KPI bento grid ── */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <StatSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {STAT_CARDS.map((stat, index) => (
            <div
              key={stat.title}
              ref={(el) => { cardsRef.current[index] = el; }}
              className={`bento-card bg-white rounded-2xl p-5 border shadow-sm flex flex-col gap-3 ${
                stat.alert ? 'border-red-100' : 'border-gray-100'
              }`}
              style={{ opacity: 0 }}
            >
              <div className="flex items-start justify-between">
                <p className="text-xs font-medium text-muted-foreground leading-snug">{stat.title}</p>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.iconBg}`}>
                  <stat.icon className="w-4.5 h-4.5 text-white" aria-hidden="true" />
                </div>
              </div>
              <p className={`text-2xl font-extrabold font-mono tracking-tight ${stat.alert ? 'text-red-600' : 'text-foreground'}`}>
                {stat.value ?? '—'}
              </p>
              <div className="flex items-center gap-1">
                {stat.alert
                  ? <TrendingDown className="w-3.5 h-3.5 text-red-400" aria-hidden="true" />
                  : <TrendingUp className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                }
                <span className="text-xs text-muted-foreground">as of today</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Bottom row ── */}
      <div className="grid lg:grid-cols-5 gap-6">

        {/* Recent Sales */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-gray-50">
            <h2 className="text-sm font-bold text-foreground">Recent Sales</h2>
            <Link to="/admin/receipts" className="text-xs text-brand hover:text-brand-600 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {statsLoading && (
              <div className="p-5 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skeleton-shimmer h-10 rounded-xl" />
                ))}
              </div>
            )}
            {!statsLoading && !stats?.recent_sales?.length && (
              <div className="py-12 text-center">
                <ShoppingBag className="w-8 h-8 text-brand/20 mx-auto mb-2" aria-hidden="true" />
                <p className="text-muted-foreground text-sm">No sales today yet.</p>
              </div>
            )}
            {stats?.recent_sales?.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-brand-50/30 transition-colors">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{sale.customer_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground font-mono">{sale.receipt_number}</span>
                    <PaymentBadge method={sale.payment_method} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="font-bold text-brand font-mono text-sm">
                    {formatKES(parseDecimal(sale.total))}
                  </p>
                  <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                    completed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-foreground mb-5">Quick Actions</h2>
          <div className="space-y-3">
            {QUICK_ACTIONS.map(({ label, href, Icon, primary, gold }) => (
              <Link key={href} to={href}>
                <button
                  className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl text-sm font-semibold transition-all ${
                    primary
                      ? 'bg-brand text-white hover:bg-brand-600 shadow-brand hover:shadow-brand-lg'
                      : gold
                      ? 'bg-gold-400 text-brand-900 hover:bg-gold-500 shadow-gold'
                      : 'bg-brand-50 text-brand hover:bg-brand-100 border border-brand/10'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  {label}
                  <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-60" aria-hidden="true" />
                </button>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Weekly Sales Chart — real Recharts ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-foreground">Weekly Sales Trend</h2>
          <span className="text-xs text-muted-foreground font-mono">Last 7 days</span>
        </div>
        {chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">No data yet.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: '#6B7A72', fontFamily: 'Inter, sans-serif' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6B7A72', fontFamily: 'Inter, sans-serif' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number) => [formatKES(value), 'Sales']}
                contentStyle={{
                  borderRadius: 12,
                  border: 'none',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
                  fontSize: 12,
                  fontFamily: 'Geist Mono, monospace',
                }}
                cursor={{ fill: 'rgba(11,58,44,0.05)' }}
              />
              <Bar
                dataKey="sales"
                fill="#0B3A2C"
                radius={[6, 6, 0, 0]}
                maxBarSize={52}
                activeBar={{ fill: '#E4B83A' }}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
