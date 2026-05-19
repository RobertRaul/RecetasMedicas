import Link from "next/link"
import { FilePlus, FileText, Eye, Download } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RecetasFilters } from "@/components/recetas/RecetasFilters"
import { RecetaRowActions } from "@/components/recetas/RecetaRowActions"
import type { PacienteLite } from "@/components/recetas/PacienteSelector"

const PAGE_SIZE = 20

function formatFecha(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

function truncate(text: string, max = 80): string {
  if (text.length <= max) return text
  return text.slice(0, max).trimEnd() + "…"
}

type SearchParams = Promise<{
  q?: string
  paciente?: string
  desde?: string
  hasta?: string
  page?: string
}>

type RecetaRow = {
  id: string
  diagnostico: string
  contenido: string
  fecha_emision: string
  fecha_cita: string | null
  created_at: string
  patients: {
    id: string
    nombre_completo: string
  } | null
}

export default async function RecetasPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const q = params.q?.trim() ?? ""
  const pacienteId = params.paciente ?? ""
  const desde = params.desde ?? ""
  const hasta = params.hasta ?? ""
  const pageNum = Math.max(1, parseInt(params.page ?? "1", 10) || 1)
  const from = (pageNum - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Cargar pacientes (para el dropdown de filtro)
  const { data: pacientesData } = await supabase
    .from("patients")
    .select("id, nombre_completo, dni")
    .eq("doctor_id", user!.id)
    .is("deleted_at", null)
    .order("nombre_completo", { ascending: true })
    .returns<PacienteLite[]>()
  const pacientes = pacientesData ?? []

  // Query con filtros
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
      patients ( id, nombre_completo )
    `,
      { count: "exact" }
    )
    .eq("doctor_id", user!.id)
    .order("fecha_emision", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (q) {
    const term = `%${q}%`
    query = query.or(
      `diagnostico.ilike.${term},contenido.ilike.${term}`
    )
  }
  if (pacienteId) {
    query = query.eq("patient_id", pacienteId)
  }
  if (desde) {
    query = query.gte("fecha_emision", desde)
  }
  if (hasta) {
    query = query.lte("fecha_emision", hasta)
  }

  const { data, count, error } = await query.returns<RecetaRow[]>()
  const recetas = data ?? []
  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const hasPrev = pageNum > 1
  const hasNext = pageNum < totalPages

  function pageUrl(p: number) {
    const sp = new URLSearchParams()
    if (q) sp.set("q", q)
    if (pacienteId) sp.set("paciente", pacienteId)
    if (desde) sp.set("desde", desde)
    if (hasta) sp.set("hasta", hasta)
    if (p > 1) sp.set("page", String(p))
    const qs = sp.toString()
    return qs ? `/recetas?${qs}` : "/recetas"
  }

  // URL del export CSV con los filtros actuales
  function exportUrl() {
    const sp = new URLSearchParams()
    if (q) sp.set("q", q)
    if (pacienteId) sp.set("paciente", pacienteId)
    if (desde) sp.set("desde", desde)
    if (hasta) sp.set("hasta", hasta)
    const qs = sp.toString()
    return qs ? `/api/recetas/export.csv?${qs}` : "/api/recetas/export.csv"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recetas</h1>
          <p className="text-sm text-gray-500">
            {total} {total === 1 ? "receta" : "recetas"} encontradas
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/recetas/preview"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <Eye className="mr-2 h-4 w-4" />
            Vista previa
          </Link>
          <a
            href={exportUrl()}
            className={cn(
              buttonVariants({ variant: "outline" }),
              total === 0 && "pointer-events-none opacity-50"
            )}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </a>
          <Link href="/recetas/nueva" className={cn(buttonVariants())}>
            <FilePlus className="mr-2 h-4 w-4" />
            Nueva receta
          </Link>
        </div>
      </div>

      <RecetasFilters pacientes={pacientes} />

      <Card>
        <CardContent className="p-0">
          {error && (
            <div className="p-6 text-sm text-destructive">
              Error: {error.message}
            </div>
          )}

          {!error && recetas.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <FileText className="h-10 w-10 text-gray-300" />
              {q || pacienteId || desde || hasta ? (
                <p className="text-sm text-gray-500">
                  No se encontraron recetas con los filtros aplicados.
                </p>
              ) : (
                <>
                  <p className="text-sm text-gray-500">
                    Aún no has emitido recetas.
                  </p>
                  <Link
                    href="/recetas/nueva"
                    className={cn(buttonVariants({ size: "sm" }))}
                  >
                    Crear la primera
                  </Link>
                </>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Fecha</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Diagnóstico</TableHead>
                  <TableHead className="w-28">Cita</TableHead>
                  <TableHead className="w-12 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recetas.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-gray-600">
                      <Link
                        href={`/recetas/${r.id}`}
                        className="hover:text-blue-700 hover:underline"
                      >
                        {formatFecha(r.fecha_emision)}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">
                      {r.patients ? (
                        <Link
                          href={`/pacientes/${r.patients.id}`}
                          className="hover:text-blue-700 hover:underline"
                        >
                          {r.patients.nombre_completo}
                        </Link>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/recetas/${r.id}`}
                        className="text-gray-700 hover:text-blue-700"
                      >
                        {truncate(r.diagnostico)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {r.fecha_cita ? formatFecha(r.fecha_cita) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <RecetaRowActions
                        recetaId={r.id}
                        pacienteId={r.patients?.id ?? null}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-500">
            Página {pageNum} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Link
              href={hasPrev ? pageUrl(pageNum - 1) : "#"}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                !hasPrev && "pointer-events-none opacity-50"
              )}
              aria-disabled={!hasPrev}
            >
              Anterior
            </Link>
            <Link
              href={hasNext ? pageUrl(pageNum + 1) : "#"}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                !hasNext && "pointer-events-none opacity-50"
              )}
              aria-disabled={!hasNext}
            >
              Siguiente
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
