import React, { useMemo, useState } from 'react';
import { Credential } from '@/types/vault';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Shield, Mail, Globe, User, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ActivityFilter = 'all' | '30' | '60' | '90' | 'never';
interface CredentialListProps {
  credentials: Credential[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}
export function CredentialList({ credentials, selectedId, onSelect }: CredentialListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');

  const allTags = useMemo(() => {
    const tags = credentials.flatMap((c) => c.tags ?? []);
    return Array.from(new Set(tags)).sort((a, b) => a.localeCompare(b));
  }, [credentials]);

  const getLastActivityDate = (credential: Credential) => {
    return (
      credential.lastViewedAt ||
      credential.lastSharedAt ||
      credential.lastUsedAt ||
      credential.updatedAt ||
      credential.createdAt
    );
  };

  const getDaysSinceLastActivity = (credential: Credential) => {
    const last = getLastActivityDate(credential);
    if (!last) return null;
    const lastTime = new Date(last).getTime();
    if (Number.isNaN(lastTime)) return null;
    return Math.floor((Date.now() - lastTime) / (1000 * 60 * 60 * 24));
  };

  const matchesSearch = (credential: Credential) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      credential.title.toLowerCase().includes(term) ||
      credential.url?.toLowerCase().includes(term) ||
      credential.username.toLowerCase().includes(term)
    );
  };

  const matchesActivityFilter = (credential: Credential) => {
    const days = getDaysSinceLastActivity(credential);
    switch (activityFilter) {
      case '30':
        return days !== null && days >= 30;
      case '60':
        return days !== null && days >= 60;
      case '90':
        return days !== null && days >= 90;
      case 'never':
        return !credential.lastViewedAt && !credential.lastSharedAt;
      default:
        return true;
    }
  };

  const matchesTagFilter = (credential: Credential) => {
    if (tagFilter === 'all') return true;
    return (credential.tags ?? []).includes(tagFilter);
  };

  const filteredCredentials = useMemo(() => {
    return credentials.filter((c) => matchesSearch(c) && matchesActivityFilter(c) && matchesTagFilter(c));
  }, [credentials, searchTerm, activityFilter, tagFilter]);

  const getHostname = (url?: string) => {
    if (!url) return '';
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url.replace(/^https?:\/\//, '');
    }
  };

  const formatLastActivityLabel = (credential: Credential) => {
    const last = getLastActivityDate(credential);
    if (!last) return 'Sin actividad registrada';
    try {
      return new Date(last).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return last;
    }
  };

  const getIconForCredential = (credential: Credential) => {
    if (credential.url?.includes('gmail') || credential.url?.includes('mail') || credential.username.includes('@')) {
      return <Mail className="h-4 w-4" />;
    }
    if (credential.url) {
      return <Globe className="h-4 w-4" />;
    }
    return <User className="h-4 w-4" />;
  };

  const getInitials = (title: string) => {
    return title
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-4 pt-3 pb-3 space-y-3 border-b border-border">
        <Input
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-8 text-sm bg-muted border border-border text-foreground placeholder:text-muted-foreground"
        />
        <div className="flex gap-2">
          <Select value={activityFilter} onValueChange={(value: ActivityFilter) => setActivityFilter(value)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Filtrar por actividad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="30">Inactivas (30 días)</SelectItem>
              <SelectItem value="60">Inactivas (60 días)</SelectItem>
              <SelectItem value="90">Inactivas (90 días)</SelectItem>
              <SelectItem value="never">Nunca abiertas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tagFilter} onValueChange={(value) => setTagFilter(value)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Colección" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las colecciones</SelectItem>
              {allTags.map((tag) => (
                <SelectItem value={tag} key={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <ScrollArea className="flex-1 min-h-0 px-2 py-3">
        {filteredCredentials.length > 0 ? (
          <div className="space-y-2">
            {filteredCredentials.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={cn(
                  "w-full text-left rounded-2xl px-3 py-3 transition-all duration-200 border",
                  "bg-muted/30 border-transparent hover:border-primary/40 hover:bg-primary/10",
                  selectedId === c.id && "border-primary/60 bg-primary/15 shadow-primary"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "flex items-center justify-center w-11 h-11 rounded-xl font-semibold text-sm shrink-0",
                    "bg-gradient-to-br from-primary to-accent1 text-white shadow-primary"
                  )}>
                    {getInitials(c.title)}
                  </div>
                  <div className="flex-1 overflow-hidden min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm text-foreground truncate">{c.title}</p>
                      {c.url && (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-primary/25 text-primary-foreground/80 border border-primary/30">
                          {getHostname(c.url)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      {getIconForCredential(c)}
                      <span className="truncate">{c.username}</span>
                    </div>
                    {c.tags && c.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {c.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-accent/90 bg-accent/15 border border-accent/30"
                          >
                            {tag}
                          </span>
                        ))}
                        {c.tags.length > 3 && <span className="opacity-70 text-[10px]">+{c.tags.length - 3}</span>}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-2">
                      <Clock className="h-3 w-3" />
                      <span>Último acceso: {formatLastActivityLabel(c)}</span>
                      {(() => {
                        const days = getDaysSinceLastActivity(c);
                        if (days !== null && days >= 60) {
                          return (
                            <span className="ml-2 rounded-full bg-warning/20 px-2 py-0.5 text-warning">
                              +{days} días
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No se encontraron credenciales</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
