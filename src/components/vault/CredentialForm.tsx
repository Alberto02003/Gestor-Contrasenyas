import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Credential } from '@/types/vault';
import { useVaultStore } from '@/stores/vaultStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PasswordGenerator } from './PasswordGenerator';
import { toast } from 'sonner';

interface CredentialFormProps {
  credential?: Credential;
  onDone: () => void;
}

// Schema for the form (without id, createdAt, updatedAt - those are managed by the store)
const FormSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  url: z.string().optional().default(''),
  username: z.string().min(1, 'El usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
  notes: z.string().optional().default(''),
  tags: z.array(z.string()).optional().default([]),
});

type FormData = z.infer<typeof FormSchema>;
export function CredentialForm({ credential, onDone }: CredentialFormProps) {
  console.log('CredentialForm rendering', { credential });
  const addCredential = useVaultStore((s) => s.addCredential);
  const updateCredential = useVaultStore((s) => s.updateCredential);

  const defaultValues = credential ? {
    title: credential.title,
    url: credential.url || '',
    username: credential.username,
    password: credential.password,
    notes: credential.notes || '',
    tags: credential.tags || [],
  } : {
    title: '',
    url: '',
    username: '',
    password: '',
    notes: '',
    tags: [],
  };

  console.log('Form defaultValues:', defaultValues);

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues,
  });
  const onSubmit = async (data: FormData) => {
    try {
      if (credential) {
        await updateCredential({ ...credential, ...data });
        toast.success('¡Credencial actualizada exitosamente!');
      } else {
        await addCredential(data);
        toast.success('¡Credencial agregada exitosamente!');
      }
      onDone();
    } catch (error) {
      toast.error('Error al guardar la credencial.');
      console.error(error);
    }
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 p-1">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Título</FormLabel>
              <FormControl>
                <Input placeholder="ej., Cuenta de Google" {...field} className="h-8 text-sm" />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Usuario o Correo</FormLabel>
              <FormControl>
                <Input placeholder="usuario@ejemplo.com" {...field} className="h-8 text-sm" />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">URL (opcional)</FormLabel>
              <FormControl>
                <Input placeholder="https://google.com" {...field} className="h-8 text-sm" />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Contraseña</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Tu contraseña segura" {...field} className="h-8 text-sm" />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <PasswordGenerator onPasswordGenerated={(p) => form.setValue('password', p, { shouldValidate: true })} />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Notas (opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Notas adicionales..." {...field} className="text-sm min-h-[60px]" />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onDone}>Cancelar</Button>
          <Button type="submit" size="sm">{credential ? 'Guardar' : 'Agregar'}</Button>
        </div>
      </form>
    </Form>
  );
}