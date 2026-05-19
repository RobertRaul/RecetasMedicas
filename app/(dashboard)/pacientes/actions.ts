"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { pacienteSchema, type PacienteFormData } from "@/lib/validators/paciente"

type ActionResult = { ok: true } | { ok: false; error: string }

function emptyToNull(value: string | undefined | null) {
  if (value === undefined || value === null) return null
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

export async function crearPaciente(values: PacienteFormData): Promise<ActionResult> {
  const parsed = pacienteSchema.safeParse(values)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "No autenticado" }

  const { error } = await supabase.from("patients").insert({
    doctor_id: user.id,
    nombre_completo: parsed.data.nombre_completo.trim(),
    dni: emptyToNull(parsed.data.dni),
    fecha_nacimiento: emptyToNull(parsed.data.fecha_nacimiento),
    telefono: emptyToNull(parsed.data.telefono),
    notas: emptyToNull(parsed.data.notas),
  })

  if (error) return { ok: false, error: error.message }

  revalidatePath("/pacientes")
  return { ok: true }
}

export async function actualizarPaciente(
  id: string,
  values: PacienteFormData
): Promise<ActionResult> {
  const parsed = pacienteSchema.safeParse(values)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "No autenticado" }

  const { error } = await supabase
    .from("patients")
    .update({
      nombre_completo: parsed.data.nombre_completo.trim(),
      dni: emptyToNull(parsed.data.dni),
      fecha_nacimiento: emptyToNull(parsed.data.fecha_nacimiento),
      telefono: emptyToNull(parsed.data.telefono),
      notas: emptyToNull(parsed.data.notas),
    })
    .eq("id", id)
    .eq("doctor_id", user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath("/pacientes")
  revalidatePath(`/pacientes/${id}`)
  return { ok: true }
}

export async function archivarPaciente(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "No autenticado" }

  const { error } = await supabase
    .from("patients")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("doctor_id", user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath("/pacientes")
  return { ok: true }
}

export async function restaurarPaciente(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "No autenticado" }

  const { error } = await supabase
    .from("patients")
    .update({ deleted_at: null })
    .eq("id", id)
    .eq("doctor_id", user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath("/pacientes")
  revalidatePath(`/pacientes/${id}`)
  return { ok: true }
}

export async function crearPacienteYRedirigir(values: PacienteFormData) {
  const result = await crearPaciente(values)
  if (result.ok) redirect("/pacientes")
  return result
}
