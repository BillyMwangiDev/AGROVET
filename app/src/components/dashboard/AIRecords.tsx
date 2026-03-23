import { useState } from 'react';
import { Search, Plus, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAIRecords, useCreateAIRecord, useUpdateAIRecord } from '@/hooks/useAIRecords';
import { useProducts } from '@/hooks/useProducts';
import type { ApiAIRecord } from '@/api/aiRecords';
import { parseDecimal } from '@/utils/formatCurrency';

const statusConfig = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700', icon: Clock },
  completed: { label: 'Completed', color: 'bg-yellow-100 text-yellow-700', icon: CheckCircle },
  confirmed_pregnant: { label: 'Pregnant', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function AIRecords() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ApiAIRecord | null>(null);

  const { data: aiRecords = [], isLoading } = useAIRecords();
  const { data: semenProducts = [] } = useProducts({ is_ai: true });
  const createRecordMutation = useCreateAIRecord();
  const updateRecordMutation = useUpdateAIRecord();

  const [newRecord, setNewRecord] = useState({
    farmer_name: '',
    farmer_phone: '',
    cow_id: '',
    cow_breed: '',
    semen_product: '',
    insemination_date: '',
    technician: '',
    notes: '',
  });

  const filteredRecords = aiRecords.filter(
    (record) =>
      record.farmer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.cow_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (record.semen_sire_code || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: aiRecords.length,
    scheduled: aiRecords.filter((r) => r.status === 'scheduled').length,
    completed: aiRecords.filter((r) => r.status === 'completed').length,
    pregnant: aiRecords.filter((r) => r.status === 'confirmed_pregnant').length,
  };

  const addRecord = () => {
    if (!newRecord.farmer_name || !newRecord.cow_id || !newRecord.semen_product || !newRecord.insemination_date) {
      toast.error('Please fill in all required fields.');
      return;
    }
    createRecordMutation.mutate(newRecord, {
      onSuccess: () => {
        toast.success('AI record added successfully');
        setIsAddDialogOpen(false);
        setNewRecord({ farmer_name: '', farmer_phone: '', cow_id: '', cow_breed: '', semen_product: '', insemination_date: '', technician: '', notes: '' });
      },
      onError: () => toast.error('Failed to add AI record.'),
    });
  };

  const updateStatus = (id: string, newStatus: ApiAIRecord['status']) => {
    updateRecordMutation.mutate(
      { id, patch: { status: newStatus } },
      {
        onSuccess: () => { toast.success('Status updated'); setSelectedRecord(null); },
        onError: () => toast.error('Failed to update status.'),
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Records</h1>
          <p className="text-muted-foreground">Track artificial insemination services</p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-brand hover:bg-brand-600 text-white shadow-sm rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" />
          Book AI Service
        </Button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Records</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Scheduled</p>
            <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.completed}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Confirmed Pregnant</p>
            <p className="text-2xl font-bold text-green-600">{stats.pregnant}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by farmer, cow ID, or sire code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Records Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-50">
                <tr>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">ID</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Farmer</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cow</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Semen</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Technician</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Loading records…</td></tr>
                )}
                {filteredRecords.map((record) => {
                  const status = statusConfig[record.status];
                  return (
                    <tr key={record.id} className="border-t hover:bg-brand-50/30 transition-colors">
                      <td className="p-4 font-medium text-xs text-muted-foreground">{record.id.slice(0, 8)}…</td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-foreground">{record.farmer_name}</p>
                          <p className="text-xs text-muted-foreground">{record.farmer_phone}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{record.cow_id}</p>
                          <p className="text-xs text-muted-foreground">{record.cow_breed}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{record.semen_sire_code || '—'}</p>
                          <p className="text-xs text-muted-foreground">{record.semen_product_name}</p>
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        {new Date(record.insemination_date).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-sm">{record.technician}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          <status.icon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => setSelectedRecord(record)}
                          className="text-sm text-brand hover:underline"
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Record Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              Book AI Service
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Farmer Name</label>
                <Input
                  value={newRecord.farmer_name}
                  onChange={(e) => setNewRecord({ ...newRecord, farmer_name: e.target.value })}
                  placeholder="John Mwangi"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Phone</label>
                <Input
                  value={newRecord.farmer_phone}
                  onChange={(e) => setNewRecord({ ...newRecord, farmer_phone: e.target.value })}
                  placeholder="+254..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Cow ID</label>
                <Input
                  value={newRecord.cow_id}
                  onChange={(e) => setNewRecord({ ...newRecord, cow_id: e.target.value })}
                  placeholder="COW-001"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Breed</label>
                <Input
                  value={newRecord.cow_breed}
                  onChange={(e) => setNewRecord({ ...newRecord, cow_breed: e.target.value })}
                  placeholder="Friesian"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Semen Product</label>
              <select
                value={newRecord.semen_product}
                onChange={(e) => setNewRecord({ ...newRecord, semen_product: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-input"
              >
                <option value="">Select semen...</option>
                {semenProducts.map((semen) => (
                  <option key={semen.id} value={semen.id}>
                    {semen.sire_code ? `${semen.sire_code} - ` : ''}{semen.breed || semen.name} (KES {parseDecimal(semen.price).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Insemination Date</label>
              <Input
                type="date"
                value={newRecord.insemination_date}
                onChange={(e) => setNewRecord({ ...newRecord, insemination_date: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Technician</label>
              <Input
                value={newRecord.technician}
                onChange={(e) => setNewRecord({ ...newRecord, technician: e.target.value })}
                placeholder="Dr. Kimani"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Notes</label>
              <textarea
                value={newRecord.notes}
                onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                placeholder="Any additional notes..."
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input"
              />
            </div>

            <Button
              onClick={addRecord}
              disabled={createRecordMutation.isPending}
              className="w-full bg-brand hover:bg-brand-600 text-white h-12 font-semibold disabled:opacity-50"
            >
              {createRecordMutation.isPending ? 'Booking…' : 'Book Service'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              Update Status
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="bg-background p-4 rounded-xl">
              <p className="text-sm text-muted-foreground">Farmer: {selectedRecord?.farmer_name}</p>
              <p className="text-sm text-muted-foreground">Cow: {selectedRecord?.cow_id}</p>
              <p className="text-sm text-muted-foreground">Current Status: {statusConfig[selectedRecord?.status || 'scheduled'].label}</p>
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
