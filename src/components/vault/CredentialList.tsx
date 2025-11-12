import React, { useMemo, useState } from 'react';
import { Credential } from '@/types/vault';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Shield, Mail, Globe, User } from 'lucide-react';
interface CredentialListProps {
  credentials: Credential[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}
export function CredentialList({ credentials, selectedId, onSelect }: CredentialListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCredentials = useMemo(() => {
    if (!searchTerm) return credentials;
    return credentials.filter(c =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [credentials, searchTerm]);

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
    <div className="flex flex-col h-full">
      <div className="p-2 border-b shrink-0">
        <Input
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-8 text-sm"
        />
      </div>
      <ScrollArea className="flex-1">
        {filteredCredentials.length > 0 ? (
          <div className="p-1">
            {filteredCredentials.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={cn(
                  "w-full text-left p-2 rounded-md mb-1 transition-all duration-200",
                  "hover:bg-accent hover:shadow-sm",
                  selectedId === c.id && "bg-accent shadow-sm border border-primary/20"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-lg font-semibold text-xs shrink-0",
                    "bg-gradient-to-br from-primary/20 to-primary/10 text-primary"
                  )}>
                    {getInitials(c.title)}
                  </div>
                  <div className="flex-1 overflow-hidden min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="font-medium text-sm truncate">{c.title}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {getIconForCredential(c)}
                      <span className="truncate">{c.username}</span>
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