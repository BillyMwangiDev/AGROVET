import { useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FlaskConical,
  Users,
  BarChart3,
  FileSpreadsheet,
  LogOut,
  ArrowLeft,
  UserCog,
  Search,
  Sun,
  Moon,
  Printer,
  Settings,
  BookOpen,
  FileText,
  Receipt,
  PanelLeft,
  PanelLeftClose,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuthContext } from '@/contexts/AuthContext';
import { usePOSContext } from '@/contexts/POSContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
const DashboardOverview = lazy(() => import('@/components/dashboard/DashboardOverview'));
const POSTerminal        = lazy(() => import('@/components/pos/POSTerminal'));
const InventoryManager  = lazy(() => import('@/components/dashboard/InventoryManager'));
const AIRecords         = lazy(() => import('@/components/dashboard/AIRecords'));
const Customers         = lazy(() => import('@/components/dashboard/Customers'));
const Analytics         = lazy(() => import('@/components/dashboard/Analytics'));
const ExcelImport       = lazy(() => import('@/components/dashboard/ExcelImport'));
const StaffManagement   = lazy(() => import('@/components/dashboard/StaffManagement'));
const StoreSettings     = lazy(() => import('@/components/settings/StoreSettings'));
const ContentManager    = lazy(() => import('@/components/dashboard/ContentManager'));
const DocumentsManager  = lazy(() => import('@/components/dashboard/DocumentsManager'));
const ReceiptsHistory   = lazy(() => import('@/components/dashboard/ReceiptsHistory'));
import type { UserRole } from '@/types';

// ── Role badge styles ──────────────────────────────────────────────────────────
const ROLE_BADGE_CLASSES: Record<string, string> = {
  admin:    'bg-red-100 text-red-700 border border-red-200',
  manager:  'bg-blue-100 text-blue-700 border border-blue-200',
  cashier:  'bg-brand-50 text-brand border border-brand/20',
  customer: 'bg-gray-100 text-gray-600 border border-gray-200',
};

// ── Sidebar links config ───────────────────────────────────────────────────────
const ALL_LINKS = [
  { icon: LayoutDashboard, label: 'Dashboard',   path: '',             roles: ['admin', 'manager', 'cashier'] as UserRole[] },
  { icon: ShoppingCart,    label: 'POS Terminal', path: 'pos',          roles: ['admin', 'manager', 'cashier'] as UserRole[] },
  { icon: Package,         label: 'Inventory',    path: 'inventory',    roles: ['admin', 'manager'] as UserRole[] },
  { icon: FlaskConical,    label: 'AI Records',   path: 'ai-records',   roles: ['admin', 'manager', 'cashier'] as UserRole[] },
  { icon: Users,           label: 'Customers',    path: 'customers',    roles: ['admin', 'manager', 'cashier'] as UserRole[] },
  { icon: Receipt,         label: 'Receipts',     path: 'receipts',     roles: ['admin', 'manager'] as UserRole[] },
  { icon: FileText,        label: 'Documents',    path: 'documents',    roles: ['admin', 'manager'] as UserRole[] },
  { icon: BarChart3,       label: 'Analytics',    path: 'analytics',    roles: ['admin', 'manager'] as UserRole[] },
  { icon: FileSpreadsheet, label: 'Excel Import', path: 'excel-import', roles: ['admin'] as UserRole[] },
  { icon: UserCog,         label: 'Staff',        path: 'staff',        roles: ['admin', 'manager'] as UserRole[] },
  { icon: BookOpen,        label: 'Content',      path: 'content',      roles: ['admin'] as UserRole[] },
  { icon: Settings,        label: 'Settings',     path: 'settings',     roles: ['admin'] as UserRole[] },
];

