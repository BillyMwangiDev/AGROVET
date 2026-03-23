import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, UserCheck, UserX, Pencil, Shield, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  getStaffList,
  createStaff,
  updateStaff,
  deactivateStaff,
  getStoreConfig,
  type CreateStaffPayload,
  type UpdateStaffPayload,
} from '@/api/auth';
import type { User, UserRole } from '@/types';
import { useAuthContext } from '@/contexts/AuthContext';

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  cashier: 'Cashier',
  customer: 'Customer',
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-700 border border-red-200',
  manager: 'bg-blue-100 text-blue-700 border border-blue-200',
  cashier: 'bg-green-100 text-green-700 border border-green-200',
  customer: 'bg-muted text-muted-foreground border border-gray-200',
};

const staffSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  first_name: z.string().min(1, 'First name required'),
  last_name: z.string().min(1, 'Last name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  role: z.enum(['admin', 'manager', 'cashier', 'customer'] as const),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  pin: z.string().length(4, 'PIN must be exactly 4 digits').regex(/^\d{4}$/, 'PIN must be 4 digits').optional().or(z.literal('')),
  is_active_cashier: z.boolean().optional(),
});

type StaffFormData = z.infer<typeof staffSchema>;

interface StaffDialogProps {
  open: boolean;
  onClose: () => void;
  staff?: User | null;
  isAdmin: boolean;
}

function StaffDialog({ open, onClose, staff, isAdmin }: StaffDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!staff;

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      username: staff?.username ?? '',
      first_name: staff?.first_name ?? '',
      last_name: staff?.last_name ?? '',
      email: staff?.email ?? '',
      phone: staff?.phone ?? '',
      role: staff?.role ?? 'cashier',
      pin: '',
      is_active_cashier: staff?.is_active_cashier ?? false,
    },
  });

  const role = watch('role');

  const createMutation = useMutation({
    mutationFn: (data: CreateStaffPayload) => createStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member created successfully');
      onClose();
      reset();
    },
    onError: (err: unknown) => {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      toast.error(apiErr.response?.data?.detail ?? 'Failed to create staff member');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateStaffPayload) => updateStaff(staff!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member updated');
      onClose();
    },
    onError: (err: unknown) => {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      toast.error(apiErr.response?.data?.detail ?? 'Failed to update staff member');
    },
  });

  const onSubmit = (data: StaffFormData) => {
    const payload = { ...data, pin: data.pin || undefined };
    if (isEditing) {
      // Omit username and password from update payload (not editable after creation)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { username: _username, password: _password, ...updatePayload } = payload;
      updateMutation.mutate(updatePayload);
    } else {
      if (!data.password) { toast.error('Password is required for new staff'); return; }
      createMutation.mutate(payload as CreateStaffPayload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Staff Member' : 'Add Staff Member'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>First Name</Label>
              <Input {...register('first_name')} placeholder="First name" />
              {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name.message}</p>}
            </div>
            <div>
              <Label>Last Name</Label>
              <Input {...register('last_name')} placeholder="Last name" />
              {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name.message}</p>}
            </div>
          </div>
          {!isEditing && (
            <div>
              <Label>Username</Label>
              <Input {...register('username')} placeholder="Username" />
              {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
            </div>
          )}
          <div>
            <Label>Email</Label>
            <Input {...register('email')} type="email" placeholder="email@example.com" />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <Label>Phone</Label>
            <Input {...register('phone')} placeholder="+254 7XX XXX XXX" />
          </div>
          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setValue('role', v as UserRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {isAdmin && <SelectItem value="admin">Admin</SelectItem>}
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="cashier">Cashier</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {!isEditing && (
            <div>
              <Label>Password</Label>
              <Input {...register('password')} type="password" placeholder="Min 8 characters" />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>
          )}
          <div>
            <Label>PIN (4 digits, for POS switch)</Label>
            <Input {...register('pin')} type="password" maxLength={4} placeholder="4-digit PIN" />
            {errors.pin && <p className="text-xs text-red-500 mt-1">{errors.pin.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending} className="bg-brand hover:bg-brand-600 rounded-xl">
              {isPending ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function StaffManagement() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const queryClient = useQueryClient();
  const { isAdmin } = useAuthContext();

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['staff', search],
    queryFn: () => getStaffList({ search: search || undefined }),
  });

  const { data: config } = useQuery({
    queryKey: ['store-config'],
    queryFn: getStoreConfig,
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member deactivated');
    },
    onError: (err: unknown) => {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      toast.error(apiErr.response?.data?.detail ?? 'Failed to deactivate');
    },
  });

  const staffMembers = staff.filter(u => u.role !== 'customer');
  const staffCount = staffMembers.length;
  const staffLimit = config?.staff_limit ?? 10;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Staff Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {staffCount} / {staffLimit} staff members
          </p>
        </div>
        <Button
          onClick={() => { setEditingStaff(null); setDialogOpen(true); }}
          className="bg-brand hover:bg-brand-600 shadow-sm rounded-xl"
          disabled={staffCount >= staffLimit}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {/* Staff Limit Bar */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-brand" />
            <span className="text-sm font-medium text-foreground">Staff Capacity</span>
          </div>
          <span className="text-sm text-muted-foreground">{staffCount} / {staffLimit}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${staffCount >= staffLimit ? 'bg-red-500' : 'bg-brand'}`}
            style={{ width: `${Math.min((staffCount / staffLimit) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search staff by name, email, username..."
          className="pl-9"
        />
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading staff...</div>
        ) : staffMembers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No staff members found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-brand-50">
                <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-3 uppercase tracking-wide">Name</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wide">Role</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wide hidden md:table-cell">Contact</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wide hidden md:table-cell">Status</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-6 py-3 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {staffMembers.map((member) => (
                <tr key={member.id} className="hover:bg-brand-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">
                          {(member.first_name?.[0] ?? member.username?.[0] ?? '?').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {member.first_name} {member.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">@{member.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full border font-medium capitalize ${ROLE_COLORS[member.role]}`}>
                      {ROLE_LABELS[member.role]}
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <p className="text-sm text-foreground">{member.email}</p>
                    {member.phone && <p className="text-xs text-muted-foreground">{member.phone}</p>}
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${member.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {member.is_active_cashier && (
                      <span className="ml-1 text-xs px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 font-medium">
                        POS Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setEditingStaff(member); setDialogOpen(true); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-brand hover:bg-gray-100 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {member.is_active ? (
                        <button
                          onClick={() => deactivateMutation.mutate(member.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Deactivate"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      ) : (
                        <UserCheck className="w-4 h-4 text-gray-300" />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <StaffDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingStaff(null); }}
        staff={editingStaff}
        isAdmin={isAdmin}
      />
    </div>
  );
}
