import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Credential } from '@/types/vault';
import type { IncomingSharePayload, NetworkPeer } from '@/types/network';

const DESKTOP_ONLY_ERROR = 'Esta funcion solo esta disponible en la aplicacion de escritorio.';

const getNetworkAPI = () => {
  if (typeof window === 'undefined') return undefined;
  return window.netShare;
};

export type UseNetworkShareResult = {
  peers: NetworkPeer[];
  incomingShares: IncomingSharePayload[];
  loading: boolean;
  error: string | null;
  isElectron: boolean;
  shareCredential: (peerId: string, credential: Credential) => Promise<void>;
};

export function useNetworkShare(): UseNetworkShareResult {
  const [peers, setPeers] = useState<NetworkPeer[]>([]);
  const [incomingShares, setIncomingShares] = useState<IncomingSharePayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    const api = getNetworkAPI();
    if (!api) {
      setIsElectron(false);
      setLoading(false);
      return;
    }
    setIsElectron(true);
    let removePeersListener: (() => void) | undefined;
    let removeShareListener: (() => void) | undefined;

    api
      .listPeers()
      .then((list) => {
        setPeers(list);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.message ?? 'No se pudo conectar con el servicio de red.');
        setLoading(false);
      });

    if (api.onPeersUpdated) {
      const cleanup = api.onPeersUpdated((list: NetworkPeer[]) => setPeers(list));
      if (typeof cleanup === 'function') {
        removePeersListener = cleanup;
      }
    }

    if (api.onPasswordReceived) {
      const cleanup = api.onPasswordReceived((share: IncomingSharePayload) => {
        setIncomingShares((prev) => {
          const next = [share, ...prev];
          return next.slice(0, 5);
        });
        toast.info(`Contrasena recibida de ${share.fromName}`, {
          description: share.credentialTitle,
        });
      });
      if (typeof cleanup === 'function') {
        removeShareListener = cleanup;
      }
    }

    return () => {
      removePeersListener?.();
      removeShareListener?.();
    };
  }, []);

  const shareCredential = useCallback(async (peerId: string, credential: Credential) => {
    const api = getNetworkAPI();
    if (!api) {
      throw new Error(DESKTOP_ONLY_ERROR);
    }
    await api.sharePassword({
      peerId,
      credential: {
        title: credential.title,
        username: credential.username,
        password: credential.password,
      },
    });
  }, []);

  return {
    peers,
    incomingShares,
    loading,
    error,
    isElectron,
    shareCredential,
  };
}