export default function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const { user, logout } = useAuthContext();
  const { searchQuery, setSearchQuery, barcodeValue, setBarcodeValue } = usePOSContext();
  const { theme, setTheme } = useTheme();

  const isPOS = location.pathname === '/admin/pos';
  const role = user?.role ?? 'cashier';
  const sidebarLinks = ALL_LINKS.filter(link => link.roles.includes(role as UserRole));

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name}`.trim()
    : user?.username ?? 'User';

  const avatarInitial = (user?.first_name?.[0] ?? user?.username?.[0] ?? 'A').toUpperCase();

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── Sidebar — dark brand green ── */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ${
          isSidebarOpen ? 'w-60' : 'w-0 lg:w-[68px]'
        } overflow-hidden`}
        style={{ background: 'linear-gradient(180deg, #093025 0%, #0B3A2C 100%)' }}
      >
        {/* Logo area */}
        <div className="p-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Nicmah Agrovet"
              className={`rounded-xl object-contain flex-shrink-0 ring-2 ring-white/15 transition-all ${
                isSidebarOpen ? 'h-10 w-10' : 'h-9 w-9'
              }`}
            />
            {isSidebarOpen && (
              <div className="overflow-hidden flex flex-col">
                <span className="font-bold text-sm text-white tracking-tight truncate leading-tight">
                  Nicmah Agrovet
                </span>
                <span className="text-[11px] text-white/45 font-normal">Admin Panel</span>
              </div>
            )}
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto scrollbar-thin" aria-label="Admin navigation">
          {sidebarLinks.map((link) => {
            const isActive =
              location.pathname === `/admin/${link.path}` ||
              (location.pathname === '/admin' && link.path === '') ||
              (link.path !== '' && location.pathname.startsWith(`/admin/${link.path}`));
            return (
              <Link
                key={link.path}
                to={`/admin/${link.path}`}
                title={!isSidebarOpen ? link.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm font-medium group ${
                  isActive
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-white/60 hover:bg-white/10 hover:text-white/90'
                }`}
              >
                <link.icon
                  className={`flex-shrink-0 transition-colors ${
                    isSidebarOpen ? 'w-4.5 h-4.5' : 'w-5 h-5'
                  } ${isActive ? 'text-[#E4B83A]' : ''}`}
                  aria-hidden="true"
                />
                {isSidebarOpen && <span className="truncate">{link.label}</span>}
                {isActive && isSidebarOpen && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#E4B83A] flex-shrink-0" aria-hidden="true" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom — Back to Store + Logout */}
        <div className="px-2 pb-4 pt-2 border-t border-white/10 space-y-0.5 flex-shrink-0">
          <Link
            to="/"
            title={!isSidebarOpen ? 'Back to Store' : undefined}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:bg-white/10 hover:text-white/80 transition-all text-sm font-medium"
          >
            <ArrowLeft className="w-4.5 h-4.5 flex-shrink-0" aria-hidden="true" />
            {isSidebarOpen && <span>Back to Store</span>}
          </Link>
          <button
            onClick={handleLogout}
            title={!isSidebarOpen ? 'Logout' : undefined}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:bg-red-500/15 hover:text-red-300 transition-all text-sm font-medium w-full"
          >
            <LogOut className="w-4.5 h-4.5 flex-shrink-0" aria-hidden="true" />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Overlay on mobile when sidebar open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Header — frosted glass */}
        <header className="glass-card border-b border-white/40 px-5 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-glass flex-shrink-0">
          {/* Sidebar toggle */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-brand/8 rounded-xl transition-colors text-muted-foreground hover:text-brand"
            aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {isSidebarOpen
              ? <PanelLeftClose className="w-5 h-5" aria-hidden="true" />
              : <PanelLeft className="w-5 h-5" aria-hidden="true" />
            }
          </button>

          {/* POS Search inputs */}
          {isPOS ? (
            <div className="flex-1 max-w-2xl px-6 flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  className="pl-10 h-9 bg-background border-border focus-visible:ring-1 focus-visible:ring-brand rounded-xl text-sm"
                  placeholder="Search products… [F2]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="relative w-44">
                <Input
                  className="h-9 bg-background border-border focus-visible:ring-1 focus-visible:ring-brand rounded-xl text-sm"
                  placeholder="Manual barcode…"
                  value={barcodeValue}
                  onChange={(e) => setBarcodeValue(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1" />
          )}

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Theme toggle — actually wired */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-brand/8"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle dark mode"
            >
              {theme === 'dark'
                ? <Sun className="w-4.5 h-4.5" aria-hidden="true" />
                : <Moon className="w-4.5 h-4.5" aria-hidden="true" />
              }
            </Button>

            {isPOS && (
              <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-brand/8">
                <Printer className="w-4.5 h-4.5" aria-hidden="true" />
              </Button>
            )}

            {/* Divider */}
            <div className="w-px h-6 bg-border mx-1" aria-hidden="true" />

            {/* User pill */}
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-foreground leading-tight">{displayName}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${ROLE_BADGE_CLASSES[role] ?? ROLE_BADGE_CLASSES.customer}`}>
                  {role}
                </span>
              </div>
              {/* Avatar — gold ring for admin */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                  role === 'admin'
                    ? 'bg-brand ring-2 ring-[#E4B83A]'
                    : 'bg-brand ring-2 ring-brand/30'
                }`}
              >
                {avatarInitial}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-7 h-7 border-4 border-brand border-t-transparent rounded-full animate-spin" /></div>}>
            <Routes>
              <Route path="/"             element={<DashboardOverview />} />
              <Route path="/pos"          element={<POSTerminal />} />
              <Route path="/inventory"    element={<InventoryManager />} />
              <Route path="/ai-records"   element={<AIRecords />} />
              <Route path="/customers"    element={<Customers />} />
              <Route path="/receipts"     element={<ReceiptsHistory />} />
              <Route path="/analytics"    element={<Analytics />} />
              <Route path="/excel-import" element={<ExcelImport />} />
              <Route path="/staff"        element={<StaffManagement />} />
              <Route path="/content"      element={<ContentManager />} />
              <Route path="/settings"     element={<StoreSettings />} />
              <Route path="/documents"    element={<DocumentsManager />} />
              <Route path="*"             element={<Navigate to="/admin" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
