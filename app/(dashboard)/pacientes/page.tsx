import Link from "next/link"
import { UserPlus, Users } from "lucide-react"

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
import { SearchBar } from "@/components/shared/SearchBar"
import { PacienteRowActions } from "@/components/pacientes/PacienteRowActions"

const PAGE_SIZE = 20

function formatFecha(value: string | null) {
  if (!value) return "—"
  const d = new Date(value)
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d)
}

function calcularEdad(fechaNacimiento: string | null): string {
  if (!fechaNacimiento) return "—"
  const nac = new Date(fechaNacimiento)
  const hoy = new Date()
  let edad = hoy.getFullYear() - nac.getFullYear()
  const m = hoy.getMonth() - nac.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
  return edad >= 0 ? `${edad} años` : "—"
}

type SearchParams = Promise<{ q?: string; page?: string }>

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { q = "", page = "1" } = await searchParams
  const pageNum = Math.max(1, parseInt(page, 10) || 1)
  const from = (pageNum - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()

  let query = supabase
    .from("patients")
    .select("id, nombre_completo, dni, fecha_nacimiento, telefono, created_at", {
      count: "exact",
    })
    .is("deleted_at", null)
    .order("nombre_completo", { ascending: true })
    .range(from, to)

  if (q.trim()) {
    const term = `%${q.trim()}%`
    query = query.or(`nombre_completo.ilike.${term},dni.ilike.${term}`)
  }

  const { data: pacientes, count, error } = await query

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const hasPrev = pageNum > 1
  const hasNext = pageNum < totalPages

  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (p > 1) params.set("page", String(p))
    const qs = params.toString()
    return qs ? `/pacientes?${qs}` : "/pacientes"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-sm text-gray-500">
            {total} {total === 1 ? "paciente activo" : "pacientes activos"}
          </p>
        </div>
        <Link
          href="/pacientes/nuevo"
          className={cn(buttonVariants())}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Nuevo paciente
        </Link>
      </div>

      <div className="max-w-md">
        <SearchBar placeholder="Buscar por nombre o DNI…" />
      </div>

      <Card>
        <CardContent className="p-0">
          {error && (
            <div className="p-6 text-sm text-destructive">
              Error al cargar pacientes: {error.message}
            </div>
          )}

          {!error && (!pacientes || pacientes.length === 0) ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <Users className="h-10 w-10 text-gray-300" />
              {q ? (
                <>
                  <p className="text-sm text-gray-500">
                    No se encontraron pacientes para “{q}”
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-500">
                    Aún no tienes pacientes registrados
                  </p>
                  <Link
                    href="/pacientes/nuevo"
                    className={cn(buttonVariants({ size: "sm" }))}
                  >
                    Crear el primero
                  </Link>
                </>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Edad</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Registrado</TableHead>
                  <TableHead className="w-12 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pacientes?.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/pacientes/${p.id}`}
                        className="hover:text-blue-700 hover:underline"
                      >
                        {p.nombre_completo}
                      </Link>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {p.dni ?? "—"}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {calcularEdad(p.fecha_nacimiento)}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {p.telefono ?? "—"}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {formatFecha(p.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <PacienteRowActions
                        pacienteId={p.id}
                        nombre={p.nombre_completo}
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
