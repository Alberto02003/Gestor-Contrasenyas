import React, { useState } from 'react';
import { Copy, Eye, EyeOff, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { IncomingSharePayload } from '@/types/network';

type ReceivedPasswordDialogProps = {
  share: IncomingSharePayload | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ReceivedPasswordDialog({ share, open, onOpenChange }: ReceivedPasswordDialogProps) {
  const [showPassword, setShowPassword] = useState(false);

  if (!share) return null;

  const handleCopy = async (value: string, label: string) => {
    if (!value) return;
    if (!navigator?.clipboard?.writeText) {
      toast.error('El portapapeles no está disponible.');
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado al portapapeles`);
    } catch {
      toast.error('No se pudo copiar al portapapeles.');
    }
  };

  const formatTime = (timestamp: number) => {
    try {
      return new Date(timestamp).toLocaleString('es-ES', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
    } catch {
      return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            Contraseña recibida
          </DialogTitle>
          <DialogDescription>
            De <span className="font-semibold">{share.fromName}</span> ({share.fromIp})
            <br />
            {formatTime(share.timestamp)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Título de la credencial */}
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-sm font-medium text-muted-foreground">Credencial</p>
            <p className="text-lg font-semibold">{share.credentialTitle}</p>
          </div>

          {/* Usuario */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Usuario / Email</label>
            <div className="flex gap-2">
              <div className="flex-1 rounded-md border bg-background px-3 py-2">
                <p className="font-mono text-sm">{share.username || 'Sin usuario'}</p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(share.username, 'Usuario')}
                disabled={!share.username}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Contraseña */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Contraseña</label>
            <div className="flex gap-2">
              <div className="flex-1 rounded-md border bg-background px-3 py-2">
                <p className="font-mono text-sm">
                  {showPassword ? share.password : '••••••••••••'}
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(share.password, 'Contraseña')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Cerrar
          </Button>
          <Button
            onClick={() => {
              handleCopy(
                `Usuario: ${share.username}\nContraseña: ${share.password}`,
                'Credencial completa'
              );
            }}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copiar todo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
