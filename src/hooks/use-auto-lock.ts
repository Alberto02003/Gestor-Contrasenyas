import { useEffect, useRef } from 'react';
import { useVaultStore } from '@/stores/vaultStore';
export function useAutoLock() {
  const status = useVaultStore((s) => s.status);
  const lastActivity = useVaultStore((s) => s.lastActivity);
  const autoLockMinutes = useVaultStore((s) => s.vault?.settings.autoLockMinutes);
  const lockVault = useVaultStore((s) => s.lockVault);
  const updateActivity = useVaultStore((s) => s.updateActivity);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    const resetTimer = () => {
      updateActivity();
    };
    if (status === 'unlocked') {
      events.forEach(event => window.addEventListener(event, resetTimer));
    }
    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [status, updateActivity]);
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (status === 'unlocked' && autoLockMinutes && autoLockMinutes > 0) {
      const autoLockMs = autoLockMinutes * 60 * 1000;
      const checkInactivity = () => {
        const now = Date.now();
        const inactiveDuration = now - lastActivity;
        if (inactiveDuration >= autoLockMs) {
          lockVault();
        } else {
          timerRef.current = setTimeout(checkInactivity, autoLockMs - inactiveDuration);
        }
      };
      timerRef.current = setTimeout(checkInactivity, autoLockMs);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [status, autoLockMinutes, lastActivity, lockVault]);
}