import { useState } from "react";
import {
  Plus, PackageSearch, ChevronDown, ChevronRight, Truck, CheckCircle,
  Clock, Send, X, PackageCheck, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  usePurchaseOrders,
  useCreatePurchaseOrder,
  useUpdatePurchaseOrder,
  useReceivePurchaseOrder,
} from "@/hooks/usePurchaseOrders";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useInventory } from "@/hooks/useProducts";
import type { PurchaseOrder, POStatus, PurchaseOrderItem } from "@/types";
import type { POItemPayload } from "@/api/purchaseOrders";

const STATUS_COLORS: Record<POStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  confirmed: "bg-indigo-100 text-indigo-700",
  partial: "bg-yellow-100 text-yellow-700",
  received: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const STATUS_ICONS: Record<POStatus, React.ReactNode> = {
  draft: <Clock size={12} />,
  sent: <Send size={12} />,
  confirmed: <CheckCircle size={12} />,
  partial: <Truck size={12} />,
  received: <PackageCheck size={12} />,
  cancelled: <X size={12} />,
};

function StatusBadge({ status, label }: { status: POStatus; label?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
      {STATUS_ICONS[status]}
      {label || status}
    </span>
  );
}

function POCard({ po, onReceive, onStatusChange }: {
  po: PurchaseOrder;
  onReceive: (po: PurchaseOrder) => void;
  onStatusChange: (po: PurchaseOrder, status: POStatus) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const total = parseFloat(po.total);

  return (
    <Card className="border">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold text-[#0B3A2C]">{po.po_number}</CardTitle>
              <StatusBadge status={po.status} label={po.status_display} />
            </div>
            <p className="text-xs text-[#6B7A72] mt-0.5">
              {po.supplier_name}
              {po.expected_delivery && ` · Expected ${new Date(po.expected_delivery).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-[#111915]">KES {total.toLocaleString()}</p>
            <p className="text-xs text-[#6B7A72]">{po.items.length} item{po.items.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-[#6B7A72] p-0 h-auto hover:text-[#0B3A2C] gap-1"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            {expanded ? "Hide items" : "Show items"}
          </Button>
          <div className="flex gap-2">
            {po.status !== "received" && po.status !== "cancelled" && (
              <>
                {po.status === "draft" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={() => onStatusChange(po, "sent")}
                  >
                    <Send size={11} /> Mark Sent
                  </Button>
                )}
                {po.status === "sent" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={() => onStatusChange(po, "confirmed")}
                  >
                    <CheckCircle size={11} /> Confirm
                  </Button>
                )}
                {(po.status === "confirmed" || po.status === "partial") && (
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-[#0B3A2C] hover:bg-[#0B3A2C]/90 text-white gap-1"
                    onClick={() => onReceive(po)}
                  >
                    <Truck size={11} /> Receive Items
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {expanded && (
          <div className="mt-3 border-t pt-3 space-y-2">
            {po.items.map((item: PurchaseOrderItem) => (
              <div key={item.id} className="flex items-center justify-between text-sm gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#111915] truncate">{item.product_name}</p>
                  <p className="text-xs text-[#6B7A72]">
                    KES {parseFloat(item.unit_cost).toLocaleString()} × {item.quantity_ordered} {item.product_unit}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-medium text-[#0B3A2C]">
                    KES {parseFloat(item.line_total).toLocaleString()}
                  </p>
                  {item.quantity_received > 0 && (
                    <p className="text-xs text-green-600">
                      {item.quantity_received}/{item.quantity_ordered} received
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type LineItem = { product: string; product_name: string; quantity_ordered: number; unit_cost: string };

export default function PurchaseOrders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<POStatus | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [receivedQtys, setReceivedQtys] = useState<Record<number, number>>({});

  // Create PO form
  const [poForm, setPoForm] = useState({
    supplier: "",
    expected_delivery: "",
    notes: "",
    shipping: "0",
    tax: "0",
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { product: "", product_name: "", quantity_ordered: 1, unit_cost: "" },
  ]);

  const { data: pos = [], isLoading } = usePurchaseOrders(
    statusFilter !== "all" ? { status: statusFilter } : undefined
  );
  const { data: suppliers = [] } = useSuppliers(true);
  const { data: products = [] } = useInventory();
  const createMutation = useCreatePurchaseOrder();
  const updateMutation = useUpdatePurchaseOrder();
  const receiveMutation = useReceivePurchaseOrder();

  const filtered = pos.filter(
    (po) =>
      po.po_number.toLowerCase().includes(search.toLowerCase()) ||
      po.supplier_name.toLowerCase().includes(search.toLowerCase())
  );

  const openReceive = (po: PurchaseOrder) => {
    setSelectedPO(po);
    const initialQtys: Record<number, number> = {};
    po.items.forEach((item) => { initialQtys[item.id] = item.remaining; });
    setReceivedQtys(initialQtys);
    setReceiveOpen(true);
  };

  const handleStatusChange = async (po: PurchaseOrder, newStatus: POStatus) => {
    try {
      await updateMutation.mutateAsync({ id: po.id, data: { status: newStatus } });
      toast.success(`PO marked as ${newStatus}.`);
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const handleReceive = async () => {
    if (!selectedPO) return;
    const items = selectedPO.items
      .filter((item) => (receivedQtys[item.id] ?? 0) > 0)
      .map((item) => ({ item_id: item.id, quantity_received: receivedQtys[item.id] ?? 0 }));
    if (items.length === 0) {
      toast.error("Enter at least one quantity to receive.");
      return;
    }
    try {
      await receiveMutation.mutateAsync({ id: selectedPO.id, items });
      toast.success("Stock updated successfully.");
      setReceiveOpen(false);
    } catch {
      toast.error("Failed to receive items.");
    }
  };

  const addLine = () =>
    setLineItems((prev) => [
      ...prev,
      { product: "", product_name: "", quantity_ordered: 1, unit_cost: "" },
    ]);

  const removeLine = (i: number) => setLineItems((prev) => prev.filter((_, idx) => idx !== i));

  const updateLine = (i: number, field: keyof LineItem, value: string | number) =>
    setLineItems((prev) =>
      prev.map((line, idx) => {
        if (idx !== i) return line;
        if (field === "product") {
          const prod = products.find((p) => p.id === value);
          return { ...line, product: String(value), product_name: prod?.name ?? "" };
        }
        return { ...line, [field]: value };
      })
    );

  const subtotal = lineItems.reduce(
    (sum, l) => sum + (parseFloat(l.unit_cost) || 0) * l.quantity_ordered,
    0
  );

  const handleCreatePO = async () => {
    if (!poForm.supplier) { toast.error("Select a supplier."); return; }
    const validItems = lineItems.filter((l) => l.product && l.unit_cost && l.quantity_ordered > 0);
    if (validItems.length === 0) { toast.error("Add at least one product line."); return; }

    const items: POItemPayload[] = validItems.map((l) => ({
      product: l.product,
      quantity_ordered: l.quantity_ordered,
      unit_cost: l.unit_cost,
    }));

    try {
      await createMutation.mutateAsync({
        supplier: poForm.supplier,
        expected_delivery: poForm.expected_delivery || undefined,
        notes: poForm.notes,
        shipping: poForm.shipping,
        tax: poForm.tax,
        items,
      });
      toast.success("Purchase order created.");
      setCreateOpen(false);
      setPoForm({ supplier: "", expected_delivery: "", notes: "", shipping: "0", tax: "0" });
      setLineItems([{ product: "", product_name: "", quantity_ordered: 1, unit_cost: "" }]);
    } catch {
      toast.error("Failed to create purchase order.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#111915]">Purchase Orders</h2>
          <p className="text-sm text-[#6B7A72]">{pos.length} order{pos.length !== 1 ? "s" : ""}</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-[#0B3A2C] hover:bg-[#0B3A2C]/90 text-white gap-2"
        >
          <Plus size={16} /> New PO
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7A72]" />
          <Input
            placeholder="Search POs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as POStatus | "all")}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* PO List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 h-20" />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#6B7A72]">
          <PackageSearch size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No purchase orders found</p>
          <p className="text-sm">Create your first PO to start receiving stock.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((po) => (
            <POCard
              key={po.id}
              po={po}
              onReceive={openReceive}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* Create PO Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Supplier *</Label>
                <Select value={poForm.supplier} onValueChange={(v) => setPoForm((f) => ({ ...f, supplier: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Expected Delivery</Label>
                <Input
                  type="date"
                  value={poForm.expected_delivery}
                  onChange={(e) => setPoForm((f) => ({ ...f, expected_delivery: e.target.value }))}
                />
              </div>
              <div>
                <Label>Shipping (KES)</Label>
                <Input
                  type="number"
                  value={poForm.shipping}
                  onChange={(e) => setPoForm((f) => ({ ...f, shipping: e.target.value }))}
                  min={0}
                />
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Products *</Label>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={addLine}>
                  <Plus size={12} /> Add row
                </Button>
              </div>
              <div className="space-y-2">
                {lineItems.map((line, i) => (
                  <div key={i} className="grid grid-cols-[1fr_80px_100px_32px] gap-2 items-end">
                    <div>
                      <Select value={line.product} onValueChange={(v) => updateLine(i, "product", v)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      type="number"
                      min={1}
                      value={line.quantity_ordered}
                      onChange={(e) => updateLine(i, "quantity_ordered", parseInt(e.target.value) || 1)}
                      placeholder="Qty"
                      className="h-8 text-sm"
                    />
                    <Input
                      type="number"
                      min={0}
                      value={line.unit_cost}
                      onChange={(e) => updateLine(i, "unit_cost", e.target.value)}
                      placeholder="Unit cost"
                      className="h-8 text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-600"
                      onClick={() => removeLine(i)}
                      disabled={lineItems.length === 1}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="text-right mt-2 text-sm font-semibold text-[#0B3A2C]">
                Subtotal: KES {subtotal.toLocaleString()}
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={poForm.notes}
                onChange={(e) => setPoForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="Additional notes..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button
                onClick={handleCreatePO}
                disabled={createMutation.isPending}
                className="bg-[#0B3A2C] hover:bg-[#0B3A2C]/90 text-white"
              >
                Create Purchase Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receive Items Dialog */}
      <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Receive Items — {selectedPO?.po_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-[#6B7A72]">
              Enter the quantity received for each product. Stock levels will be updated automatically.
            </p>
            {selectedPO?.items.map((item: PurchaseOrderItem) => (
              <div key={item.id} className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#111915] truncate">{item.product_name}</p>
                  <p className="text-xs text-[#6B7A72]">
                    Ordered: {item.quantity_ordered} · Remaining: {item.remaining}
                  </p>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={item.remaining}
                  value={receivedQtys[item.id] ?? item.remaining}
                  onChange={(e) =>
                    setReceivedQtys((prev) => ({
                      ...prev,
                      [item.id]: Math.min(item.remaining, parseInt(e.target.value) || 0),
                    }))
                  }
                  className="w-20 h-8 text-sm"
                />
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setReceiveOpen(false)}>Cancel</Button>
              <Button
                onClick={handleReceive}
                disabled={receiveMutation.isPending}
                className="bg-[#0B3A2C] hover:bg-[#0B3A2C]/90 text-white gap-2"
              >
                <PackageCheck size={14} /> Confirm Receipt
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
