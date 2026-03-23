import { useState } from 'react';
import {
  Search, Phone, MapPin, ShoppingBag, Plus, User, Edit2, Save, X,
  Receipt, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useCustomers, useCreateCustomer, useUpdateCustomer, useCustomerSales } from '@/hooks/useCustomers';
import type { ApiCustomer } from '@/api/customers';
import { parseDecimal } from '@/utils/formatCurrency';

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash',
  mpesa: 'M-Pesa',
  card: 'Card',
};

function PurchaseHistory({ customerId }: { customerId: string }) {
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data, isLoading } = useCustomerSales(customerId, page, 5);

  const sales = data?.results ?? [];
  const totalPages = data?.total_pages ?? 1;

  if (isLoading) return <p className="text-sm text-muted-foreground py-2">Loading sales…</p>;
  if (sales.length === 0 && page === 1) return <p className="text-sm text-muted-foreground py-2">No purchases recorded yet.</p>;

  return (
    <div className="space-y-1">
      {sales.map((sale) => (
        <div key={sale.id} className="border-b last:border-0">
          <button
            type="button"
            onClick={() => setExpandedId(expandedId === sale.id ? null : sale.id)}
            className="w-full flex items-center justify-between py-2 gap-3 text-left hover:bg-brand-50/30 rounded-lg px-1 transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                {sale.receipt_number}
                {sale.is_return && (
                  <span className="px-1.5 py-0.5 rounded text-xs bg-orange-100 text-orange-700 font-bold">Return</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(sale.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                {' · '}{PAYMENT_LABELS[sale.payment_method] ?? sale.payment_method}
              </p>
            </div>
            <span className="text-sm font-bold font-mono text-brand flex-shrink-0">
              KES {parseDecimal(sale.total).toLocaleString()}
            </span>
          </button>
          {expandedId === sale.id && sale.items.length > 0 && (
            <div className="pb-2 px-1 space-y-0.5">
              {sale.items.map((item) => (
                <div key={item.id} className="flex justify-between text-xs text-muted-foreground bg-background px-2 py-1 rounded">
                  <span>{item.product_name} ×{item.quantity}</span>
                  <span className="font-mono">KES {parseDecimal(item.line_total).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40 transition-colors"
          >
            ← Prev
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<ApiCustomer | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showPurchases, setShowPurchases] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', location: '', notes: '' });

  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', location: '', notes: '' });

  const { data: customers = [], isLoading } = useCustomers();
  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = customers.reduce((sum, c) => sum + parseDecimal(c.total_purchases), 0);

  const openCustomer = (c: ApiCustomer) => {
    setSelectedCustomer(c);
    setEditMode(false);
    setShowPurchases(false);
  };

  const startEdit = () => {
    if (!selectedCustomer) return;
    setEditForm({
      name: selectedCustomer.name,
      phone: selectedCustomer.phone,
      email: selectedCustomer.email,
      location: selectedCustomer.location,
      notes: selectedCustomer.notes,
    });
    setEditMode(true);
  };

  const handleSaveEdit = () => {
    if (!selectedCustomer) return;
    if (!editForm.name || !editForm.phone) {
      toast.error('Name and phone are required.');
      return;
    }
    updateCustomerMutation.mutate(
      { id: selectedCustomer.id, payload: editForm },
      {
        onSuccess: (updated) => {
          toast.success('Customer updated');
          setSelectedCustomer(updated);
          setEditMode(false);
        },
        onError: (err: unknown) => {
          const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
          const msg = data ? Object.values(data).flat().join(' ') : 'Update failed.';
          toast.error(msg);
        },
      }
    );
  };

  const addCustomer = () => {
    if (!newCustomer.name || !newCustomer.phone) {
      toast.error('Name and phone are required.');
      return;
    }
    createCustomerMutation.mutate(newCustomer, {
      onSuccess: () => {
        toast.success('Customer added successfully');
        setIsAddDialogOpen(false);
        setNewCustomer({ name: '', phone: '', email: '', location: '', notes: '' });
      },
      onError: (err: unknown) => {
        const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
        const msg = data ? Object.values(data).flat().join(' ') : 'Failed to add customer.';
        toast.error(msg);
      },
    });
  };

  // eslint-disable-next-line react-hooks/purity -- Date.now() used for display-only "active this month" count; staleness is acceptable
  const now = Date.now();
  const activeThisMonthCount = customers.filter((c) => {
    if (!c.last_purchase) return false;
    return (now - new Date(c.last_purchase).getTime()) / 86_400_000 <= 30;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground">Manage your customer database</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-brand hover:bg-brand-600 text-white shadow-sm rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold text-foreground">{isLoading ? '…' : customers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold font-mono text-foreground">KES {totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active This Month</p>
                <p className="text-2xl font-bold text-green-600">
                  {activeThisMonthCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Customer Grid */}
      {filteredCustomers.length === 0 && !isLoading && (
        <p className="text-center text-muted-foreground py-8">No customers found.</p>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => (
          <Card
            key={customer.id}
            onClick={() => openCustomer(customer)}
            className="border-0 shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-shadow cursor-pointer"
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-brand rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">{customer.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground truncate">{customer.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <Phone className="w-3 h-3" />
                    <span>{customer.phone}</span>
                  </div>
                  {customer.location && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>{customer.location}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Purchases</p>
                  <p className="font-bold font-mono text-brand">
                    KES {parseDecimal(customer.total_purchases).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  {customer.loyalty_points > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/20 text-[#b8860b] text-xs font-bold mb-1 block">
                      ★ {customer.loyalty_points} pts
                    </span>
                  )}
                  <p className="text-xs text-muted-foreground">Last Purchase</p>
                  <p className="text-sm text-foreground">
                    {customer.last_purchase ? new Date(customer.last_purchase).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Add Customer Dialog ─────────────────────────────────── */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {[
              { label: 'Name *', key: 'name', placeholder: 'Full name', type: 'text' },
              { label: 'Phone *', key: 'phone', placeholder: '+254 7XX XXX XXX', type: 'tel' },
              { label: 'Email', key: 'email', placeholder: 'email@example.com', type: 'email' },
              { label: 'Location', key: 'location', placeholder: 'Naromoru, Nanyuki, etc.', type: 'text' },
            ].map(({ label, key, placeholder, type }) => (
              <div key={key}>
                <label className="text-sm font-medium text-foreground">{label}</label>
                <Input
                  type={type}
                  value={newCustomer[key as keyof typeof newCustomer]}
                  onChange={(e) => setNewCustomer({ ...newCustomer, [key]: e.target.value })}
                  placeholder={placeholder}
                />
              </div>
            ))}
            <div>
              <label className="text-sm font-medium text-foreground">Notes</label>
              <textarea
                value={newCustomer.notes}
                onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                placeholder="Any additional information..."
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input text-sm"
              />
            </div>
            <Button
              onClick={addCustomer}
              disabled={createCustomerMutation.isPending}
              className="w-full bg-brand hover:bg-brand-600 text-white h-12 font-semibold disabled:opacity-50"
            >
              {createCustomerMutation.isPending ? 'Adding…' : 'Add Customer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Customer Detail Dialog ──────────────────────────────── */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold text-foreground">
                {editMode ? 'Edit Customer' : 'Customer Details'}
              </DialogTitle>
              {!editMode && (
                <button
                  onClick={startEdit}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </DialogHeader>

          {editMode ? (
            /* ── Edit Form ── */
            <div className="space-y-4 mt-4">
              {[
                { label: 'Name *', key: 'name', type: 'text' },
                { label: 'Phone *', key: 'phone', type: 'tel' },
                { label: 'Email', key: 'email', type: 'email' },
                { label: 'Location', key: 'location', type: 'text' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="text-sm font-medium text-foreground">{label}</label>
                  <Input
                    type={type}
                    value={editForm[key as keyof typeof editForm]}
                    onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                  />
                </div>
              ))}
              <div>
                <label className="text-sm font-medium text-foreground">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input text-sm"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setEditMode(false)}
                  className="flex-1 gap-2"
                >
                  <X className="w-4 h-4" /> Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={updateCustomerMutation.isPending}
                  className="flex-1 bg-brand hover:bg-brand-600 text-white gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {updateCustomerMutation.isPending ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>
          ) : (
            /* ── View Mode ── */
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-brand rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">{selectedCustomer?.name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{selectedCustomer?.name}</h3>
                  <p className="text-muted-foreground">
                    {selectedCustomer?.last_purchase
                      ? `Customer since ${new Date(selectedCustomer.last_purchase).getFullYear()}`
                      : 'New customer'}
                  </p>
                </div>
              </div>

              <div className="bg-background p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <span>{selectedCustomer?.phone}</span>
                </div>
                {selectedCustomer?.email && (
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-center text-muted-foreground font-medium">@</span>
                    <span>{selectedCustomer.email}</span>
                  </div>
                )}
                {selectedCustomer?.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <span>{selectedCustomer.location}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-brand p-4 rounded-2xl text-white">
                  <p className="text-sm opacity-80">Total Purchases</p>
                  <p className="text-xl font-bold font-mono">
                    KES {parseDecimal(selectedCustomer?.total_purchases ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gold p-4 rounded-2xl">
                  <p className="text-sm text-foreground/80">Last Purchase</p>
                  <p className="text-xl font-bold text-foreground">
                    {selectedCustomer?.last_purchase
                      ? new Date(selectedCustomer.last_purchase).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-700 font-medium">Loyalty Points</p>
                  <p className="text-xs text-amber-600">1 pt earned per KES 100 spent · redeemable at POS</p>
                </div>
                <span className="text-3xl font-black text-amber-600">★ {selectedCustomer?.loyalty_points ?? 0}</span>
              </div>

              {selectedCustomer?.notes && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.notes}</p>
                </div>
              )}

              {/* Purchase History */}
              <div className="border-t pt-4">
                <button
                  onClick={() => setShowPurchases((p) => !p)}
                  className="flex items-center gap-2 text-sm font-medium text-brand w-full justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Receipt className="w-4 h-4" />
                    Recent Purchases
                  </span>
                  {showPurchases ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showPurchases && selectedCustomer && (
                  <div className="mt-3">
                    <PurchaseHistory customerId={selectedCustomer.id} />
                  </div>
                )}
              </div>

              <a href={`tel:${selectedCustomer?.phone}`}>
                <Button className="w-full bg-brand hover:bg-brand-600 text-white h-12 font-semibold">
                  <Phone className="w-5 h-5 mr-2" />
                  Call Customer
                </Button>
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
