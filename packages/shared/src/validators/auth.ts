import * as z from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Correo electronico invalido'),
  password: z.string().min(1, 'La contrasena es requerida'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
