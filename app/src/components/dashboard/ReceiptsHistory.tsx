import { useState, useEffect } from 'react';
import {
  Search, Calendar, Printer, Download, RotateCcw, ChevronLeft, ChevronRight,
  X, Receipt, Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAllSales, useSaleDetail, useDownloadPDF, useGetReceiptHtml, useCreateReturn } from '@/hooks/useSales';
import { printReceipt } from '@/utils/receipt';
import { parseDecimal } from '@/utils/formatCurrency';
import type { SaleListParams, ApiSale, ApiSaleListItem } from '@/api/customers';
import type { CreateReturnPayload } from '@/api/sales';

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash',
  mpesa: 'M-Pesa',
  card: 'Card',
};

const PAYMENT_TABS = [
  { value: '' as const, label: 'All' },
  { value: 'cash' as const, label: 'Cash' },
  { value: 'mpesa' as const, label: 'M-Pesa' },
  { value: 'card' as const, label: 'Card' },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function thirtyDaysAgoStr() {
  const d = new Date();
  d.setDate(d.getDate() - 29);
  return d.toISOString().slice(0, 10);
}

function StatusBadge({ status, isReturn }: { status: string; isReturn: boolean }) {
  if (isReturn) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
        Return
      </span>
    );
  }
  const cls: Record<string, string> = {
    completed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${cls[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ── Return Dialog ────────────────────────────────────────────────────────────

interface ReturnItem {
  product_id: string;
  product_name: string;
  max_qty: number;
  quantity: number;
}

function ReturnDialog({
  sale,
  open,
  onClose,
}: {
  sale: ApiSale;
  open: boolean;
  onClose: () => void;
}) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'card'>('cash');
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const createReturn = useCreateReturn();

  // Reset dialog state when it opens — setState driven by dialog toggle, not render cascade
  useEffect(() => {
    if (open) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setReturnItems(
        sale.items.map((item) => ({
          product_id: item.product,
          product_name: item.product_name,
          max_qty: item.quantity,
          quantity: item.quantity,
        }))
      );
      setPaymentMethod('cash');
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open, sale]);

  const hasItems = returnItems.some((i) => i.quantity > 0);

  const handleSubmit = () => {
    const itemsToReturn = returnItems.filter((i) => i.quantity > 0);
    if (itemsToReturn.length === 0) {
      toast.error('Select at least one item to return.');
      return;
    }

    const payload: CreateReturnPayload = {
      is_return: true,
      parent_sale_id: sale.id,
      payment_method: paymentMethod,
      items: itemsToReturn.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
      })),
    };

    createReturn.mutate(payload, {
      onSuccess: (res) => {
        toast.success(`Return ${res.receipt_number} processed successfully`);
        onClose();
      },
      onError: () => {
        toast.error('Failed to process return. Please try again.');
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">
            Create Return — {sale.receipt_number}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <p className="text-sm text-muted-foreground">Adjust quantities to return (0 = keep, max = full return).</p>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {returnItems.map((item, idx) => (
              <div key={item.product_id} className="flex items-center justify-between gap-3 py-1 border-b last:border-0">
                <span className="text-sm text-foreground flex-1 truncate">{item.product_name}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setReturnItems((prev) =>
                        prev.map((ri, i) => i === idx ? { ...ri, quantity: Math.max(0, ri.quantity - 1) } : ri)
                      )
                    }
                    className="w-6 h-6 rounded border text-sm font-bold flex items-center justify-center hover:bg-gray-100 disabled:opacity-40"
                    disabled={item.quantity === 0}
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setReturnItems((prev) =>
                        prev.map((ri, i) => i === idx ? { ...ri, quantity: Math.min(ri.max_qty, ri.quantity + 1) } : ri)
                      )
                    }
                    className="w-6 h-6 rounded border text-sm font-bold flex items-center justify-center hover:bg-gray-100 disabled:opacity-40"
                    disabled={item.quantity === item.max_qty}
                  >
                    +
                  </button>
                  <span className="text-xs text-muted-foreground w-12 text-right">/ {item.max_qty}</span>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Refund method</label>
            <div className="flex gap-2 mt-1">
              {(['cash', 'mpesa', 'card'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    paymentMethod === m
                      ? 'bg-brand text-white border-brand'
                      : 'border-gray-200 text-foreground hover:bg-gray-50'
                  }`}
                >
                  {PAYMENT_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!hasItems || createReturn.isPending}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
            >
              {createReturn.isPending ? 'Processing…' : 'Confirm Return'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Sale Detail Modal ─────────────────────────────────────────────────────────

function SaleDetailModal({
  saleId,
  onClose,
}: {
  saleId: string | null;
  onClose: () => void;
}) {
  const { data: sale, isLoading } = useSaleDetail(saleId);
  const downloadPDF = useDownloadPDF();
  const getHtml = useGetReceiptHtml();
  const [showReturn, setShowReturn] = useState(false);

  const handleReprint = () => {
    if (!saleId) return;
    getHtml.mutate(saleId, {
      onSuccess: (html) => printReceipt(html),
      onError: () => toast.error('Failed to load receipt for printing.'),
    });
  };

  const handleDownloadPDF = () => {
    if (!sale) return;
    downloadPDF.mutate({ saleId: sale.id, receiptNumber: sale.receipt_number });
  };

  return (
    <>
      <Dialog open={!!saleId} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 flex-wrap">
              <DialogTitle className="text-lg font-bold text-foreground">
                {isLoading ? 'Loading…' : sale?.receipt_number}
              </DialogTitle>
              {sale && (
                <StatusBadge status={sale.status} isReturn={sale.is_return} />
              )}
            </div>
          </DialogHeader>

          {isLoading && (
            <div className="py-8 text-center text-muted-foreground text-sm">Loading receipt…</div>
          )}

          {sale && (
            <div className="space-y-4 mt-2">
              {/* Meta */}
              <div className="bg-background rounded-xl p-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="text-foreground">
                    {new Date(sale.created_at).toLocaleString('en-GB', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="text-foreground">{sale.customer_display || sale.customer_name || 'Walk-in'}</span>
                </div>
                {sale.customer_phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="text-foreground">{sale.customer_phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cashier</span>
                  <span className="text-foreground">{sale.served_by_name ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="text-foreground">{PAYMENT_LABELS[sale.payment_method] ?? sale.payment_method}</span>
                </div>
                {sale.is_return && sale.parent_receipt_number && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Original Receipt</span>
                    <span className="text-orange-700 font-medium">{sale.parent_receipt_number}</span>
                  </div>
                )}
              </div>

              {/* Items */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1">
                  <Package className="w-4 h-4" /> Items
                </p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b">
                      <th className="text-left pb-1 font-medium">Product</th>
                      <th className="text-center pb-1 font-medium w-12">Qty</th>
                      <th className="text-right pb-1 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.items.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-1.5 text-foreground">{item.product_name}</td>
                        <td className="py-1.5 text-center text-muted-foreground">×{item.quantity}</td>
                        <td className="py-1.5 text-right text-foreground">
                          KES {parseDecimal(item.line_total).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="border-t pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>KES {parseDecimal(sale.subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>VAT (16%)</span>
                  <span>KES {parseDecimal(sale.tax).toLocaleString()}</span>
                </div>
                {parseDecimal(sale.discount) > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Discount</span>
                    <span>-KES {parseDecimal(sale.discount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold font-mono text-foreground text-base pt-1 border-t">
                  <span>TOTAL</span>
                  <span>KES {parseDecimal(sale.total).toLocaleString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReprint}
                  disabled={getHtml.isPending}
                  className="flex-1 gap-1"
                >
                  <Printer className="w-4 h-4" />
                  {getHtml.isPending ? 'Loading…' : 'Reprint'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPDF}
                  disabled={downloadPDF.isPending}
                  className="flex-1 gap-1"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </Button>
                {!sale.is_return && (
                  <Button
                    size="sm"
                    onClick={() => setShowReturn(true)}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white gap-1"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Return
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {sale && (
        <ReturnDialog
          sale={sale}
          open={showReturn}
          onClose={() => setShowReturn(false)}
        />
      )}
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ReceiptsHistory() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'' | 'cash' | 'mpesa' | 'card'>('');
  const [showReturnsOnly, setShowReturnsOnly] = useState(false);
  const [startDate, setStartDate] = useState(thirtyDaysAgoStr());
  const [endDate, setEndDate] = useState(todayStr());
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page when any filter changes — driven by filter toggle, not render cascade
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { setPage(1); }, [paymentFilter, showReturnsOnly, startDate, endDate]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const params: SaleListParams = {
    start_date: startDate,
    end_date: endDate,
    search: debouncedSearch || undefined,
    payment_method: paymentFilter || undefined,
    is_return: showReturnsOnly ? true : undefined,
    page,
    page_size: 25,
  };

  const { data, isLoading, isFetching } = useAllSales(params);
  const sales = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = data?.total_pages ?? 1;

  const handleRowClick = (sale: ApiSaleListItem) => setSelectedSaleId(sale.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Receipt History</h1>
        <p className="text-muted-foreground">Search and browse all past sales transactions</p>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-4">
          {/* Row 1: date range + search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm"
              />
              <span className="text-muted-foreground text-sm">to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Receipt #, customer name or phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Row 2: payment tabs + returns toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
              {PAYMENT_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setPaymentFilter(tab.value)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    paymentFilter === tab.value
                      ? 'bg-brand text-white shadow-sm rounded-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowReturnsOnly((p) => !p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                showReturnsOnly
                  ? 'bg-orange-100 text-orange-700 border-orange-200'
                  : 'text-muted-foreground border-gray-200 hover:bg-gray-50'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Returns only
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Result summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {isLoading ? 'Loading…' : `Showing ${sales.length} of ${totalCount} receipts`}
          {isFetching && !isLoading && ' · Refreshing…'}
        </span>
        <span>Page {page} of {totalPages}</span>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Receipt #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date & Time</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Cashier</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Payment</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">Loading receipts…</td>
                </tr>
              )}
              {!isLoading && sales.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    No receipts found for the selected filters.
                  </td>
                </tr>
              )}
              {sales.map((sale) => (
                <tr
                  key={sale.id}
                  onClick={() => handleRowClick(sale)}
                  className="border-b last:border-0 hover:bg-brand-50/30 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-brand font-medium">{sale.receipt_number}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(sale.created_at).toLocaleString('en-GB', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3 text-foreground max-w-32 truncate">{sale.customer_display}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{sale.served_by_name ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-bold font-mono text-foreground">
                    KES {parseDecimal(sale.total).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell text-muted-foreground">
                    {PAYMENT_LABELS[sale.payment_method] ?? sale.payment_method}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={sale.status} isReturn={sale.is_return} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isFetching}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || isFetching}
            className="gap-1"
          >
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Sale Detail Modal */}
      <SaleDetailModal
        saleId={selectedSaleId}
        onClose={() => setSelectedSaleId(null)}
      />
    </div>
  );
}
