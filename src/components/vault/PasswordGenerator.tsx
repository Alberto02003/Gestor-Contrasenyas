import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const latestCallbackRef = useRef(onPasswordGenerated);

  useEffect(() => {
    latestCallbackRef.current = onPasswordGenerated;
  }, [onPasswordGenerated]);

  const generatePassword = useCallback(() => {
    let charset = CHARSETS.lowercase;
    if (includeUppercase) charset += CHARSETS.uppercase;
    if (includeNumbers) charset += CHARSETS.numbers;
    if (includeSymbols) charset += CHARSETS.symbols;
    if (charset === '') {
        setGeneratedPassword('');
        latestCallbackRef.current?.('');
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
    latestCallbackRef.current?.(password);
  }, [length, includeUppercase, includeNumbers, includeSymbols]);

  useEffect(() => {
    generatePassword();
  }, [generatePassword]);
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
          className="pr-16 text-sm font-mono bg-muted border-border"
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
          <input
            id="length"
            type="range"
            min={8}
            max={64}
            step={1}
            value={length}
            onChange={(e) => setLength(Number.parseInt(e.target.value, 10))}
            className="w-full cursor-pointer accent-primary"
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="uppercase" className="text-xs">Mayúsculas</Label>
          <input
            id="uppercase"
            type="checkbox"
            checked={includeUppercase}
            onChange={(e) => setIncludeUppercase(e.target.checked)}
            className="h-4 w-4 accent-primary cursor-pointer"
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="numbers" className="text-xs">Números</Label>
          <input
            id="numbers"
            type="checkbox"
            checked={includeNumbers}
            onChange={(e) => setIncludeNumbers(e.target.checked)}
            className="h-4 w-4 accent-primary cursor-pointer"
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="symbols" className="text-xs">Símbolos</Label>
          <input
            id="symbols"
            type="checkbox"
            checked={includeSymbols}
            onChange={(e) => setIncludeSymbols(e.target.checked)}
            className="h-4 w-4 accent-primary cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
