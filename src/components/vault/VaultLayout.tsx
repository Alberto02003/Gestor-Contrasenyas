import React, { useState } from 'react';
import { useVaultStore } from '@/stores/vaultStore';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Lock, Plus, Settings, ShieldCheck } from 'lucide-react';
import { CredentialList } from './CredentialList';
import { CredentialDetail } from './CredentialDetail';
import { CredentialForm } from './CredentialForm';
import { SettingsSheet } from './SettingsSheet';
import { Credential } from '@/types/vault';
export function VaultLayout() {
  const lockVault = useVaultStore((s) => s.lockVault);
  const credentials = useVaultStore((s) => s.vault?.credentials) ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isFormSheetOpen, setFormSheetOpen] = useState(false);
  const [isDetailSheetOpen, setDetailSheetOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | undefined>(undefined);
  const selectedCredential = credentials.find(c => c.id === selectedId) ?? null;

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
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground relative">
      <header className="flex items-center justify-between px-3 py-2 border-b shrink-0">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold font-display">Gestor de Contraseñas</h1>
        </div>
        <div className="flex items-center gap-1">
          {credentials.length > 0 && (
            <Button size="sm" onClick={handleAddNew} className="gap-1">
              <Plus className="h-4 w-4" />
              <span className="text-xs">Nueva</span>
            </Button>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" aria-label="Configuración">
                <Settings className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Configuración</SheetTitle>
                <SheetDescription className="sr-only">
                  Configura los ajustes de tu bóveda incluyendo tema, bloqueo automático y preferencias del portapapeles
                </SheetDescription>
              </SheetHeader>
              <div className="py-4">
                <SettingsSheet />
              </div>
            </SheetContent>
          </Sheet>
          <Button variant="outline" size="sm" onClick={lockVault} aria-label="Bloquear bóveda">
            <Lock className="h-4 w-4" />
          </Button>
        </div>
      </header>
      <main className="flex-1 overflow-hidden relative">
        {credentials.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-4">
            <div className="text-center space-y-2">
              <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground" />
              <h2 className="text-lg font-semibold">Aún no hay credenciales</h2>
              <p className="text-sm text-muted-foreground">Comienza agregando tu primera contraseña</p>
            </div>
            <Button onClick={handleAddNew} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Agregar Primera Contraseña
            </Button>
          </div>
        ) : (
          <CredentialList credentials={credentials} selectedId={selectedId} onSelect={handleSelect} />
        )}
      </main>

      {/* Detail Sheet */}
      <Sheet open={isDetailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent className="w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalles de Credencial</SheetTitle>
            <SheetDescription className="sr-only">
              Ver y gestionar la información de tus credenciales guardadas
            </SheetDescription>
          </SheetHeader>
          <div className="py-2">
            <CredentialDetail credential={selectedCredential} onEdit={handleEdit} onDeselect={() => setDetailSheetOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Form Sheet */}
      <Sheet open={isFormSheetOpen} onOpenChange={setFormSheetOpen}>
        <SheetContent className="w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingCredential ? 'Editar Credencial' : 'Agregar Nueva Credencial'}</SheetTitle>
            <SheetDescription className="sr-only">
              {editingCredential ? 'Editar la información de tu credencial' : 'Crear una nueva entrada de credencial'}
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <CredentialForm credential={editingCredential} onDone={() => setFormSheetOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
