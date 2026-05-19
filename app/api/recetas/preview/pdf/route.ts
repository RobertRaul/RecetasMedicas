/**
 * GET /api/recetas/preview/pdf
 *
 * Genera un PDF A5 de DEMO usando los datos del médico autenticado + datos
 * de paciente/contenido inventados. Sirve para validar visualmente el
 * template antes de tener recetas reales.
 */

import { createClient } from "@/lib/supabase/server"
import type { Doctor, DoctorSnapshot } from "@/lib/database.types"
import { generarRecetaPDF } from "@/components/receta/RecetaPDFDocument"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const CONTENIDO_DEMO = `Amoxicilina 500 mg
1 tableta cada 8 horas por 7 días

Paracetamol 500 mg
1 tableta cada 6 horas en caso de fiebre o dolor

Indicaciones:
- Reposo relativo.
- Abundantes líquidos.
- Control en 7 días.`

const DOCTOR_FALLBACK: DoctorSnapshot = {
  nombre_completo: "Dr. Raúl Farfán Samanez",
  especialidad: "PEDIATRÍA / CIRUGÍA PEDIÁTRICA",
  cmp: "27466",
  rne: "17412 / 48994",
  celular: "983 653822",
  horario: "Lunes a Sábado: 3:30 p.m a 8:00 p.m",
  clinica:
    "Clínica Mac Salud 5to piso Consultorio 502 Av. de la Cultura N° 1410 Cusco - Perú",
}

function toSnapshot(d: Doctor | null): DoctorSnapshot {
  if (!d) return DOCTOR_FALLBACK
  return {
    nombre_completo: d.nombre_completo ?? DOCTOR_FALLBACK.nombre_completo,
    especialidad: d.especialidad ?? DOCTOR_FALLBACK.especialidad,
    cmp: d.cmp ?? DOCTOR_FALLBACK.cmp,
    rne: d.rne ?? "",
    celular: d.celular ?? "",
    horario: d.horario ?? DOCTOR_FALLBACK.horario,
    clinica: d.clinica ?? DOCTOR_FALLBACK.clinica,
  }
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Response("No autorizado", { status: 401 })
  }

  const { data: doctor } = await supabase
    .from("doctors")
    .select("*")
    .eq("id", user.id)
    .single<Doctor>()

  const buffer = await generarRecetaPDF({
    doctor: toSnapshot(doctor),
    paciente_nombre: "María Quispe Mamani",
    diagnostico: "Faringitis aguda",
    contenido: CONTENIDO_DEMO,
  })

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="receta-preview.pdf"',
      "Cache-Control": "no-store",
    },
  })
}
