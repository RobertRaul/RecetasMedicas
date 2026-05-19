import { z } from 'zod'

export const recetaSchema = z.object({
  patient_id: z.string().uuid('Selecciona un paciente válido'),
  diagnostico: z.string().min(2, 'El diagnóstico es requerido').max(500),
  contenido: z.string().min(2, 'El contenido de la receta es requerido'),
  fecha_emision: z.string().min(1, 'La fecha de emisión es requerida'),
  fecha_cita: z.string().optional().or(z.literal('')),
})

export type RecetaFormData = z.infer<typeof recetaSchema>
