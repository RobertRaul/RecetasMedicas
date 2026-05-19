import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Pencil, FilePlus, FileText, Archive } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import type { Patient } from "@/lib/database.types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Prescription = {
  id: string
  diagnostico: string
  fecha_emision: string
  fecha_cita: string | null
  created_at: string
}

function formatFecha(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
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

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function PacienteDetallePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: paciente, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .single<Patient>()

  if (error || !paciente) notFound()

  const { data: recetas } = await supabase
    .from("prescriptions")
    .select("id, diagnostico, fecha_emision, fecha_cita, created_at")
    .eq("patient_id", id)
    .order("fecha_emision", { ascending: false })
    .limit(50)

  const isArchived = paciente.deleted_at !== null
  const recetasList = (recetas ?? []) as Prescription[]

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link
          href="/pacientes"
          className="inline-flex items-center gap-1 hover:text-gray-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Pacientes
        </Link>
        <span>·</span>
        <span className="text-gray-700">{paciente.nombre_completo}</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {paciente.nombre_completo}
            </h1>
            {isArchived && (
              <Badge variant="secondary" className="gap-1">
                <Archive className="h-3 w-3" />
                Archivado
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Registrado el {formatFecha(paciente.created_at)}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/pacientes/${paciente.id}/editar`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Link>
          {!isArchived && (
            <Link
              href={`/recetas/nueva?paciente=${paciente.id}`}
              className={cn(buttonVariants())}
            >
              <FilePlus className="mr-2 h-4 w-4" />
              Nueva receta
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos del paciente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Field label="DNI" value={paciente.dni} />
            <Field
              label="Fecha de nacimiento"
              value={
                paciente.fecha_nacimiento
                  ? `${formatFecha(paciente.fecha_nacimiento)} (${calcularEdad(paciente.fecha_nacimiento)})`
                  : null
              }
            />
            <Field label="Teléfono" value={paciente.telefono} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            {paciente.notas ? (
              <p className="text-sm whitespace-pre-wrap text-gray-700">
                {paciente.notas}
              </p>
            ) : (
              <p className="text-sm text-gray-400">Sin notas registradas</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Historial de recetas ({recetasList.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recetasList.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-gray-500">
              <FileText className="h-8 w-8 text-gray-300" />
              Este paciente aún no tiene recetas
            </div>
          ) : (
            <ul className="divide-y">
              {recetasList.map((r) => (
                <li key={r.id} className="py-3">
                  <Link
                    href={`/recetas/${r.id}`}
                    className="flex items-start justify-between gap-4 hover:text-blue-700"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{r.diagnostico}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Emitida: {formatFecha(r.fecha_emision)}
                        {r.fecha_cita && (
                          <>
                            {" · "}
                            Cita: {formatFecha(r.fecha_cita)}
                          </>
                        )}
                      </p>
                    </div>
                    <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-3 border-b last:border-b-0 pb-2 last:pb-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 text-right">{value ?? "—"}</span>
    </div>
  )
}
