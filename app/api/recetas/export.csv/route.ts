/**
 * GET /api/recetas/export.csv
 *
 * Exporta las recetas del médico autenticado como CSV.
 * Acepta los mismos filtros que /recetas:
 *   ?q=texto&paciente=<id>&desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 *
 * El CSV incluye BOM UTF-8 para que Excel lo abra correctamente con acentos.
 */

import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const HEADERS = [
  "id",
  "fecha_emision",
  "fecha_cita",
  "paciente_nombre",
  "paciente_dni",
  "diagnostico",
  "contenido",
  "creada_en",
] as const

type Row = {
  id: string
  diagnostico: string
  contenido: string
  fecha_emision: string
  fecha_cita: string | null
  created_at: string
  patients: { nombre_completo: string; dni: string | null } | null
}

function escapeCSV(value: string | null | undefined): string {
  const v = value ?? ""
  if (/[",\n\r]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`
  }
  return v
}

function buildCSV(rows: Row[]): string {
  const lines: string[] = [HEADERS.join(",")]
  for (const r of rows) {
    const cells = [
      r.id,
      r.fecha_emision,
      r.fecha_cita ?? "",
      r.patients?.nombre_completo ?? "",
      r.patients?.dni ?? "",
      r.diagnostico,
      r.contenido,
      r.created_at,
    ].map(escapeCSV)
    lines.push(cells.join(","))
  }
  return lines.join("\r\n")
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get("q")?.trim() ?? ""
  const pacienteId = url.searchParams.get("paciente") ?? ""
  const desde = url.searchParams.get("desde") ?? ""
  const hasta = url.searchParams.get("hasta") ?? ""

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return new Response("No autorizado", { status: 401 })
  }

  let query = supabase
    .from("prescriptions")
    .select(
      `
      id,
      diagnostico,
      contenido,
      fecha_emision,
      fecha_cita,
      created_at,
      patients ( nombre_completo, dni )
    `
    )
    .eq("doctor_id", user.id)
    .order("fecha_emision", { ascending: false })
    .limit(5000) // tope de seguridad

  if (q) {
    const term = `%${q}%`
    query = query.or(`diagnostico.ilike.${term},contenido.ilike.${term}`)
  }
  if (pacienteId) query = query.eq("patient_id", pacienteId)
  if (desde) query = query.gte("fecha_emision", desde)
  if (hasta) query = query.lte("fecha_emision", hasta)

  const { data, error } = await query.returns<Row[]>()

  if (error) {
    return new Response(`Error: ${error.message}`, { status: 500 })
  }

  // BOM UTF-8 para que Excel detecte la codificación correctamente
  const csv = "﻿" + buildCSV(data ?? [])

  const fechaArchivo = new Date().toISOString().split("T")[0]
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="recetas-${fechaArchivo}.csv"`,
      "Cache-Control": "no-store",
    },
  })
}
