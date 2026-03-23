import { useState, useMemo, useRef } from 'react';
import {
  Search, AlertTriangle, Package, Plus, Minus, Edit2, CalendarX,
  ImagePlus, PlusCircle, Trash2, History, TrendingDown, TrendingUp,
  CheckCheck, RefreshCw,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  useInventory, useStockAdjust, useUpdateProduct,
  useCreateProduct, useDeactivateProduct, useStockLog, useCategories,
} from '@/hooks/useProducts';
import { useStockAlerts, useAcknowledgeAlert, useResolveAlert, useGenerateAlerts } from '@/hooks/useStockAlerts';
import type { AdminProduct } from '@/types';
import type { CreateProductPayload } from '@/api/products';
import { parseDecimal } from '@/utils/formatCurrency';

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

function AlertsPanel() {
  const [statusFilter, setStatusFilter] = useState<'active' | 'acknowledged' | 'all'>('active');
  const { data: alerts = [], isLoading } = useStockAlerts(
    statusFilter === 'all' ? undefined : { status: statusFilter }
  );
  const acknowledgeMutation = useAcknowledgeAlert();
  const resolveMutation = useResolveAlert();
  const generateMutation = useGenerateAlerts();

  const handleAcknowledge = async (id: string) => {
    try {
      await acknowledgeMutation.mutateAsync(id);
      toast.success('Alert acknowledged.');
    } catch { toast.error('Failed to acknowledge alert.'); }
  };

  const handleResolve = async (id: string) => {
    try {
      await resolveMutation.mutateAsync(id);
      toast.success('Alert resolved.');
    } catch { toast.error('Failed to resolve alert.'); }
  };

  const handleGenerate = async () => {
    try {
      const result = await generateMutation.mutateAsync();
      toast.success(`Scan complete: ${result.alerts_created} new alert(s) from ${result.products_scanned} products.`);
    } catch { toast.error('Scan failed.'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2">
          {(['active', 'acknowledged', 'all'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === s ? 'bg-brand text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={generateMutation.isPending}
          className="gap-2 text-sm"
        >
          <RefreshCw size={14} className={generateMutation.isPending ? 'animate-spin' : ''} />
          Scan Now
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg skeleton-shimmer" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCheck size={36} className="mx-auto mb-2 opacity-30" />
          <p className="font-medium">No alerts</p>
          <p className="text-sm">All stock levels look good.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-3 p-3 rounded-lg border bg-white hover:shadow-sm transition-shadow"
            >
              <div className={`mt-0.5 flex-shrink-0 px-2 py-0.5 rounded text-xs font-semibold ${PRIORITY_COLORS[alert.priority]}`}>
                {alert.priority}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{alert.product_name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                {alert.status === 'acknowledged' && alert.acknowledged_by_name && (
                  <p className="text-xs text-muted-foreground mt-0.5">Acknowledged by {alert.acknowledged_by_name}</p>
                )}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  alert.type === 'out_of_stock' ? 'bg-red-50 text-red-600' :
                  alert.type === 'low_stock' ? 'bg-orange-50 text-orange-600' :
                  alert.type === 'expiring_soon' ? 'bg-yellow-50 text-yellow-600' :
                  alert.type === 'expired' ? 'bg-red-50 text-red-600' :
                  'bg-blue-50 text-blue-600'
                }`}>
                  {alert.type_display}
                </span>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {alert.status === 'active' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground hover:text-brand"
                    onClick={() => handleAcknowledge(alert.id)}
                    disabled={acknowledgeMutation.isPending}
                  >
                    ACK
                  </Button>
                )}
                {alert.status !== 'resolved' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-green-600 hover:text-green-800"
                    onClick={() => handleResolve(alert.id)}
                    disabled={resolveMutation.isPending}
                  >
                    Resolve
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const CATEGORY_TABS = ['all', 'feeds', 'seeds', 'chemicals', 'semen', 'equipment'];

function getExpiryStatus(expiryDate: string | null | undefined) {
  if (!expiryDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  const daysLeft = Math.floor((expiry.getTime() - today.getTime()) / 86_400_000);
  if (daysLeft < 0) return { label: 'Expired', color: 'bg-red-100 text-red-700', daysLeft };
  if (daysLeft <= 30) return { label: `Exp in ${daysLeft}d`, color: 'bg-orange-100 text-orange-700', daysLeft };
  return {
    label: `Exp ${expiry.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}`,
    color: 'bg-gray-100 text-gray-600',
    daysLeft,
  };
}

const emptyForm: CreateProductPayload = {
  name: '', category: 0, price: '', unit: '',
  description: '', stock_level: 0, reorder_point: 10, max_stock: 100,
  supplier: '', expiry_date: null, is_ai_product: false,
};

export default function InventoryManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Stock adjustment dialog
  const [selectedItem, setSelectedItem] = useState<AdminProduct | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');

  // Edit details dialog (image + expiry + deactivate + stock log)
  const [editItem, setEditItem] = useState<AdminProduct | null>(null);
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create product dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateProductPayload>(emptyForm);
  const [createImageFile, setCreateImageFile] = useState<File | null>(null);
  const [createImagePreview, setCreateImagePreview] = useState<string | null>(null);
  const createFileInputRef = useRef<HTMLInputElement>(null);

  const { data: inventoryData = [], isLoading } = useInventory();
  const { data: categories = [] } = useCategories();
  const stockAdjustMutation = useStockAdjust();
  const updateProductMutation = useUpdateProduct();
  const createProductMutation = useCreateProduct();
  const deactivateProductMutation = useDeactivateProduct();
  const { data: stockLog = [] } = useStockLog(showHistory ? (editItem?.id ?? null) : null);

  const filteredInventory = useMemo(() => {
    return inventoryData.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || item.category_slug === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory, inventoryData]);

  const lowStockItems = inventoryData.filter(
    (item) => (item.stock_level ?? 0) <= (item.reorder_point ?? 0)
  );
  const expiringItems = inventoryData.filter((item) => {
    const s = getExpiryStatus(item.expiry_date);
    return s !== null && s.daysLeft <= 30;
  });

  const getStockStatus = (item: AdminProduct) => {
    const stock = item.stock_level ?? 0;
    const reorder = item.reorder_point ?? 0;
    const max = item.max_stock ?? 100;
    if (stock <= reorder) return { label: 'Low Stock', color: 'bg-red-100 text-red-700' };
    if (stock >= max * 0.8) return { label: 'Well Stocked', color: 'bg-green-100 text-green-700' };
    return { label: 'Moderate', color: 'bg-yellow-100 text-yellow-700' };
  };

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleAdjustStock = () => {
    if (!selectedItem || adjustQuantity === 0) return;
    stockAdjustMutation.mutate(
      { productId: selectedItem.id, adjustment: adjustQuantity, reason: adjustReason || undefined },
      {
        onSuccess: () => {
          toast.success(`Stock updated for ${selectedItem.name}`);
          setSelectedItem(null);
          setAdjustQuantity(0);
          setAdjustReason('');
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
          toast.error(msg ?? 'Stock adjustment failed.');
        },
      }
    );
  };

  const openEditDetails = (item: AdminProduct) => {
    setEditItem(item);
    setEditExpiryDate(item.expiry_date ?? '');
    setEditImageFile(null);
    setEditImagePreview(item.image ?? null);
    setShowHistory(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditImageFile(file);
    setEditImagePreview(URL.createObjectURL(file));
  };

  const handleSaveDetails = () => {
    if (!editItem) return;
    const formData = new FormData();
    if (editImageFile) formData.append('image', editImageFile);
    formData.append('expiry_date', editExpiryDate);

    updateProductMutation.mutate(
      { productId: editItem.id, payload: formData },
      {
        onSuccess: () => {
          toast.success(`${editItem.name} updated`);
          setEditItem(null);
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
          toast.error(msg ?? 'Update failed.');
        },
      }
    );
  };

  const handleDeactivate = () => {
    if (!editItem) return;
    deactivateProductMutation.mutate(editItem.id, {
      onSuccess: () => {
        toast.success(`${editItem.name} deactivated`);
        setEditItem(null);
      },
      onError: () => toast.error('Deactivate failed.'),
    });
  };

  const handleCreateImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCreateImageFile(file);
    setCreateImagePreview(URL.createObjectURL(file));
  };

  const handleCreateProduct = () => {
    if (!createForm.name || !createForm.category || !createForm.price || !createForm.unit) {
      toast.error('Name, category, price and unit are required.');
      return;
    }
    const formData = new FormData();
    Object.entries(createForm).forEach(([key, val]) => {
      if (val !== null && val !== undefined && val !== '') {
        formData.append(key, String(val));
      }
    });
    if (createImageFile) formData.append('image', createImageFile);
    createProductMutation.mutate(formData, {
      onSuccess: (product) => {
        toast.success(`${product.name} added to inventory`);
        setCreateOpen(false);
        setCreateForm(emptyForm);
        setCreateImageFile(null);
        setCreateImagePreview(null);
      },
      onError: (err: unknown) => {
        const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
        const msg = data ? Object.values(data).flat().join(' ') : 'Create failed.';
        toast.error(msg);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory Manager</h1>
          <p className="text-muted-foreground">Track and manage your stock levels</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-brand hover:bg-brand-600 text-white gap-2 shadow-sm rounded-xl"
        >
          <PlusCircle className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-700">Low Stock Alert ({lowStockItems.length} items)</p>
                <p className="text-sm text-red-600">
                  {lowStockItems.slice(0, 3).map((i) => i.name).join(', ')}
                  {lowStockItems.length > 3 && ` +${lowStockItems.length - 3} more`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expiry Alert */}
      {expiringItems.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CalendarX className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-orange-700">Expiry Alert ({expiringItems.length} items)</p>
                <p className="text-sm text-orange-600">
                  {expiringItems.slice(0, 3).map((i) => {
                    const s = getExpiryStatus(i.expiry_date);
                    return `${i.name} (${s?.label})`;
                  }).join(', ')}
                  {expiringItems.length > 3 && ` +${expiringItems.length - 3} more`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-xl font-bold text-foreground">{inventoryData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-xl font-bold text-red-600">{lowStockItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                <CalendarX className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
                <p className="text-xl font-bold text-orange-600">{expiringItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-xl font-bold text-foreground">
                  KES {inventoryData.reduce(
                    (sum, item) => sum + parseDecimal(item.price) * (item.stock_level ?? 0), 0
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Alerts */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <p className="text-base font-bold text-foreground">Stock Alerts</p>
        </CardHeader>
        <CardContent className="pt-0">
          <AlertsPanel />
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search inventory..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {CATEGORY_TABS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeCategory === cat
                      ? 'bg-brand text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Inventory Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-50">
                <tr>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Product</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stock</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Min/Max</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Price</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Expiry</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Loading inventory…</td></tr>
                )}
                {!isLoading && filteredInventory.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No products found.</td></tr>
                )}
                {filteredInventory.map((item) => {
                  const stockStatus = getStockStatus(item);
                  const expiryStatus = getExpiryStatus(item.expiry_date);
                  const stock = item.stock_level ?? 0;
                  const reorder = item.reorder_point ?? 0;
                  return (
                    <tr key={item.id} className={`border-t hover:bg-brand-50/30 ${!item.is_active ? 'opacity-50' : ''}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {item.image ? (
                            <img src={item.image} alt={item.name}
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center flex-shrink-0">
                              <Package className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.supplier}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary" className="capitalize">{item.category_name}</Badge>
                      </td>
                      <td className="p-4">
                        <span className={`font-bold ${stock <= reorder ? 'text-red-600' : 'text-foreground'}`}>
                          {stock}
                        </span>
                        <span className="text-sm text-muted-foreground"> {item.unit}</span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {item.reorder_point} / {item.max_stock}
                      </td>
                      <td className="p-4 font-medium font-mono">
                        KES {parseDecimal(item.price).toLocaleString()}
                      </td>
                      <td className="p-4">
                        {expiryStatus ? (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${expiryStatus.color}`}>
                            {expiryStatus.label}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                          {stockStatus.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setSelectedItem(item); setAdjustQuantity(0); setAdjustReason(''); }}
                            title="Adjust Stock"
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => openEditDetails(item)}
                            title="Edit Details"
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <ImagePlus className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Adjust Stock Dialog ────────────────────────────────── */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              Adjust Stock: {selectedItem?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-background p-4 rounded-xl flex justify-between items-center">
              <span className="text-muted-foreground">Current Stock</span>
              <span className="text-2xl font-bold text-foreground">
                {selectedItem?.stock_level ?? 0} {selectedItem?.unit}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Adjust Quantity</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAdjustQuantity((prev) => prev - 1)}
                  className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <Input
                  type="number"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(Number(e.target.value))}
                  className="text-center text-lg font-bold"
                />
                <button
                  onClick={() => setAdjustQuantity((prev) => prev + 1)}
                  className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Reason (optional)</p>
              <Input
                placeholder="e.g. Restock from supplier, Damaged goods..."
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
              />
            </div>
            <div className="bg-background p-4 rounded-xl flex justify-between items-center">
              <span className="text-muted-foreground">New Stock Level</span>
              <span className="text-2xl font-bold font-mono text-brand">
                {Math.max(0, (selectedItem?.stock_level ?? 0) + adjustQuantity)} {selectedItem?.unit}
              </span>
            </div>
            <Button
              onClick={handleAdjustStock}
              disabled={stockAdjustMutation.isPending || adjustQuantity === 0}
              className="w-full bg-brand hover:bg-brand-600 text-white h-12 font-semibold disabled:opacity-50 shadow-sm rounded-xl"
            >
              {stockAdjustMutation.isPending ? 'Updating…' : 'Update Stock'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Details Dialog ────────────────────────────────── */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              Edit: {editItem?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Image */}
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Product Image</p>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative w-full h-40 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-[#0B3A2C] transition-colors cursor-pointer bg-background flex items-center justify-center"
              >
                {editImagePreview ? (
                  <img src={editImagePreview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <ImagePlus className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Click to upload image</p>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              {editImageFile && <p className="text-xs text-muted-foreground mt-1">{editImageFile.name}</p>}
            </div>

            {/* Expiry Date */}
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Expiry Date</p>
              <Input type="date" value={editExpiryDate} onChange={(e) => setEditExpiryDate(e.target.value)} />
              {editExpiryDate && (() => {
                const s = getExpiryStatus(editExpiryDate);
                return s ? (
                  <p className={`text-xs mt-1 font-medium ${s.daysLeft < 0 ? 'text-red-600' : s.daysLeft <= 30 ? 'text-orange-600' : 'text-green-600'}`}>
                    {s.daysLeft < 0 ? 'Already expired' : s.daysLeft === 0 ? 'Expires today' : `Expires in ${s.daysLeft} days`}
                  </p>
                ) : null;
              })()}
            </div>

            {/* Save / Cancel */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setEditItem(null)} className="flex-1">Cancel</Button>
              <Button
                onClick={handleSaveDetails}
                disabled={updateProductMutation.isPending}
                className="flex-1 bg-brand hover:bg-brand-600 text-white font-semibold disabled:opacity-50 shadow-sm rounded-xl"
              >
                {updateProductMutation.isPending ? 'Saving…' : 'Save Details'}
              </Button>
            </div>

            {/* Stock History toggle */}
            <div className="border-t pt-4">
              <button
                onClick={() => setShowHistory((h) => !h)}
                className="flex items-center gap-2 text-sm font-medium text-brand hover:underline"
              >
                <History className="w-4 h-4" />
                {showHistory ? 'Hide' : 'Show'} Stock History
              </button>
              {showHistory && (
                <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                  {stockLog.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No stock movements recorded yet.</p>
                  ) : stockLog.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between py-2 border-b last:border-0 gap-3">
                      <div className="flex items-center gap-2">
                        {entry.change > 0
                          ? <TrendingUp className="w-4 h-4 text-green-600 flex-shrink-0" />
                          : <TrendingDown className="w-4 h-4 text-red-600 flex-shrink-0" />
                        }
                        <div>
                          <p className="text-sm font-medium text-foreground">{entry.reason_display}</p>
                          {entry.note && <p className="text-xs text-muted-foreground">{entry.note}</p>}
                          <p className="text-xs text-muted-foreground">
                            {entry.user_name} · {new Date(entry.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <span className={`text-sm font-bold flex-shrink-0 ${entry.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {entry.change > 0 ? '+' : ''}{entry.change}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Deactivate */}
            <div className="border-t pt-4">
              <button
                onClick={handleDeactivate}
                disabled={deactivateProductMutation.isPending}
                className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {deactivateProductMutation.isPending ? 'Deactivating…' : 'Deactivate Product'}
              </button>
              <p className="text-xs text-muted-foreground mt-1">Product will be hidden from inventory but not deleted.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Create Product Dialog ──────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">Add New Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium text-foreground mb-1 block">Product Name *</label>
                <Input
                  placeholder="e.g. Unga Feeds 50kg"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Category *</label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                  value={createForm.category || ''}
                  onChange={(e) => setCreateForm((f) => ({ ...f, category: Number(e.target.value) }))}
                >
                  <option value="">Select…</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Unit *</label>
                <Input
                  placeholder="e.g. bag, litre, straw"
                  value={createForm.unit}
                  onChange={(e) => setCreateForm((f) => ({ ...f, unit: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Price (KES) *</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={createForm.price}
                  onChange={(e) => setCreateForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Stock Level</label>
                <Input
                  type="number"
                  value={createForm.stock_level ?? 0}
                  onChange={(e) => setCreateForm((f) => ({ ...f, stock_level: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Reorder Point</label>
                <Input
                  type="number"
                  value={createForm.reorder_point ?? 10}
                  onChange={(e) => setCreateForm((f) => ({ ...f, reorder_point: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Max Stock</label>
                <Input
                  type="number"
                  value={createForm.max_stock ?? 100}
                  onChange={(e) => setCreateForm((f) => ({ ...f, max_stock: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Supplier</label>
                <Input
                  placeholder="Supplier name"
                  value={createForm.supplier ?? ''}
                  onChange={(e) => setCreateForm((f) => ({ ...f, supplier: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Expiry Date</label>
                <Input
                  type="date"
                  value={createForm.expiry_date ?? ''}
                  onChange={(e) => setCreateForm((f) => ({ ...f, expiry_date: e.target.value || null }))}
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-foreground mb-1 block">Description</label>
                <textarea
                  rows={3}
                  className="w-full border rounded-md px-3 py-2 text-sm resize-none"
                  placeholder="Brief product description..."
                  value={createForm.description ?? ''}
                  onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-foreground mb-2 block">Product Image</label>
                <div
                  onClick={() => createFileInputRef.current?.click()}
                  className="relative w-full h-40 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-[#0B3A2C] transition-colors cursor-pointer bg-background flex items-center justify-center"
                >
                  {createImagePreview ? (
                    <img src={createImagePreview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <ImagePlus className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">Click to upload image</p>
                    </div>
                  )}
                </div>
                <input ref={createFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleCreateImageChange} />
                {createImageFile && <p className="text-xs text-muted-foreground mt-1">{createImageFile.name}</p>}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)} className="flex-1">Cancel</Button>
              <Button
                onClick={handleCreateProduct}
                disabled={createProductMutation.isPending}
                className="flex-1 bg-brand hover:bg-brand-600 text-white font-semibold disabled:opacity-50 shadow-sm rounded-xl"
              >
                {createProductMutation.isPending ? 'Adding…' : 'Add Product'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
