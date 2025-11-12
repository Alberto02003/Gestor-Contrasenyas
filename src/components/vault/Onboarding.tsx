import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useVaultStore } from '@/stores/vaultStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { ShieldCheck } from 'lucide-react';
const formSchema = z.object({
  password: z.string().min(12, 'La contraseña debe tener al menos 12 caracteres'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ['confirmPassword'],
});
export function Onboarding() {
  const createVault = useVaultStore((s) => s.createVault);
  const status = useVaultStore((s) => s.status);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });
  const calculateStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 12) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    setPasswordStrength(strength);
  };
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createVault(values.password);
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md animate-scale-in">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <ShieldCheck className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-display">Bienvenido a Gestor de Contraseñas</CardTitle>
          <CardDescription>Crea una contraseña maestra fuerte para asegurar tu bóveda.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña Maestra</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Elige una contraseña fuerte"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          calculateStrength(e.target.value);
                        }}
                      />
                    </FormControl>
                    <Progress value={passwordStrength} className="h-2 mt-2" />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirma tu contraseña" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={status === 'loading'}>
                {status === 'loading' ? 'Creando Bóveda...' : 'Crear Bóveda'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground text-center">
            <strong>Importante:</strong> Tu contraseña maestra es la única forma de acceder a tu bóveda. No podemos recuperarla por ti.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
