import { useState } from 'react';
import { FileText, Plus, Download, Mail, Trash2, ChevronDown, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  useDocuments,
  useCreateDocument,
  useUpdateDocument,
  useDeleteDocument,
  useDownloadDocumentPDF,
  useEmailDocument,
} from '@/hooks/useDocuments';
import { useInventory } from '@/hooks/useProducts';
import type {
  BizDocument,
  DocumentType,
  DocumentStatus,
  CreateDocumentItemPayload,
} from '@/types';
import { parseDecimal } from '@/utils/formatCurrency';

// ── helpers ──────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<DocumentStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-orange-100 text-orange-700',
};

const TYPE_BADGE: Record<DocumentType, string> = {
  quotation: 'bg-purple-100 text-purple-700',
  invoice: 'bg-teal-100 text-teal-700',
};

function formatKES(val: string | number) {
  const n = typeof val === 'string' ? parseDecimal(val) : val;
  return `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── empty line item ───────────────────────────────────────────────────────────

interface LineItem extends CreateDocumentItemPayload {
  _key: number;
  product_name?: string;
}

let _key = 0;
function emptyLine(): LineItem {
  return { _key: ++_key, description: '', quantity: 1, unit_price: 0 };
}

// ── sub-component: line items editor ─────────────────────────────────────────

interface LineEditorProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
}

function LineEditor({ items, onChange }: LineEditorProps) {
  const { data: inventory = [] } = useInventory();

  function setItem(key: number, patch: Partial<LineItem>) {
    onChange(items.map(i => i._key === key ? { ...i, ...patch } : i));
  }

  function remove(key: number) {
    onChange(items.filter(i => i._key !== key));
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 text-xs font-medium text-gray-500 px-1">
        <span>Description / Product</span>
        <span>Qty</span>
        <span>Unit Price (KES)</span>
        <span />
      </div>
      {items.map(item => (
        <div key={item._key} className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 items-center">
          {/* Description with optional product picker */}
          <div className="relative">
            <Input
              value={item.description}
              onChange={e => setItem(item._key, { description: e.target.value, product_id: undefined })}
              placeholder="Item description"
              className="h-8 text-sm"
              list={`prod-list-${item._key}`}
            />
            <datalist id={`prod-list-${item._key}`}>
              {inventory.map(p => (
                <option key={p.id} value={p.name} />
              ))}
            </datalist>
          </div>
          <Input
            type="number"
            min={1}
            value={item.quantity}
            onChange={e => setItem(item._key, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
            className="h-8 text-sm"
          />
          <Input
            type="number"
            min={0}
            step={0.01}
            value={item.unit_price}
            onChange={e => setItem(item._key, { unit_price: parseFloat(e.target.value) || 0 })}
            className="h-8 text-sm"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
            onClick={() => remove(item._key)}
            type="button"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="w-full h-8 text-xs border-dashed"
        onClick={() => onChange([...items, emptyLine()])}
        type="button"
      >
        <Plus className="w-3 h-3 mr-1" /> Add Line
      </Button>
      {items.length > 0 && (
        <div className="text-right text-sm font-medium text-gray-700 pr-10">
          Subtotal: {formatKES(items.reduce((s, i) => s + i.unit_price * i.quantity, 0))}
        </div>
      )}
    </div>
  );
}

// ── create dialog ─────────────────────────────────────────────────────────────

interface CreateDialogProps {
  docType: DocumentType;
  open: boolean;
  onClose: () => void;
}

function CreateDialog({ docType, open, onClose }: CreateDialogProps) {
  const createMutation = useCreateDocument();
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [validityDays, setValidityDays] = useState(30);
  const [dueDate, setDueDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLine()]);

  function reset() {
    setCustomerName(''); setCustomerEmail(''); setCustomerPhone(''); setCustomerAddress('');
    setValidityDays(30); setDueDate(''); setPaymentTerms(''); setDiscount(0);
    setNotes(''); setTerms(''); setLineItems([emptyLine()]);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit() {
    if (!customerName.trim()) {
      toast.error('Customer name is required.');
      return;
    }
    const validLines = lineItems.filter(l => l.description.trim() && l.unit_price > 0);
    if (validLines.length === 0) {
      toast.error('Add at least one valid line item.');
      return;
    }

    const payload = {
      document_type: docType,
      customer_name: customerName.trim(),
      customer_email: customerEmail,
      customer_phone: customerPhone,
      customer_address: customerAddress,
      ...(docType === 'quotation' ? { validity_days: validityDays } : {}),
      ...(docType === 'invoice' && dueDate ? { due_date: dueDate } : {}),
      payment_terms: paymentTerms,
      discount_amount: discount,
      notes,
      terms_conditions: terms,
      items: validLines.map(l => ({
        description: l.description,
        quantity: l.quantity,
        unit_price: l.unit_price,
        ...(l.product_id ? { product_id: l.product_id } : {}),
      })),
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success(`${docType === 'quotation' ? 'Quotation' : 'Invoice'} created.`);
        handleClose();
      },
      onError: () => toast.error('Failed to create document.'),
    });
  }

  const title = docType === 'quotation' ? 'New Quotation' : 'New Invoice';

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-brand">
            <FileText className="w-5 h-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Customer */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Customer</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Name *</Label>
                <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer name" className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Phone</Label>
                <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="07XX XXX XXX" className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="email@example.com" className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Address</Label>
                <Input value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Address (optional)" className="h-9" />
              </div>
            </div>
          </div>

          {/* Doc-specific */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {docType === 'quotation' ? 'Quotation Details' : 'Invoice Details'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {docType === 'quotation' ? (
                <div className="space-y-1">
                  <Label className="text-xs">Valid for (days)</Label>
                  <Input type="number" min={1} value={validityDays} onChange={e => setValidityDays(parseInt(e.target.value) || 30)} className="h-9" />
                </div>
              ) : (
                <div className="space-y-1">
                  <Label className="text-xs">Due Date</Label>
                  <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="h-9" />
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs">Payment Terms</Label>
                <Input value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} placeholder="e.g. Net 30" className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Discount (KES)</Label>
                <Input type="number" min={0} step={0.01} value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} className="h-9" />
              </div>
            </div>
          </div>

          {/* Line items */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Line Items</p>
            <LineEditor items={lineItems} onChange={setLineItems} />
          </div>

          {/* Notes & Terms */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Additional notes..." className="text-sm resize-none" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Terms & Conditions</Label>
              <Textarea value={terms} onChange={e => setTerms(e.target.value)} rows={3} placeholder="Terms..." className="text-sm resize-none" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} disabled={createMutation.isPending}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="bg-brand text-white hover:bg-brand-600 shadow-sm rounded-xl"
            >
              {createMutation.isPending ? 'Creating...' : `Create ${docType === 'quotation' ? 'Quotation' : 'Invoice'}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── view / status dialog ──────────────────────────────────────────────────────

interface ViewDialogProps {
  doc: BizDocument | null;
  onClose: () => void;
}

function ViewDialog({ doc, onClose }: ViewDialogProps) {
  const updateMutation = useUpdateDocument();
  const downloadMutation = useDownloadDocumentPDF();
  const emailMutation = useEmailDocument();
  const [emailInput, setEmailInput] = useState('');
  const [newStatus, setNewStatus] = useState<DocumentStatus | ''>('');

  if (!doc) return null;

  function handleStatusUpdate() {
    if (!newStatus || newStatus === doc!.status) return;
    updateMutation.mutate(
      { id: doc!.id, patch: { status: newStatus as DocumentStatus } },
      {
        onSuccess: () => { toast.success('Status updated.'); onClose(); },
        onError: () => toast.error('Failed to update status.'),
      }
    );
  }

  function handleDownload() {
    downloadMutation.mutate(
      { id: doc!.id, filename: `${doc!.document_number}.pdf` },
      { onError: () => toast.error('Failed to download PDF.') }
    );
  }

  function handleEmail() {
    emailMutation.mutate(
      { id: doc!.id, email: emailInput || doc!.customer_email || undefined },
      {
        onSuccess: (res) => { toast.success(res.message); },
        onError: () => toast.error('Failed to send email.'),
      }
    );
  }

  return (
    <Dialog open={!!doc} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-brand">{doc.document_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-y-1 bg-gray-50 rounded-lg p-3">
            <span className="text-gray-500">Type</span>
            <span className="font-medium capitalize">{doc.document_type_display}</span>
            <span className="text-gray-500">Status</span>
            <span><Badge className={STATUS_BADGE[doc.status]}>{doc.status_display}</Badge></span>
            <span className="text-gray-500">Customer</span>
            <span className="font-medium">{doc.customer_name}</span>
            {doc.customer_email && <><span className="text-gray-500">Email</span><span>{doc.customer_email}</span></>}
            {doc.customer_phone && <><span className="text-gray-500">Phone</span><span>{doc.customer_phone}</span></>}
            <span className="text-gray-500">Date</span>
            <span>{new Date(doc.issue_date).toLocaleDateString('en-KE')}</span>
            {doc.valid_until && <><span className="text-gray-500">Valid Until</span><span>{new Date(doc.valid_until).toLocaleDateString('en-KE')}</span></>}
            {doc.due_date && <><span className="text-gray-500">Due Date</span><span>{new Date(doc.due_date).toLocaleDateString('en-KE')}</span></>}
            <span className="text-gray-500 font-medium">Total</span>
            <span className="font-bold font-mono text-brand">{formatKES(doc.total_amount)}</span>
          </div>

          {/* Items */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Items</p>
            <div className="space-y-1">
              {doc.items.map(item => (
                <div key={item.id} className="flex justify-between text-xs bg-gray-50 rounded px-2 py-1">
                  <span>{item.description} × {item.quantity}</span>
                  <span className="font-medium">{formatKES(item.total_price)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs mt-1 px-2 text-gray-500">
              <span>Tax (16% VAT)</span><span>{formatKES(doc.tax_amount)}</span>
            </div>
            {parseDecimal(doc.discount_amount) > 0 && (
              <div className="flex justify-between text-xs px-2 text-gray-500">
                <span>Discount</span><span>- {formatKES(doc.discount_amount)}</span>
              </div>
            )}
          </div>

          {/* Status update */}
          <div className="space-y-1">
            <Label className="text-xs">Update Status</Label>
            <div className="flex gap-2">
              <Select value={newStatus} onValueChange={v => setNewStatus(v as DocumentStatus)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  {(['draft', 'sent', 'approved', 'rejected', 'cancelled'] as DocumentStatus[]).map(s => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={handleStatusUpdate} disabled={!newStatus || updateMutation.isPending} className="h-8 text-xs">
                Save
              </Button>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <Label className="text-xs">Send by Email</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder={doc.customer_email || 'Enter email...'}
                className="h-8 text-xs"
              />
              <Button size="sm" variant="outline" onClick={handleEmail} disabled={emailMutation.isPending} className="h-8 text-xs gap-1">
                <Mail className="w-3 h-3" /> {emailMutation.isPending ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-1">
            <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">Close</Button>
            <Button
              size="sm"
              onClick={handleDownload}
              disabled={downloadMutation.isPending}
              className="h-8 text-xs gap-1 bg-brand text-white hover:bg-brand-600 rounded-xl"
            >
              <Download className="w-3 h-3" />
              {downloadMutation.isPending ? 'Downloading...' : 'Download PDF'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── main component ────────────────────────────────────────────────────────────

type FilterTab = 'all' | DocumentType | DocumentStatus;

export default function DocumentsManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [createType, setCreateType] = useState<DocumentType | null>(null);
  const [viewDoc, setViewDoc] = useState<BizDocument | null>(null);

  const deleteMutation = useDeleteDocument();
  const downloadMutation = useDownloadDocumentPDF();

  const typeFilter = activeTab === 'quotation' || activeTab === 'invoice' ? activeTab : undefined;
  const statusFilter = ['draft', 'sent', 'approved', 'rejected', 'cancelled'].includes(activeTab) ? activeTab as DocumentStatus : undefined;

  const { data: docs = [], isLoading } = useDocuments({
    type: typeFilter,
    status: statusFilter,
    search: searchQuery.trim() || undefined,
  });

  const stats = {
    total: docs.length,
    quotations: docs.filter(d => d.document_type === 'quotation').length,
    invoices: docs.filter(d => d.document_type === 'invoice').length,
    draft: docs.filter(d => d.status === 'draft').length,
    approved: docs.filter(d => d.status === 'approved').length,
  };

  function handleDelete(doc: BizDocument) {
    if (!confirm(`Delete ${doc.document_number}?`)) return;
    deleteMutation.mutate(doc.id, {
      onSuccess: () => toast.success('Document deleted.'),
      onError: () => toast.error('Failed to delete.'),
    });
  }

  function handleDownload(doc: BizDocument) {
    downloadMutation.mutate(
      { id: doc.id, filename: `${doc.document_number}.pdf` },
      { onError: () => toast.error('Failed to download PDF.') }
    );
  }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'quotation', label: 'Quotations' },
    { key: 'invoice', label: 'Invoices' },
    { key: 'draft', label: 'Draft' },
    { key: 'sent', label: 'Sent' },
    { key: 'approved', label: 'Approved' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand">Documents</h1>
          <p className="text-sm text-gray-500 mt-0.5">Quotations and invoices for customers</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50"
            onClick={() => setCreateType('quotation')}
          >
            <Plus className="w-4 h-4" /> Quotation
          </Button>
          <Button
            size="sm"
            className="h-9 gap-1.5 bg-brand text-white hover:bg-brand-600 shadow-sm rounded-xl"
            onClick={() => setCreateType('invoice')}
          >
            <Plus className="w-4 h-4" /> Invoice
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-800' },
          { label: 'Quotations', value: stats.quotations, color: 'text-purple-700' },
          { label: 'Invoices', value: stats.invoices, color: 'text-teal-700' },
          { label: 'Draft', value: stats.draft, color: 'text-gray-600' },
          { label: 'Approved', value: stats.approved, color: 'text-green-700' },
        ].map(stat => (
          <Card key={stat.label} className="p-4 shadow-sm">
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4 shadow-sm">
        <div className="flex flex-wrap gap-2 mb-3">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab.key
                ? 'bg-brand text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-8 h-8 text-sm"
            placeholder="Search by number or customer..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading documents...</div>
        ) : docs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No documents found.</p>
            <p className="text-gray-400 text-xs mt-1">Create a quotation or invoice to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brand-50 border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Document #</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                  <th className="py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {docs.map(doc => (
                  <tr key={doc.id} className="hover:bg-brand-50/30 transition-colors">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setViewDoc(doc)}
                        className="font-mono text-xs text-brand hover:underline font-medium"
                      >
                        {doc.document_number}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={`text-xs ${TYPE_BADGE[doc.document_type]}`}>
                        {doc.document_type_display}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{doc.customer_name}</div>
                      {doc.customer_phone && <div className="text-xs text-gray-400">{doc.customer_phone}</div>}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold font-mono text-gray-800">
                      {formatKES(doc.total_amount)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={`text-xs ${STATUS_BADGE[doc.status]}`}>
                        {doc.status_display}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {new Date(doc.created_at).toLocaleDateString('en-KE')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-500 hover:text-brand hover:bg-brand-50"
                          title="Download PDF"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                          title="View & Manage"
                          onClick={() => setViewDoc(doc)}
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
                          title="Delete"
                          onClick={() => handleDelete(doc)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Dialogs */}
      {createType && (
        <CreateDialog
          docType={createType}
          open={!!createType}
          onClose={() => setCreateType(null)}
        />
      )}
      <ViewDialog doc={viewDoc} onClose={() => setViewDoc(null)} />
    </div>
  );
}
