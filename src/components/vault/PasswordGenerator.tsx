import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { RefreshCw, Copy } from 'lucide-react';
import { toast } from 'sonner';
interface PasswordGeneratorProps {
  onPasswordGenerated: (password: string) => void;
}
const CHARSETS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};
export function PasswordGenerator({ onPasswordGenerated }: PasswordGeneratorProps) {
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState('');

  const generatePassword = useCallback(() => {
    let charset = CHARSETS.lowercase;
    if (includeUppercase) charset += CHARSETS.uppercase;
    if (includeNumbers) charset += CHARSETS.numbers;
    if (includeSymbols) charset += CHARSETS.symbols;
    if (charset === '') {
        setGeneratedPassword('');
        onPasswordGenerated('');
        return;
    }
    let password = '';
    const crypto = window.crypto || (window as any).msCrypto;
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
      password += charset[randomValues[i] % charset.length];
    }
    setGeneratedPassword(password);
    onPasswordGenerated(password);
  }, [length, includeUppercase, includeNumbers, includeSymbols]); // Removed onPasswordGenerated from dependencies

  React.useEffect(() => {
    generatePassword();
  }, [length, includeUppercase, includeNumbers, includeSymbols]); // Changed to depend on the actual values
  const copyToClipboard = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      toast.success('¡Contraseña copiada al portapapeles!');
    }
  };
  return (
    <div className="space-y-3 p-3 border rounded-lg bg-secondary/50">
      <div className="relative">
        <Input
          readOnly
          value={generatedPassword}
          className="pr-16 text-sm font-mono"
          placeholder="Contraseña Generada"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-1">
          <Button variant="ghost" size="sm" onClick={generatePassword} aria-label="Generar nueva contraseña">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={copyToClipboard} aria-label="Copiar contraseña">
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <div className="space-y-1">
          <Label htmlFor="length" className="text-xs">Longitud: {length}</Label>
          <Slider
            id="length"
            min={8}
            max={64}
            step={1}
            value={[length]}
            onValueChange={(value) => setLength(value[0])}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="uppercase" className="text-xs">Mayúsculas</Label>
          <Switch id="uppercase" checked={includeUppercase} onCheckedChange={setIncludeUppercase} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="numbers" className="text-xs">Números</Label>
          <Switch id="numbers" checked={includeNumbers} onCheckedChange={setIncludeNumbers} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="symbols" className="text-xs">Símbolos</Label>
          <Switch id="symbols" checked={includeSymbols} onCheckedChange={setIncludeSymbols} />
        </div>
      </div>
    </div>
  );
}