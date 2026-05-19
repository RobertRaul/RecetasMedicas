import { z } from 'zod'

export const pacienteSchema = z.object({
  nombre_completo: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(120),
  dni: z.string().max(20).optional().or(z.literal('')),
  fecha_nacimiento: z.string().optional().or(z.literal('')),
  telefono: z.string().max(20).optional().or(z.literal('')),
  notas: z.string().max(500).optional().or(z.literal('')),
})

export type PacienteFormData = z.infer<typeof pacienteSchema>
