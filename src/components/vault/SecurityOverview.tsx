import React, { useMemo } from 'react';
import type { Credential } from '@/types/vault';
import { Shield, AlertTriangle, History } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  credentials: Credential[];
  onSelectCredential?: (id: string) => void;
};

const STALE_DAYS = 180;

const daysSince = (iso?: string | null) => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
};

const passwordStrength = (password: string) => {
  let score = 0;
  if (password.length >= 12) score += 40;
  else if (password.length >= 8) score += 20;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[0-9]/.test(password)) score += 20;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;
  return score;
};

export function SecurityOverview({ credentials, onSelectCredential }: Props) {
  const summary = useMemo(() => {
    const duplicatesMap = new Map<string, Credential[]>();
    const weak: Credential[] = [];
    const stale: Credential[] = [];

    credentials.forEach((cred) => {
      if (cred.password) {
        const arr = duplicatesMap.get(cred.password) ?? [];
        arr.push(cred);
        duplicatesMap.set(cred.password, arr);
        if (passwordStrength(cred.password) < 60) {
          weak.push(cred);
        }
      }
      const days = daysSince(cred.lastViewedAt ?? cred.updatedAt);
      if (days !== null && days >= STALE_DAYS) {
        stale.push(cred);
      }
    });

    const duplicates = Array.from(duplicatesMap.values()).filter((group) => group.length > 1);

    const total = credentials.length || 1;
    const penalty =
      duplicates.reduce((acc, group) => acc + group.length * 5, 0) +
      weak.length * 10 +
      stale.length * 5;
    const score = Math.max(20, Math.min(100, Math.round(100 - penalty / total)));

    return {
      duplicates,
      weak,
      stale,
      score,
    };
  }, [credentials]);

  if (credentials.length === 0) {
    return null;
  }

  const statusColor =
    summary.score >= 80 ? 'text-emerald-500' : summary.score >= 60 ? 'text-amber-500' : 'text-red-500';

  return (
    <div className="rounded-2xl border border-border bg-muted/40 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold flex items-center gap-1">
            <Shield className="h-4 w-4 text-primary" />
            Salud de tu bóveda
          </p>
          <p className="text-xs text-muted-foreground">Revisa acciones sugeridas para mejorar la seguridad.</p>
        </div>
        <div className={`text-lg font-bold ${statusColor}`}>{summary.score}</div>
      </div>

      {summary.duplicates.length === 0 && summary.weak.length === 0 && summary.stale.length === 0 ? (
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-500" />
          ¡Todo se ve bien! No hay acciones pendientes.
        </div>
      ) : (
        <div className="space-y-2 text-xs">
          {summary.duplicates.length > 0 && (
            <div className="rounded-lg border border-amber-300/40 bg-amber-50/70 dark:bg-amber-900/20 p-2">
              <div className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-200">
                <AlertTriangle className="h-3.5 w-3.5" />
                Contraseñas repetidas ({summary.duplicates.reduce((acc, group) => acc + group.length, 0)})
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {summary.duplicates.slice(0, 3).map((group) =>
                  group.map((cred) => (
                    <Button
                      key={cred.id}
                      variant="outline"
                      size="xs"
                      className="text-[11px]"
                      onClick={() => onSelectCredential?.(cred.id)}
                    >
                      {cred.title}
                    </Button>
                  ))
                )}
                {summary.duplicates.length > 3 && (
                  <span className="text-muted-foreground">+{summary.duplicates.length - 3} más</span>
                )}
              </div>
            </div>
          )}

          {summary.weak.length > 0 && (
            <div className="rounded-lg border border-red-300/40 bg-red-50/70 dark:bg-red-900/20 p-2">
              <div className="flex items-center gap-1.5 font-medium text-red-700 dark:text-red-200">
                <AlertTriangle className="h-3.5 w-3.5" />
                Contraseñas débiles ({summary.weak.length})
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {summary.weak.slice(0, 4).map((cred) => (
                  <Button
                    key={cred.id}
                    variant="outline"
                    size="xs"
                    className="text-[11px]"
                    onClick={() => onSelectCredential?.(cred.id)}
                  >
                    {cred.title}
                  </Button>
                ))}
                {summary.weak.length > 4 && (
                  <span className="text-muted-foreground">+{summary.weak.length - 4} más</span>
                )}
              </div>
            </div>
          )}

          {summary.stale.length > 0 && (
            <div className="rounded-lg border border-sky-300/40 bg-sky-50/70 dark:bg-sky-900/20 p-2">
              <div className="flex items-center gap-1.5 font-medium text-sky-700 dark:text-sky-200">
                <History className="h-3.5 w-3.5" />
                No usadas recientemente ({summary.stale.length})
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {summary.stale.slice(0, 4).map((cred) => (
                  <Button
                    key={cred.id}
                    variant="outline"
                    size="xs"
                    className="text-[11px]"
                    onClick={() => onSelectCredential?.(cred.id)}
                  >
                    {cred.title}
                  </Button>
                ))}
                {summary.stale.length > 4 && (
                  <span className="text-muted-foreground">+{summary.stale.length - 4} más</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
