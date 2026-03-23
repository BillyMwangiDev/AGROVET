import { useState, type ReactNode } from 'react';
import { Search, Plus, CheckCircle, Clock, XCircle, Eye, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAIRecords, useCreateAIRecord, useUpdateAIRecord } from '@/hooks/useAIRecords';
import { useProducts } from '@/hooks/useProducts';
import type { ApiAIRecord } from '@/api/aiRecords';
import { parseDecimal, formatKES } from '@/utils/formatCurrency';

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 mt-5 mb-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-2">{children}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function Field({
  label, required, children,
}: {
  label: string; required?: boolean; children: ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const statusConfig = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700', icon: Clock },
  completed: { label: 'Completed', color: 'bg-yellow-100 text-yellow-700', icon: CheckCircle },
  confirmed_pregnant: { label: 'Pregnant', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const calvingOutcomeLabels: Record<string, string> = {
  bull: 'Bull', heifer: 'Heifer', twin: 'Twin', abortion: 'Abortion',
  unknown: 'Unknown', died: 'Animal Died', slaughtered: 'Slaughtered', sold: 'Sold',
};

const emptyForm = {
  // Farmer
  farmer_name: '', farmer_phone: '', sub_location: '', farm_ai_no: '', amount_charged: '',
  // Animal
  cow_id: '', animal_name: '', cow_breed: '', animal_dob: '',
  // Last calving
  last_calving_date: '', last_calving_outcome: '',
  // 1st insemination
  semen_product: '', insemination_date: '', insemination_time: '', bull_code: '', bull_name: '', technician: '',
  // 2nd insemination
  second_semen_product: '', second_insemination_date: '', second_insemination_time: '',
  second_bull_code: '', second_bull_name: '', second_technician: '',
  // Outcome
  measure: '', notes: '',
};

export default function AIRecords() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ApiAIRecord | null>(null);
  const [viewRecord, setViewRecord] = useState<ApiAIRecord | null>(null);
  const [showSecondAI, setShowSecondAI] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const { data: aiRecords = [], isLoading } = useAIRecords();
  const { data: semenProducts = [] } = useProducts({ is_ai: true });
  const createMutation = useCreateAIRecord();
  const updateMutation = useUpdateAIRecord();

  const set = (key: keyof typeof emptyForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Auto-fill bull code/name when semen product selected
  const onSemenSelect = (productId: string) => {
    const product = semenProducts.find((p) => p.id === productId);
    set('semen_product', productId);
    if (product) {
      set('bull_code', product.sire_code || '');
      set('bull_name', product.name || '');
    }
  };

  const onSecondSemenSelect = (productId: string) => {
    const product = semenProducts.find((p) => p.id === productId);
    set('second_semen_product', productId);
    if (product) {
      set('second_bull_code', product.sire_code || '');
      set('second_bull_name', product.name || '');
    }
  };

  const filteredRecords = aiRecords.filter(
    (r) =>
      r.farmer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cow_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.certificate_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.semen_sire_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.sub_location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: aiRecords.length,
    scheduled: aiRecords.filter((r) => r.status === 'scheduled').length,
    completed: aiRecords.filter((r) => r.status === 'completed').length,
    pregnant: aiRecords.filter((r) => r.status === 'confirmed_pregnant').length,
  };

  const submitRecord = () => {
    if (!form.farmer_name || !form.cow_id || !form.semen_product || !form.insemination_date || !form.technician) {
      toast.error('Please fill in all required fields.');
      return;
    }
    const payload = {
      farmer_name: form.farmer_name,
      farmer_phone: form.farmer_phone,
      sub_location: form.sub_location,
      farm_ai_no: form.farm_ai_no,
      amount_charged: form.amount_charged || null,
      cow_id: form.cow_id,
      animal_name: form.animal_name,
      cow_breed: form.cow_breed,
      animal_dob: form.animal_dob || null,
      last_calving_date: form.last_calving_date || null,
      last_calving_outcome: form.last_calving_outcome,
      semen_product: form.semen_product,
      insemination_date: form.insemination_date,
      insemination_time: form.insemination_time || null,
      bull_code: form.bull_code,
      bull_name: form.bull_name,
      technician: form.technician,
      second_semen_product: showSecondAI && form.second_semen_product ? form.second_semen_product : null,
      second_insemination_date: showSecondAI && form.second_insemination_date ? form.second_insemination_date : null,
      second_insemination_time: showSecondAI && form.second_insemination_time ? form.second_insemination_time : null,
      second_bull_code: showSecondAI ? form.second_bull_code : '',
      second_bull_name: showSecondAI ? form.second_bull_name : '',
      second_technician: showSecondAI ? form.second_technician : '',
      measure: form.measure,
      notes: form.notes,
    };
    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('AI record created successfully');
        setIsAddDialogOpen(false);
        setForm({ ...emptyForm });
        setShowSecondAI(false);
      },
      onError: () => toast.error('Failed to create AI record.'),
    });
  };

  const updateStatus = (id: string, newStatus: ApiAIRecord['status']) => {
    updateMutation.mutate(
      { id, patch: { status: newStatus } },
      {
        onSuccess: () => { toast.success('Status updated'); setSelectedRecord(null); },
        onError: () => toast.error('Failed to update status.'),
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">A.I Records</h1>
          <p className="text-muted-foreground">Nicmah Agro-Vet &amp; A.I Services — Certificate management</p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-brand hover:bg-brand-600 text-white shadow-sm rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" />
          New A.I Certificate
        </Button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Records', value: stats.total, color: 'text-foreground' },
          { label: 'Scheduled', value: stats.scheduled, color: 'text-blue-600' },
          { label: 'Completed', value: stats.completed, color: 'text-yellow-600' },
          { label: 'Confirmed Pregnant', value: stats.pregnant, color: 'text-green-600' },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by cert no, farmer, ear no, sub-location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-50">
                <tr>
                  {['Cert No.', 'Farmer', 'Animal', '1st Insemination', '2nd AI', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading records…</td></tr>
                )}
                {!isLoading && filteredRecords.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No records found.</td></tr>
                )}
                {filteredRecords.map((record) => {
                  const status = statusConfig[record.status];
                  return (
                    <tr key={record.id} className="border-t hover:bg-brand-50/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3 text-muted-foreground" />
                          <span className="font-mono text-xs font-semibold text-brand">{record.certificate_no}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(record.insemination_date).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-foreground">{record.farmer_name}</p>
                        <p className="text-xs text-muted-foreground">{record.farmer_phone}</p>
                        {record.sub_location && (
                          <p className="text-xs text-muted-foreground">{record.sub_location}</p>
                        )}
                      </td>
                      <td className="p-4">
                        <p className="font-medium">{record.cow_id}{record.animal_name ? ` — ${record.animal_name}` : ''}</p>
                        <p className="text-xs text-muted-foreground">{record.cow_breed}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-sm">{record.bull_code || record.semen_sire_code || '—'}</p>
                        <p className="text-xs text-muted-foreground">{record.bull_name || record.semen_product_name}</p>
                        {record.insemination_time && (
                          <p className="text-xs text-muted-foreground">{record.insemination_time}</p>
                        )}
                      </td>
                      <td className="p-4">
                        {record.second_insemination_date ? (
                          <>
                            <p className="text-xs font-medium">{record.second_bull_code || record.second_semen_sire_code || '—'}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(record.second_insemination_date).toLocaleDateString()}
                            </p>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          <status.icon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button onClick={() => setViewRecord(record)} className="text-xs text-muted-foreground hover:text-brand">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => setSelectedRecord(record)} className="text-xs text-brand hover:underline">
                            Update
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

      {/* ── New A.I Certificate Dialog ── */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              New A.I Certificate
            </DialogTitle>
            <p className="text-sm text-muted-foreground">Nicmah Agro-Vet &amp; A.I Services — Certificate will be auto-numbered</p>
          </DialogHeader>

          <div className="space-y-1 mt-2">

            {/* Farmer */}
            <SectionTitle>Farmer Details</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Owner's Name" required>
                <Input value={form.farmer_name} onChange={(e) => set('farmer_name', e.target.value)} placeholder="John Mwangi" />
              </Field>
              <Field label="Phone">
                <Input value={form.farmer_phone} onChange={(e) => set('farmer_phone', e.target.value)} placeholder="0712 345 678" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <Field label="Sub-Location">
                <Input value={form.sub_location} onChange={(e) => set('sub_location', e.target.value)} placeholder="e.g. Naromoru East" />
              </Field>
              <Field label="Farm A.I No.">
                <Input value={form.farm_ai_no} onChange={(e) => set('farm_ai_no', e.target.value)} placeholder="e.g. F-001" />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Service Fee (Kshs)">
                <Input type="number" min="0" value={form.amount_charged} onChange={(e) => set('amount_charged', e.target.value)} placeholder="e.g. 1500" />
              </Field>
            </div>

            {/* Animal */}
            <SectionTitle>Animal Details</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Ear No." required>
                <Input value={form.cow_id} onChange={(e) => set('cow_id', e.target.value)} placeholder="e.g. TZ-0042" />
              </Field>
              <Field label="Animal Name">
                <Input value={form.animal_name} onChange={(e) => set('animal_name', e.target.value)} placeholder="e.g. Daisy" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <Field label="Breed">
                <Input value={form.cow_breed} onChange={(e) => set('cow_breed', e.target.value)} placeholder="e.g. Friesian" />
              </Field>
              <Field label="Date of Birth">
                <Input type="date" value={form.animal_dob} onChange={(e) => set('animal_dob', e.target.value)} />
              </Field>
            </div>

            {/* Last Calving */}
            <SectionTitle>Last Calving</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Last Calving Date">
                <Input type="date" value={form.last_calving_date} onChange={(e) => set('last_calving_date', e.target.value)} />
              </Field>
              <Field label="Calving Outcome">
                <select
                  value={form.last_calving_outcome}
                  onChange={(e) => set('last_calving_outcome', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">— select —</option>
                  {Object.entries(calvingOutcomeLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* 1st Insemination */}
            <SectionTitle>Insemination 1</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date" required>
                <Input type="date" value={form.insemination_date} onChange={(e) => set('insemination_date', e.target.value)} />
              </Field>
              <Field label="Time">
                <Input type="time" value={form.insemination_time} onChange={(e) => set('insemination_time', e.target.value)} />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Semen / Bull" required>
                <select
                  value={form.semen_product}
                  onChange={(e) => onSemenSelect(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Select semen product...</option>
                  {semenProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sire_code ? `${p.sire_code} — ` : ''}{p.breed || p.name} ({formatKES(parseDecimal(p.price))})
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <Field label="Bull Code">
                <Input value={form.bull_code} onChange={(e) => set('bull_code', e.target.value)} placeholder="Auto-filled from product" />
              </Field>
              <Field label="Bull Name">
                <Input value={form.bull_name} onChange={(e) => set('bull_name', e.target.value)} placeholder="Auto-filled from product" />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Technician" required>
                <Input value={form.technician} onChange={(e) => set('technician', e.target.value)} placeholder="e.g. Dr. Kimani" />
              </Field>
            </div>

            {/* 2nd Insemination toggle */}
            <SectionTitle>Insemination 2 (Optional)</SectionTitle>
            {!showSecondAI ? (
              <button
                type="button"
                onClick={() => setShowSecondAI(true)}
                className="text-sm text-brand hover:underline"
              >
                + Add second insemination
              </button>
            ) : (
              <div className="space-y-3 border border-border rounded-xl p-4 bg-muted/30">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Date">
                    <Input type="date" value={form.second_insemination_date} onChange={(e) => set('second_insemination_date', e.target.value)} />
                  </Field>
                  <Field label="Time">
                    <Input type="time" value={form.second_insemination_time} onChange={(e) => set('second_insemination_time', e.target.value)} />
                  </Field>
                </div>
                <Field label="Semen / Bull">
                  <select
                    value={form.second_semen_product}
                    onChange={(e) => onSecondSemenSelect(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="">Select semen product...</option>
                    {semenProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sire_code ? `${p.sire_code} — ` : ''}{p.breed || p.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Bull Code">
                    <Input value={form.second_bull_code} onChange={(e) => set('second_bull_code', e.target.value)} />
                  </Field>
                  <Field label="Bull Name">
                    <Input value={form.second_bull_name} onChange={(e) => set('second_bull_name', e.target.value)} />
                  </Field>
                </div>
                <Field label="Technician">
                  <Input value={form.second_technician} onChange={(e) => set('second_technician', e.target.value)} placeholder="e.g. Dr. Kimani" />
                </Field>
                <button
                  type="button"
                  onClick={() => { setShowSecondAI(false); }}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove second insemination
                </button>
              </div>
            )}

            {/* Notes & Measure */}
            <SectionTitle>Notes &amp; Measurements</SectionTitle>
            <Field label="Measure / Observations">
              <textarea
                value={form.measure}
                onChange={(e) => set('measure', e.target.value)}
                placeholder="Body condition score, milk production, heat signs..."
                className="w-full min-h-[70px] px-3 py-2 rounded-md border border-input bg-background text-sm"
              />
            </Field>
            <div className="mt-3">
              <Field label="Additional Notes">
                <textarea
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  placeholder="Any other observations..."
                  className="w-full min-h-[60px] px-3 py-2 rounded-md border border-input bg-background text-sm"
                />
              </Field>
            </div>

            <Button
              onClick={submitRecord}
              disabled={createMutation.isPending}
              className="w-full mt-4 bg-brand hover:bg-brand-600 text-white h-12 font-semibold disabled:opacity-50"
            >
              {createMutation.isPending ? 'Saving…' : 'Create A.I Certificate'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── View Certificate Dialog ── */}
      <Dialog open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-bold text-foreground">A.I Certificate</DialogTitle>
          </DialogHeader>
          {viewRecord && (
            <div className="mt-2 space-y-4 text-sm">
              {/* Header block */}
              <div className="border rounded-xl p-4 bg-brand-50 space-y-1">
                <div className="flex justify-between">
                  <span className="font-mono font-bold text-brand text-base">{viewRecord.certificate_no}</span>
                  <span className="text-muted-foreground">{new Date(viewRecord.insemination_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {(() => { const s = statusConfig[viewRecord.status]; return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
                      <s.icon className="w-3 h-3" />{s.label}
                    </span>
                  ); })()}
                  {viewRecord.amount_charged && (
                    <span className="text-xs text-muted-foreground">Fee: {formatKES(parseDecimal(viewRecord.amount_charged))}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <div><p className="text-xs text-muted-foreground">Owner's Name</p><p className="font-medium">{viewRecord.farmer_name}</p></div>
                <div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium">{viewRecord.farmer_phone || '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Sub-Location</p><p className="font-medium">{viewRecord.sub_location || '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Farm A.I No.</p><p className="font-medium">{viewRecord.farm_ai_no || '—'}</p></div>
              </div>

              <hr />
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <div><p className="text-xs text-muted-foreground">Ear No.</p><p className="font-medium">{viewRecord.cow_id}</p></div>
                <div><p className="text-xs text-muted-foreground">Animal Name</p><p className="font-medium">{viewRecord.animal_name || '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Breed</p><p className="font-medium">{viewRecord.cow_breed}</p></div>
                <div><p className="text-xs text-muted-foreground">Born</p><p className="font-medium">{viewRecord.animal_dob ? new Date(viewRecord.animal_dob).toLocaleDateString() : '—'}</p></div>
              </div>

              {(viewRecord.last_calving_date || viewRecord.last_calving_outcome) && (
                <>
                  <hr />
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    <div><p className="text-xs text-muted-foreground">Last Calving Date</p><p className="font-medium">{viewRecord.last_calving_date ? new Date(viewRecord.last_calving_date).toLocaleDateString() : '—'}</p></div>
                    <div><p className="text-xs text-muted-foreground">Outcome</p><p className="font-medium">{calvingOutcomeLabels[viewRecord.last_calving_outcome] || '—'}</p></div>
                  </div>
                </>
              )}

              <hr />
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Insemination 1</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <div><p className="text-xs text-muted-foreground">Date</p><p className="font-medium">{new Date(viewRecord.insemination_date).toLocaleDateString()}</p></div>
                <div><p className="text-xs text-muted-foreground">Time</p><p className="font-medium">{viewRecord.insemination_time || '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Bull Code</p><p className="font-medium">{viewRecord.bull_code || viewRecord.semen_sire_code || '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Bull Name</p><p className="font-medium">{viewRecord.bull_name || viewRecord.semen_product_name}</p></div>
                <div><p className="text-xs text-muted-foreground">Technician</p><p className="font-medium">{viewRecord.technician}</p></div>
              </div>

              {viewRecord.second_insemination_date && (
                <>
                  <hr />
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Insemination 2</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    <div><p className="text-xs text-muted-foreground">Date</p><p className="font-medium">{new Date(viewRecord.second_insemination_date).toLocaleDateString()}</p></div>
                    <div><p className="text-xs text-muted-foreground">Time</p><p className="font-medium">{viewRecord.second_insemination_time || '—'}</p></div>
                    <div><p className="text-xs text-muted-foreground">Bull Code</p><p className="font-medium">{viewRecord.second_bull_code || viewRecord.second_semen_sire_code || '—'}</p></div>
                    <div><p className="text-xs text-muted-foreground">Bull Name</p><p className="font-medium">{viewRecord.second_bull_name || viewRecord.second_semen_product_name || '—'}</p></div>
                    <div><p className="text-xs text-muted-foreground">Technician</p><p className="font-medium">{viewRecord.second_technician || '—'}</p></div>
                  </div>
                </>
              )}

              {viewRecord.measure && (
                <>
                  <hr />
                  <div><p className="text-xs text-muted-foreground">Measure / Observations</p><p className="mt-1 whitespace-pre-wrap">{viewRecord.measure}</p></div>
                </>
              )}
              {viewRecord.notes && (
                <div><p className="text-xs text-muted-foreground">Notes</p><p className="mt-1 whitespace-pre-wrap">{viewRecord.notes}</p></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Update Status Dialog ── */}
      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">Update Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-muted/40 p-4 rounded-xl space-y-1 text-sm">
              <p className="font-semibold">{selectedRecord?.certificate_no}</p>
              <p className="text-muted-foreground">Farmer: {selectedRecord?.farmer_name}</p>
              <p className="text-muted-foreground">Ear No.: {selectedRecord?.cow_id}</p>
              <p className="text-muted-foreground">
                Current: <span className="font-medium">{statusConfig[selectedRecord?.status || 'scheduled'].label}</span>
              </p>
            </div>
            <p className="font-medium text-foreground">Update to:</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(statusConfig).map(([status, config]) => (
                <button
                  key={status}
                  onClick={() => updateStatus(selectedRecord?.id || '', status as ApiAIRecord['status'])}
                  className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-colors ${
                    selectedRecord?.status === status
                      ? 'border-brand bg-brand-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <config.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{config.label}</span>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
