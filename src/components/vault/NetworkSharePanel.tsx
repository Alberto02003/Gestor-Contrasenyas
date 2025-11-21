import React, { useEffect, useMemo, useState } from 'react';
import { Send, Loader2, Wifi, CheckCircle2, AlertCircle, Save, Sparkles, Radar, Shield, Inbox } from 'lucide-react';
import { useVaultStore } from '@/stores/vaultStore';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { UseNetworkShareResult } from '@/hooks/use-network-share';
import { toast } from 'sonner';

type NetworkSharePanelProps = {
  selectedCredentialId?: string | null;
  onCredentialChange?: (credentialId: string | null) => void;
  networkShare: UseNetworkShareResult;
};

const formatTime = (timestamp: number) => {
  try {
    return new Date(timestamp).toLocaleTimeString();
  } catch {
    return '';
  }
};

export function NetworkSharePanel({
  selectedCredentialId,
  onCredentialChange,
  networkShare,
}: NetworkSharePanelProps) {
  const credentials = useVaultStore((state) => state.vault?.credentials ?? []);
  const addCredential = useVaultStore((state) => state.addCredential);
  const recordCredentialShare = useVaultStore((state) => state.recordCredentialShare);
  const [currentCredentialId, setCurrentCredentialId] = useState(selectedCredentialId ?? '');
  const [sendingPeerId, setSendingPeerId] = useState<string | null>(null);
  const [savingShareId, setSavingShareId] = useState<string | null>(null);
  const { peers, incomingShares, loading, error, isElectron, shareCredential } = networkShare;

  useEffect(() => {
    setCurrentCredentialId(selectedCredentialId ?? '');
  }, [selectedCredentialId]);

  const selectedCredential = useMemo(
    () => credentials.find((credential) => credential.id === currentCredentialId) ?? null,
    [credentials, currentCredentialId]
  );

  const handleCredentialChange = (value: string) => {
    setCurrentCredentialId(value);
    onCredentialChange?.(value || null);
  };

  const handleShare = async (peerId: string) => {
    if (!selectedCredential) {
      toast.error('Selecciona la credencial que quieres compartir.');
      return;
    }
    try {
      setSendingPeerId(peerId);
      const peerName = peers.find((peer) => peer.id === peerId)?.name ?? 'el equipo';
      await shareCredential(peerId, selectedCredential);
      await recordCredentialShare(selectedCredential.id, `Compartida con ${peerName}`);
      toast.success(`Contrasena enviada a ${peerName}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo compartir la contrasena.';
      toast.error(message);
    } finally {
      setSendingPeerId(null);
    }
  };

  const handleCopy = async (value: string, label: string) => {
    if (!value) return;
    if (!navigator?.clipboard?.writeText) {
      toast.error('El portapapeles no esta disponible.');
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado.`);
    } catch {
      toast.error('No se pudo copiar al portapapeles.');
    }
  };

  const handleSaveShare = async (share: (typeof incomingShares)[number]) => {
    try {
      setSavingShareId(share.id);
      await addCredential({
        title: share.credentialTitle,
        username: share.username,
        password: share.password,
        notes: `Compartida por ${share.fromName} (${share.fromIp}) el ${new Date(share.timestamp).toLocaleString()}`,
      });
      toast.success('Contrasena agregada a tu boveda.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar la contrasena.';
      toast.error(message);
    } finally {
      setSavingShareId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-background p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/15 p-2 text-primary shadow-sm ring-1 ring-primary/20">
              <Wifi className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-primary">Compartir en tu red</p>
              <p className="text-sm text-muted-foreground">
                Envia tus credenciales cifradas a equipos cercanos con Gestor abierto.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 text-xs">
            <Badge variant={isElectron ? 'default' : 'secondary'} className={isElectron ? '' : 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100'}>
              {isElectron ? 'Listo en escritorio' : 'Activalo desde la app de escritorio'}
            </Badge>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
                <Radar className="h-3.5 w-3.5" />
                {loading ? 'Buscando' : `${peers.length} equipos`}
              </Badge>
              <Badge variant="outline" className="gap-1 border-emerald-200 text-emerald-700 dark:border-emerald-900 dark:text-emerald-200">
                <Inbox className="h-3.5 w-3.5" />
                {incomingShares.length} recibidas
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-primary" />
              Que quieres compartir
            </CardTitle>
            <Badge variant={selectedCredential ? 'default' : 'secondary'} className="gap-1 text-[11px]">
              <Sparkles className="h-3.5 w-3.5" />
              {selectedCredential ? 'Listo' : 'Selecciona'}
            </Badge>
          </div>
          <CardDescription>Solo se enviara la informacion necesaria y cifrada.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="space-y-2">
            <Label htmlFor="credential-select">Selecciona la credencial</Label>
            {credentials.length === 0 ? (
              <p className="text-sm text-muted-foreground">Primero debes crear una credencial para poder compartirla.</p>
            ) : (
              <Select value={currentCredentialId || undefined} onValueChange={handleCredentialChange}>
                <SelectTrigger id="credential-select" className="justify-between">
                  <SelectValue placeholder="Elige que contrasena compartir" />
                </SelectTrigger>
                <SelectContent>
                  {credentials.map((credential) => (
                    <SelectItem key={credential.id} value={credential.id}>
                      {credential.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selectedCredential && (
              <p className="text-xs text-muted-foreground">
                Usuario: <span className="font-mono text-foreground">{selectedCredential.username}</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {!isElectron && (
        <Alert variant="destructive">
          <AlertTitle>Disponible en escritorio</AlertTitle>
          <AlertDescription>
            La comparticion por red necesita la aplicacion de escritorio. Abre Gestor de Contrasenas instalada en tu ordenador
            para activar esta funcion.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>No se pudo conectar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Usuarios conectados</h3>
            {isElectron && !loading && (
              <div className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                <Wifi className="h-3 w-3 animate-pulse" />
                <span className="text-xs font-medium">Escaneando</span>
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{peers.length} activos</span>
        </div>
        {loading ? (
          <div className="mt-3 space-y-2">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : peers.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
            <p>
              No se detectaron otros equipos activos en tu red local. Asegurate de que Gestor de Contrasenas este abierto en el otro
              ordenador.
            </p>
            {isElectron && (
              <p className="mt-2 text-xs">
                El escaneo de red esta activo y se actualizara automaticamente cuando se detecten equipos.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {peers.map((peer) => (
              <div
                key={peer.id}
                className={`rounded-xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${peer.hasApp ? 'border-green-200 bg-green-50/60 dark:border-green-900 dark:bg-green-950/30' : 'bg-muted/40'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{peer.name}</p>
                      {peer.hasApp ? (
                        <div className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">Con app</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">Sin app</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="rounded-full bg-background/60 px-2 py-0.5">IP: {peer.ip}</span>
                      <span className="rounded-full bg-background/60 px-2 py-0.5">Ultimo visto: {formatTime(peer.lastSeen)}</span>
                    </div>
                    {!peer.hasApp && (
                      <p className="mt-2 text-xs text-orange-600 dark:text-orange-400">
                        Este equipo no tiene la app. El envio podria fallar.
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={() => handleShare(peer.id)}
                    disabled={!selectedCredential || !isElectron || sendingPeerId === peer.id}
                    variant={peer.hasApp ? 'default' : 'outline'}
                  >
                    {sendingPeerId === peer.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enviando
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Enviar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {incomingShares.length > 0 && (
        <div className="rounded-2xl border bg-muted/50 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Ultimas contrasenas recibidas</h3>
            </div>
            <Badge variant="outline" className="border-primary/30 text-primary">
              {incomingShares.length} nuevas
            </Badge>
          </div>
          <div className="mt-3 space-y-3">
            {incomingShares.map((share) => (
              <div key={share.id} className="rounded-xl border bg-background/80 p-3 shadow-sm">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">{share.credentialTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    De {share.fromName} ({share.fromIp})
                  </p>
                  <p className="text-xs text-muted-foreground">Recibido a las {formatTime(share.timestamp)}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleCopy(share.username, 'Usuario')}>
                    Copiar usuario
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleCopy(share.password, 'Contrasena')}>
                    Copiar contrasena
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={() => handleSaveShare(share)}
                    disabled={savingShareId === share.id}
                  >
                    {savingShareId === share.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Guardando
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Guardar aqui
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
