import { z } from "zod"

export const doctorSchema = z.object({
  nombre_completo: z
    .string()
    .min(3, "El nombre completo es requerido")
    .max(120),
  especialidad: z
    .string()
    .min(2, "La especialidad es requerida")
    .max(120),
  cmp: z.string().min(1, "El CMP es requerido").max(20),
  rne: z.string().max(40).optional().or(z.literal("")),
  celular: z.string().min(6, "El celular es requerido").max(20),
  horario: z.string().min(3, "El horario es requerido").max(200),
  clinica: z
    .string()
    .min(5, "La dirección de la clínica es requerida")
    .max(300),
})

export type DoctorFormData = z.infer<typeof doctorSchema>
