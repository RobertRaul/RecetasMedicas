/**
 * Tipos TypeScript del schema de Supabase.
 *
 * Cuando se agreguen migraciones nuevas, mantener estos tipos sincronizados.
 * En el futuro se pueden auto-generar con: `supabase gen types typescript`.
 */

export type DoctorSnapshot = {
  nombre_completo: string
  especialidad: string
  cmp: string
  rne: string
  celular: string
  horario: string
  clinica: string
}

export type Doctor = {
  id: string
  nombre_completo: string | null
  especialidad: string | null
  cmp: string | null
  rne: string | null
  celular: string | null
  horario: string | null
  clinica: string | null
  created_at: string
  updated_at: string
}

export type DoctorUpdate = Partial<Omit<Doctor, "id" | "created_at" | "updated_at">>

export type Patient = {
  id: string
  doctor_id: string
  nombre_completo: string
  dni: string | null
  fecha_nacimiento: string | null
  telefono: string | null
  notas: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type PatientInsert = Omit<Patient, "id" | "created_at" | "updated_at" | "deleted_at">
export type PatientUpdate = Partial<Omit<PatientInsert, "doctor_id">>

export type Prescription = {
  id: string
  doctor_id: string
  patient_id: string
  diagnostico: string
  contenido: string
  fecha_emision: string
  fecha_cita: string | null
  doctor_snapshot: DoctorSnapshot
  created_at: string
}

export type PrescriptionInsert = Omit<Prescription, "id" | "created_at">

// Relación expandida (para queries con joins)
export type PrescriptionWithRelations = Prescription & {
  patients: Patient | null
  doctors: Doctor | null
}
