import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getStoreConfig } from '@/api/auth';
import { useAuthContext } from '@/contexts/AuthContext';
import PinEntryDialog from './PinEntryDialog';

interface IdleLockProps {
  children: ReactNode;
}

const DEFAULT_IDLE_MINUTES = 5;

export default function IdleLock({ children }: IdleLockProps) {
  const { isAuthenticated, user } = useAuthContext();
  const { pathname } = useLocation();
  // Only lock actual cashiers — admins/managers have no PIN and use full login
  const isCashierRole = user?.role === 'cashier';
  const isPOSRoute = pathname.startsWith('/admin');
  const [isLocked, setIsLocked] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: config } = useQuery({
    queryKey: ['store-config'],
    queryFn: getStoreConfig,
    enabled: isAuthenticated,
  });

  const idleMs = (config?.idle_timeout_minutes ?? DEFAULT_IDLE_MINUTES) * 60 * 1000;

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (isAuthenticated && isCashierRole) {
        setIsLocked(true);
      }
    }, idleMs);
  };

  useEffect(() => {
    if (!isAuthenticated || !isCashierRole || !isPOSRoute) {
      if (timerRef.current) clearTimeout(timerRef.current);
      // Defer to avoid synchronous setState in effect body (react-hooks/set-state-in-effect)
      const id = setTimeout(() => setIsLocked(false), 0);
      return () => clearTimeout(id);
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- resetTimer is recreated each render intentionally
  }, [isAuthenticated, isCashierRole, isPOSRoute, idleMs]);

  const handleUnlock = () => {
    setIsLocked(false);
    setShowPinDialog(false);
    resetTimer();
  };

  if (!isAuthenticated || !isCashierRole || !isPOSRoute) {
    return <>{children}</>;
  }

  return (
    <>
      {children}

      {/* Lock Overlay */}
      {isLocked && (
        <div className="fixed inset-0 z-[9999] bg-[#0B3A2C] flex flex-col items-center justify-center">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Screen Locked</h2>
              <p className="text-white/60 mt-1">Session was idle. Please enter your PIN to continue.</p>
            </div>
            <div className="text-center">
              <p className="text-white/70 text-sm mb-1">Locked as</p>
              <p className="text-white font-semibold">
                {user?.first_name} {user?.last_name}
              </p>
            </div>
            <button
              onClick={() => setShowPinDialog(true)}
              className="bg-[#E4B83A] text-[#111915] font-semibold px-8 py-3 rounded-xl hover:bg-[#E4B83A]/90 transition-colors"
            >
              Unlock
            </button>
          </div>
        </div>
      )}

      <PinEntryDialog
        open={showPinDialog}
        onClose={() => setShowPinDialog(false)}
        onSuccess={handleUnlock}
        lockedUser={user ?? undefined}
      />
    </>
  );
}
