import React, { useState, useEffect } from 'react';
import { useVaultStore } from '@/stores/vaultStore';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Lock, Plus, Settings, ShieldCheck, Radio, Shield } from 'lucide-react';
import { CredentialList } from './CredentialList';
import { CredentialDetail } from './CredentialDetail';
import { CredentialForm } from './CredentialForm';
import { SettingsSheet } from './SettingsSheet';
import { Credential } from '@/types/vault';
import { useNetworkShare } from '@/hooks/use-network-share';
import { NetworkSharePanel } from './NetworkSharePanel';
import { ReceivedPasswordDialog } from './ReceivedPasswordDialog';
import { SecurityOverview } from './SecurityOverview';

export function VaultLayout() {
  const lockVault = useVaultStore((s) => s.lockVault);
  const credentials = useVaultStore((s) => s.vault?.credentials) ?? [];
  const recordCredentialView = useVaultStore((s) => s.recordCredentialView);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isFormSheetOpen, setFormSheetOpen] = useState(false);
  const [isDetailSheetOpen, setDetailSheetOpen] = useState(false);
  const [isNetworkSheetOpen, setNetworkSheetOpen] = useState(false);
  const [isSecuritySheetOpen, setSecuritySheetOpen] = useState(false);
  const [shareCredentialId, setShareCredentialId] = useState<string | null>(null);
  const [editingCredential, setEditingCredential] = useState<Credential | undefined>(undefined);
  const [isPasswordDialogOpen, setPasswordDialogOpen] = useState(false);
  const selectedCredential = credentials.find((c) => c.id === selectedId) ?? null;
  const networkShare = useNetworkShare();

  useEffect(() => {
    if (networkShare.latestShare) {
      setPasswordDialogOpen(true);
    }
  }, [networkShare.latestShare]);

  const handleAddNew = () => {
    setEditingCredential(undefined);
    setFormSheetOpen(true);
  };

  const handleEdit = (credential: Credential) => {
    setDetailSheetOpen(false);
    setEditingCredential(credential);
    setFormSheetOpen(true);
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setDetailSheetOpen(true);
    recordCredentialView(id);
  };

  const handleReviewCredential = (id: string) => {
    setSelectedId(id);
    setDetailSheetOpen(true);
    recordCredentialView(id);
  };

  const openNetworkSheet = (credentialId?: string | null) => {
    setShareCredentialId(credentialId ?? selectedId ?? null);
    setNetworkSheetOpen(true);
  };

  const handlePasswordDialogClose = (open: boolean) => {
    setPasswordDialogOpen(open);
    if (!open) {
      networkShare.clearLatestShare();
    }
  };

  return (
    <div className="h-full w-full max-w-[420px] flex flex-col rounded-3xl border border-border bg-background shadow-xl overflow-hidden">
      <header className="flex items-center justify-between px-3 py-2 border-b bg-muted shrink-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-semibold leading-tight">Gestor de Contraseñas</p>
            <p className="text-[11px] text-muted-foreground -mt-0.5">Acceso rápido</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Configuración">
                <Settings className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[90vw] sm:w-[420px] max-w-[420px] h-full border-l rounded-none p-0">
              <div className="flex flex-col h-full">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>Configuración</SheetTitle>
                  <SheetDescription className="text-sm">
                    Ajusta tema, bloqueo automático y preferencias del portapapeles.
                  </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-4">
                  <SettingsSheet />
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <Sheet open={isSecuritySheetOpen} onOpenChange={setSecuritySheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Estado de seguridad" onClick={() => setSecuritySheetOpen(true)}>
                <Shield className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[90vw] sm:w-[420px] max-w-[420px] h-full border-l rounded-none p-0">
              <div className="flex flex-col h-full">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>Salud de la bóveda</SheetTitle>
                  <SheetDescription className="text-sm">
                    Revisa contraseñas repetidas, débiles u olvidadas y aplica sugerencias.
                  </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-4">
                  <SecurityOverview credentials={credentials} onSelectCredential={handleReviewCredential} />
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <div className="relative">
            <Button variant="ghost" size="icon" aria-label="Usuarios conectados en red" onClick={() => openNetworkSheet(selectedId)}>
              <Radio className="h-4 w-4" />
            </Button>
            {networkShare.incomingShares.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white">
                {Math.min(9, networkShare.incomingShares.length)}
              </span>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={lockVault} aria-label="Bloquear bóveda">
            <Lock className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 min-h-0 bg-background flex flex-col overflow-hidden">
        {credentials.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center px-3">
            <ShieldCheck className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold">Aún no hay credenciales</p>
              <p className="text-xs text-muted-foreground">Agrega las más usadas para tenerlas a un clic.</p>
            </div>
          </div>
        ) : (
          <CredentialList credentials={credentials} selectedId={selectedId} onSelect={handleSelect} />
        )}
      </main>

      <footer className="border-t px-3 py-2 bg-muted">
        <Button onClick={handleAddNew} className="w-full gap-2 text-sm bg-[rgb(37,99,235)] hover:bg-[rgb(31,59,93)] text-white shadow-primary">
          <Plus className="h-4 w-4" />
          Nueva credencial
        </Button>
      </footer>

      <Sheet open={isDetailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent
          side="bottom"
          className="max-w-[420px] mx-auto rounded-t-2xl h-[90vh] p-0 overflow-hidden"
        >
          <div className="flex flex-col h-full">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Detalles de credencial</SheetTitle>
              <SheetDescription className="text-xs">
                Información rápida para copiar, editar o compartir.
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <CredentialDetail
                credential={selectedCredential}
                onEdit={handleEdit}
                onDeselect={() => setDetailSheetOpen(false)}
                onShare={(credential) => openNetworkSheet(credential.id)}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={isFormSheetOpen} onOpenChange={setFormSheetOpen}>
        <SheetContent
          side="bottom"
          className="max-w-[420px] mx-auto rounded-t-2xl h-[95vh] p-0 overflow-hidden"
        >
          <div className="flex flex-col h-full">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>{editingCredential ? 'Editar credencial' : 'Agregar credencial'}</SheetTitle>
              <SheetDescription className="text-xs">
                Guarda solo lo esencial para acceder rápido desde la bandeja.
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <CredentialForm credential={editingCredential} onDone={() => setFormSheetOpen(false)} />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={isNetworkSheetOpen} onOpenChange={setNetworkSheetOpen}>
        <SheetContent side="right" className="w-[90vw] sm:w-[420px] max-w-[420px] h-full border-l rounded-none p-0">
          <div className="flex flex-col h-full">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Compartir por red</SheetTitle>
              <SheetDescription className="text-xs">
                Envía contraseñas cifradas a otros equipos cercanos.
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-4">
              <NetworkSharePanel
                selectedCredentialId={shareCredentialId ?? selectedId ?? null}
                onCredentialChange={(id) => setShareCredentialId(id)}
                networkShare={networkShare}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ReceivedPasswordDialog share={networkShare.latestShare} open={isPasswordDialogOpen} onOpenChange={handlePasswordDialogClose} />
    </div>
  );
}
