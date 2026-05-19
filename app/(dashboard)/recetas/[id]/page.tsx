import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, User, FilePlus } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import type { DoctorSnapshot } from "@/lib/database.types"
import {
  RecetaPreview,
  type RecetaPreviewData,
} from "@/components/receta/RecetaPreview"
import { ImprimirMenu } from "@/components/receta/ImprimirMenu"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

type PrescriptionDetail = {
  id: string
  diagnostico: string
  contenido: string
  fecha_emision: string
  fecha_cita: string | null
  created_at: string
  doctor_snapshot: DoctorSnapshot
  patients: {
    id: string
    nombre_completo: string
    dni: string | null
  } | null
}

function formatFecha(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value))
}

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function RecetaDetallePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: receta, error } = await supabase
    .from("prescriptions")
    .select(
      `
      id,
      diagnostico,
      contenido,
      fecha_emision,
      fecha_cita,
      created_at,
      doctor_snapshot,
      patients ( id, nombre_completo, dni )
    `
    )
    .eq("id", id)
    .single<PrescriptionDetail>()

  if (error || !receta) notFound()

  const previewData: RecetaPreviewData = {
    doctor: receta.doctor_snapshot,
    paciente_nombre: receta.patients?.nombre_completo ?? "—",
    diagnostico: receta.diagnostico,
    contenido: receta.contenido,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link
          href="/recetas"
          className="inline-flex items-center gap-1 hover:text-gray-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Recetas
        </Link>
        <span>·</span>
        <span className="text-gray-700">
          {receta.patients?.nombre_completo ?? "Paciente eliminado"}
        </span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Receta para{" "}
            <span className="text-blue-900">
              {receta.patients?.nombre_completo ?? "—"}
            </span>
          </h1>
          <p className="text-sm text-gray-500">
            Emitida el {formatFecha(receta.fecha_emision)}
            {receta.fecha_cita && (
              <> · Cita: {formatFecha(receta.fecha_cita)}</>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {receta.patients && (
            <Link
              href={`/pacientes/${receta.patients.id}`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <User className="mr-2 h-4 w-4" />
              Ver paciente
            </Link>
          )}
          <Link
            href={
              receta.patients
                ? `/recetas/nueva?paciente=${receta.patients.id}`
                : "/recetas/nueva"
            }
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <FilePlus className="mr-2 h-4 w-4" />
            Nueva receta
          </Link>
          <ImprimirMenu baseUrl={`/api/recetas/${receta.id}/pdf`} />
        </div>
      </div>

      {/* Vista previa A5 */}
      <div className="overflow-x-auto rounded-lg bg-slate-100 p-6">
        <RecetaPreview data={previewData} />
      </div>

      {/* Metadatos */}
      <Card>
        <CardContent className="pt-6">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <DataRow
              label="Diagnóstico"
              value={receta.diagnostico}
            />
            <DataRow
              label="Paciente"
              value={
                receta.patients
                  ? `${receta.patients.nombre_completo}${
                      receta.patients.dni ? ` · DNI ${receta.patients.dni}` : ""
                    }`
                  : "Paciente eliminado"
              }
            />
            <DataRow
              label="Fecha de emisión"
              value={formatFecha(receta.fecha_emision)}
            />
            <DataRow
              label="Fecha de cita"
              value={receta.fecha_cita ? formatFecha(receta.fecha_cita) : "—"}
            />
            <DataRow
              label="Médico"
              value={receta.doctor_snapshot.nombre_completo}
            />
            <DataRow
              label="CMP en la receta"
              value={receta.doctor_snapshot.cmp}
            />
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b pb-2 last:border-b-0 last:pb-0">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-medium text-gray-900">{value}</dd>
    </div>
  )
}
