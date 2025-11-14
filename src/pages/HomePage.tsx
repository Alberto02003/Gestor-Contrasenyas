import React, { useEffect } from 'react';
import { useVaultStore } from '@/stores/vaultStore';
import { Onboarding } from '@/components/vault/Onboarding';
import { LockScreen } from '@/components/vault/LockScreen';
import { VaultLayout } from '@/components/vault/VaultLayout';
import { useAutoLock } from '@/hooks/use-auto-lock';
function LoadingSpinner() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
    </div>
  );
}
export function HomePage() {
  const status = useVaultStore((state) => state.status);
  const initialize = useVaultStore((state) => state.initialize);
  const theme = useVaultStore((state) => state.vault?.settings?.theme ?? 'system');
  useAutoLock();
  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.classList.toggle('dark', isDark);

    // Notify Electron about theme change
    if ((window as any).electron?.setTheme) {
      (window as any).electron.setTheme(theme);
    }

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        root.classList.toggle('dark', e.matches);
        // Notify Electron about system theme change
        if ((window as any).electron?.setTheme) {
          (window as any).electron.setTheme('system');
        }
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);
  const renderContent = () => {
    switch (status) {
      case 'loading':
        return <LoadingSpinner />;
      case 'onboarding':
        return <Onboarding />;
      case 'locked':
        return <LockScreen />;
      case 'unlocked':
        return <VaultLayout />;
      default:
        return <LoadingSpinner />;
    }
  };
  return (
    <div className="h-full w-full flex items-center justify-center bg-background">
      {renderContent()}
    </div>
  );
}