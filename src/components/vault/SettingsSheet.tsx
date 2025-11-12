import React from 'react';
import { useVaultStore } from '@/stores/vaultStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
export function SettingsSheet() {
  const settings = useVaultStore((s) => s.vault?.settings);
  const updateSettings = useVaultStore((s) => s.updateSettings);
  const vault = useVaultStore((s) => s.vault);
  if (!settings) return null;
  const handleExport = () => {
    try {
      const encryptedVault = localStorage.getItem('cipherkeep-vault');
      if (!encryptedVault) {
        toast.error('No se encontraron datos de bóveda para exportar.');
        return;
      }
      const blob = new Blob([encryptedVault], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cipherkeep-boveda-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('¡Bóveda exportada exitosamente!');
    } catch (error) {
      toast.error('Error al exportar la bóveda.');
      console.error(error);
    }
  };
  return (
    <div className="space-y-8 p-1">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Apariencia</h3>
        <div className="flex items-center justify-between">
          <Label htmlFor="theme">Tema</Label>
          <Select
            value={settings.theme}
            onValueChange={(value) => updateSettings({ theme: value as 'light' | 'dark' | 'system' })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar tema" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Claro</SelectItem>
              <SelectItem value="dark">Oscuro</SelectItem>
              <SelectItem value="system">Sistema</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Seguridad</h3>
        <div className="flex items-center justify-between">
          <Label htmlFor="autolock">Bloqueo automático (minutos)</Label>
          <Input
            id="autolock"
            type="number"
            className="w-[180px]"
            value={settings.autoLockMinutes}
            onChange={(e) => updateSettings({ autoLockMinutes: parseInt(e.target.value, 10) || 0 })}
            placeholder="0 para nunca"
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="clipboard">Limpiar portapapeles (segundos)</Label>
          <Input
            id="clipboard"
            type="number"
            className="w-[180px]"
            value={settings.clipboardClearSeconds}
            onChange={(e) => updateSettings({ clipboardClearSeconds: parseInt(e.target.value, 10) || 0 })}
            placeholder="0 para nunca"
          />
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Gestión de Datos</h3>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Exporta tu bóveda encriptada.</p>
          <Button onClick={handleExport} variant="outline">Exportar Bóveda</Button>
        </div>
      </div>
    </div>
  );
}