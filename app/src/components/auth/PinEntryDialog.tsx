import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Lock, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { getActiveCashiers } from '@/api/auth';
import { useAuthContext } from '@/contexts/AuthContext';
import type { User } from '@/types';

interface PinEntryDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** When provided, skips user selection and unlocks as this user directly */
  lockedUser?: Pick<User, 'id' | 'first_name' | 'last_name' | 'username' | 'role' | 'avatar'>;
}

export default function PinEntryDialog({ open, onClose, onSuccess, lockedUser }: PinEntryDialogProps) {
  const [selectedUser, setSelectedUser] = useState<Pick<User, 'id' | 'first_name' | 'last_name' | 'username' | 'role' | 'avatar'> | null>(lockedUser ?? null);
  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { switchUser } = useAuthContext();

  // When used as unlock screen, keep selectedUser in sync with lockedUser
  useEffect(() => {
    if (lockedUser) setSelectedUser(lockedUser);
  }, [lockedUser, open]);

  const { data: cashiers = [], isLoading } = useQuery({
    queryKey: ['active-cashiers'],
    queryFn: getActiveCashiers,
    enabled: open,
  });

  const handleVerify = async () => {
    if (!selectedUser || pin.length !== 4) return;
    setIsVerifying(true);
    try {
      await switchUser(selectedUser.id, pin);
      toast.success(`Switched to ${selectedUser.first_name || selectedUser.username}`);
      setPin('');
      setSelectedUser(null);
      onSuccess?.();
      onClose();
    } catch {
      toast.error('Incorrect PIN. Please try again.');
      setPin('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setPin('');
    setSelectedUser(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Switch Cashier
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#0B3A2C]" />
          </div>
        ) : !selectedUser ? (
          <div className="space-y-3">
            <p className="text-sm text-[#6B7A72]">Select a cashier to switch to:</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {cashiers.map((cashier) => (
                <button
                  key={cashier.id}
                  onClick={() => setSelectedUser(cashier)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:border-[#0B3A2C] hover:bg-[#0B3A2C]/5 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-[#0B3A2C] flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">
                      {(cashier.first_name?.[0] ?? cashier.username?.[0] ?? '?').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#111915]">
                      {cashier.first_name} {cashier.last_name}
                    </p>
                    <p className="text-xs text-[#6B7A72] capitalize">{cashier.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#0B3A2C] flex items-center justify-center">
                <span className="text-white font-bold">
                  {(selectedUser.first_name?.[0] ?? selectedUser.username?.[0] ?? '?').toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-[#111915]">
                  {selectedUser.first_name} {selectedUser.last_name}
                </p>
                <button
                  onClick={() => { setSelectedUser(null); setPin(''); }}
                  className="text-xs text-[#6B7A72] hover:text-[#0B3A2C] underline"
                >
                  Change user
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-[#6B7A72]">Enter your 4-digit PIN</p>
              <InputOTP
                maxLength={4}
                value={pin}
                onChange={setPin}
                onComplete={handleVerify}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              onClick={handleVerify}
              disabled={pin.length !== 4 || isVerifying}
              className="w-full bg-[#0B3A2C] hover:bg-[#0B3A2C]/90"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Confirm PIN'
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
