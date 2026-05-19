"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { recetaSchema, type RecetaFormData } from "@/lib/validators/receta"
import type { Doctor, DoctorSnapshot } from "@/lib/database.types"

type Result =
  | { ok: true; id: string }
  | { ok: false; error: string }

function emptyToNull(value: string | undefined | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

function buildSnapshot(doctor: Doctor): DoctorSnapshot {
  return {
    nombre_completo: doctor.nombre_completo ?? "",
    especialidad: doctor.especialidad ?? "",
    cmp: doctor.cmp ?? "",
    rne: doctor.rne ?? "",
    celular: doctor.celular ?? "",
    horario: doctor.horario ?? "",
    clinica: doctor.clinica ?? "",
  }
}

export async function crearReceta(values: RecetaFormData): Promise<Result> {
  const parsed = recetaSchema.safeParse(values)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "No autenticado" }

  const { data: doctor, error: doctorErr } = await supabase
    .from("doctors")
    .select("*")
    .eq("id", user.id)
    .single<Doctor>()

  if (doctorErr || !doctor) {
    return {
      ok: false,
      error: "No se encontró tu perfil de médico. Configúralo en /perfil.",
    }
  }

  if (!doctor.nombre_completo || !doctor.cmp || !doctor.clinica) {
    return {
      ok: false,
      error:
        "Tu perfil debe tener al menos nombre, CMP y dirección de la clínica antes de emitir recetas.",
    }
  }

  const snapshot = buildSnapshot(doctor)

  const { data, error } = await supabase
    .from("prescriptions")
    .insert({
      doctor_id: user.id,
      patient_id: parsed.data.patient_id,
      diagnostico: parsed.data.diagnostico.trim(),
      contenido: parsed.data.contenido.trim(),
      fecha_emision: parsed.data.fecha_emision,
      fecha_cita: emptyToNull(parsed.data.fecha_cita),
      doctor_snapshot: snapshot,
    })
    .select("id")
    .single<{ id: string }>()

  if (error || !data) {
    return { ok: false, error: error?.message ?? "No se pudo crear la receta" }
  }

  revalidatePath("/recetas")
  revalidatePath(`/pacientes/${parsed.data.patient_id}`)
  return { ok: true, id: data.id }
}
