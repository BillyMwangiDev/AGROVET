import { useState } from "react";
import { Search, Plus, Edit2, Star, Building2, Phone, Mail, MapPin, X, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from "@/hooks/useSuppliers";
import type { Supplier } from "@/types";

type SupplierForm = {
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  tax_id: string;
  payment_terms: string;
  credit_limit: string;
  rating: number;
  notes: string;
  is_active: boolean;
};

const defaultForm = (): SupplierForm => ({
  name: "",
  contact_person: "",
  email: "",
  phone: "",
  address: "",
  tax_id: "",
  payment_terms: "",
  credit_limit: "0",
  rating: 0,
  notes: "",
  is_active: true,
});

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={16}
          className={`${n <= value ? "fill-[#E4B83A] text-[#E4B83A]" : "text-gray-300"} ${onChange ? "cursor-pointer" : ""}`}
          onClick={() => onChange?.(n)}
        />
      ))}
    </div>
  );
}

export default function SupplierManagement() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierForm>(defaultForm());

  const { data: suppliers = [], isLoading } = useSuppliers();
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const deleteMutation = useDeleteSupplier();

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.contact_person.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search)
  );

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm());
    setDialogOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({
      name: s.name,
      contact_person: s.contact_person,
      email: s.email,
      phone: s.phone,
      address: s.address,
      tax_id: s.tax_id,
      payment_terms: s.payment_terms,
      credit_limit: s.credit_limit,
      rating: s.rating,
      notes: s.notes,
      is_active: s.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Supplier name is required.");
      return;
    }
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: form });
        toast.success("Supplier updated.");
      } else {
        await createMutation.mutateAsync(form);
        toast.success("Supplier created.");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save supplier.");
    }
  };

  const handleDeactivate = async (s: Supplier) => {
    try {
      await deleteMutation.mutateAsync(s.id);
      toast.success(`${s.name} deactivated.`);
    } catch {
      toast.error("Failed to deactivate supplier.");
    }
  };

  const activeCount = suppliers.filter((s) => s.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#111915]">Suppliers</h2>
          <p className="text-sm text-[#6B7A72]">{activeCount} active supplier{activeCount !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={openCreate} className="bg-[#0B3A2C] hover:bg-[#0B3A2C]/90 text-white gap-2">
          <Plus size={16} />
          Add Supplier
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7A72]" />
        <Input
          placeholder="Search suppliers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Supplier Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#6B7A72]">
          <Building2 size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No suppliers found</p>
          <p className="text-sm">Add your first supplier to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <Card
              key={s.id}
              className={`border transition-shadow hover:shadow-md ${!s.is_active ? "opacity-60" : ""}`}
            >
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold text-[#111915] truncate">{s.name}</CardTitle>
                    {s.contact_person && (
                      <p className="text-xs text-[#6B7A72] mt-0.5">{s.contact_person}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!s.is_active && <Badge variant="secondary">Inactive</Badge>}
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(s)}>
                      <Edit2 size={13} />
                    </Button>
                  </div>
                </div>
                <StarRating value={s.rating} />
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-1.5">
                {s.phone && (
                  <div className="flex items-center gap-2 text-sm text-[#111915]">
                    <Phone size={13} className="text-[#6B7A72] flex-shrink-0" />
                    <span>{s.phone}</span>
                  </div>
                )}
                {s.email && (
                  <div className="flex items-center gap-2 text-sm text-[#111915]">
                    <Mail size={13} className="text-[#6B7A72] flex-shrink-0" />
                    <span className="truncate">{s.email}</span>
                  </div>
                )}
                {s.address && (
                  <div className="flex items-center gap-2 text-sm text-[#6B7A72]">
                    <MapPin size={13} className="flex-shrink-0" />
                    <span className="truncate">{s.address}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-[#6B7A72]">
                    {s.product_count} product{s.product_count !== 1 ? "s" : ""}
                    {s.payment_terms ? ` · ${s.payment_terms}` : ""}
                  </span>
                  {parseFloat(s.credit_limit) > 0 && (
                    <span className="text-xs font-medium text-[#0B3A2C]">
                      KES {parseFloat(s.credit_limit).toLocaleString()} limit
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Supplier Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Unga Group Ltd"
                />
              </div>
              <div>
                <Label>Contact Person</Label>
                <Input
                  value={form.contact_person}
                  onChange={(e) => setForm((f) => ({ ...f, contact_person: e.target.value }))}
                  placeholder="Name"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+254..."
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="supplier@example.com"
                />
              </div>
              <div>
                <Label>Tax ID / KRA PIN</Label>
                <Input
                  value={form.tax_id}
                  onChange={(e) => setForm((f) => ({ ...f, tax_id: e.target.value }))}
                  placeholder="A001234567B"
                />
              </div>
              <div>
                <Label>Payment Terms</Label>
                <Input
                  value={form.payment_terms}
                  onChange={(e) => setForm((f) => ({ ...f, payment_terms: e.target.value }))}
                  placeholder="Net 30"
                />
              </div>
              <div>
                <Label>Credit Limit (KES)</Label>
                <Input
                  type="number"
                  value={form.credit_limit}
                  onChange={(e) => setForm((f) => ({ ...f, credit_limit: e.target.value }))}
                  placeholder="0"
                  min={0}
                />
              </div>
              <div className="col-span-2">
                <Label>Address</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="Physical address"
                />
              </div>
              <div className="col-span-2">
                <Label>Rating</Label>
                <div className="mt-1">
                  <StarRating value={form.rating} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} />
                </div>
              </div>
              <div className="col-span-2">
                <Label>Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-between gap-3 pt-2">
              {editing && (
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => {
                    handleDeactivate(editing);
                    setDialogOpen(false);
                  }}
                >
                  <X size={14} className="mr-1" /> Deactivate
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleSave}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-[#0B3A2C] hover:bg-[#0B3A2C]/90 text-white gap-2"
                >
                  <Save size={14} />
                  {editing ? "Save Changes" : "Create Supplier"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
