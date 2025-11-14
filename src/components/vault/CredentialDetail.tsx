import React, { useMemo, useState } from 'react';
import { Credential } from '@/types/vault';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Copy, Edit, Trash2, Eye, EyeOff, ExternalLink, Share2, Clock, Tag } from 'lucide-react';
import { useVaultStore } from '@/stores/vaultStore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
interface CredentialDetailProps {
  credential: Credential | null;
  onEdit: (credential: Credential) => void;
  onDeselect: () => void;
  onShare: (credential: Credential) => void;
}
export function CredentialDetail({ credential, onEdit, onDeselect, onShare }: CredentialDetailProps) {
  const [showPassword, setShowPassword] = useState(false);
  const deleteCredential = useVaultStore((s) => s.deleteCredential);
  const clipboardClearSeconds = useVaultStore((s) => s.vault?.settings.clipboardClearSeconds) ?? 30;
  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${fieldName} copiado al portapapeles!`);
      if (clipboardClearSeconds > 0) {
        setTimeout(() => {
          navigator.clipboard.readText().then(clipText => {
            if (clipText === text) {
              navigator.clipboard.writeText('');
            }
          });
        }, clipboardClearSeconds * 1000);
      }
    });
  };
  const handleDelete = async () => {
    if (credential) {
      await deleteCredential(credential.id);
      toast.success('Credencial eliminada.');
      onDeselect();
    }
  };
  if (!credential) {
    return (
      <div className="flex h-full items-center justify-center bg-secondary/50 rounded-lg">
        <div className="text-center">
          <p className="text-lg font-medium">Selecciona un elemento</p>
          <p className="text-sm text-muted-foreground">Los detalles se mostrarán aquí.</p>
        </div>
      </div>
    );
  }
  const formatDate = (iso?: string | null) => {
    if (!iso) return 'Sin registro';
    try {
      return new Date(iso).toLocaleString('es-ES', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return iso;
    }
  };

  const recentHistory = useMemo(() => {
    return (credential.history ?? []).slice(0, 5);
  }, [credential.history]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-2xl break-all">{credential.title}</CardTitle>
        {credential.url && (
          <CardDescription className="flex items-center gap-2">
            <a href={credential.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
              {credential.url}
            </a>
            <a href={credential.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-1 space-y-6 overflow-y-auto">
        <div className="space-y-2">
          <h4 className="font-semibold">Usuario/Correo</h4>
          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
            <p className="font-mono text-sm break-all">{credential.username}</p>
            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(credential.username, 'Usuario')}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold">Contraseña</h4>
          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
            <p className="font-mono text-sm break-all">
              {showPassword ? credential.password : '••••••••••••'}
            </p>
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(credential.password, 'Contraseña')}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        {credential.tags && credential.tags.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Colecciones
            </h4>
            <div className="flex flex-wrap gap-1">
              {credential.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        {credential.notes && (
          <div className="space-y-2">
            <h4 className="font-semibold">Notas</h4>
            <p className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap break-words">{credential.notes}</p>
          </div>
        )}
        <div className="space-y-2">
          <h4 className="font-semibold flex items-center gap-2"><Clock className="h-4 w-4" />Actividad reciente</h4>
          <div className="rounded-md border p-3 text-xs space-y-2">
            <div className="flex justify-between">
              <span>Última apertura</span>
              <span className="font-medium">{formatDate(credential.lastViewedAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>Último envío/compartido</span>
              <span className="font-medium">{formatDate(credential.lastSharedAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total de eventos registrados</span>
              <span className="font-medium">{credential.history?.length ?? 0}</span>
            </div>
          </div>
          <div className="space-y-1">
            {recentHistory.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin eventos registrados todavía.</p>
            ) : (
              <ul className="space-y-1 text-xs text-muted-foreground">
                {recentHistory.map((entry) => (
                  <li key={entry.id} className="flex justify-between rounded-md border px-3 py-1.5">
                    <span className="font-medium capitalize">{entry.type === 'view' ? 'Vista' : 'Compartida'}</span>
                    <span>{formatDate(entry.timestamp)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="p-4 flex flex-wrap justify-end gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="gap-1"
          onClick={() => credential && onShare(credential)}
        >
          <Share2 className="h-4 w-4" />
          Compartir
        </Button>
        <Button variant="outline" size="icon" onClick={() => onEdit(credential)}><Edit className="h-4 w-4" /></Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente la credencial de "{credential.title}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
