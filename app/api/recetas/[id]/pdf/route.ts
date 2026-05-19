/**
 * GET /api/recetas/[id]/pdf
 *
 * Genera el PDF A5 de una receta REAL existente en la BD. Se renderiza al
 * vuelo a partir del `doctor_snapshot` guardado en la fila para que recetas
 * viejas mantengan sus datos originales aunque el perfil del médico cambie.
 */

import { createClient } from "@/lib/supabase/server"
import type { DoctorSnapshot } from "@/lib/database.types"
import { generarRecetaPDF } from "@/components/receta/RecetaPDFDocument"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type PrescriptionRow = {
  id: string
  diagnostico: string
  contenido: string
  doctor_snapshot: DoctorSnapshot
  patients: { nombre_completo: string } | null
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return new Response("No autorizado", { status: 401 })
  }

  const { data: receta, error } = await supabase
    .from("prescriptions")
    .select(
      "id, diagnostico, contenido, doctor_snapshot, patients ( nombre_completo )"
    )
    .eq("id", id)
    .single<PrescriptionRow>()

  if (error || !receta) {
    return new Response("Receta no encontrada", { status: 404 })
  }

  const buffer = await generarRecetaPDF({
    doctor: receta.doctor_snapshot,
    paciente_nombre: receta.patients?.nombre_completo ?? "—",
    diagnostico: receta.diagnostico,
    contenido: receta.contenido,
  })

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="receta-${receta.id}.pdf"`,
      "Cache-Control": "no-store",
    },
  })
}
