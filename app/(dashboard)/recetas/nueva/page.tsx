import Link from "next/link"
import { ArrowLeft, AlertTriangle } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import type { Doctor, DoctorSnapshot } from "@/lib/database.types"
import { RecetaForm } from "@/components/recetas/RecetaForm"
import type { PacienteLite } from "@/components/recetas/PacienteSelector"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type SearchParams = Promise<{ paciente?: string }>

function buildSnapshot(d: Doctor): DoctorSnapshot {
  return {
    nombre_completo: d.nombre_completo ?? "",
    especialidad: d.especialidad ?? "",
    cmp: d.cmp ?? "",
    rne: d.rne ?? "",
    celular: d.celular ?? "",
    horario: d.horario ?? "",
    clinica: d.clinica ?? "",
  }
}

export default async function NuevaRecetaPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { paciente: initialPacienteId } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: doctor }, { data: pacientes }] = await Promise.all([
    supabase.from("doctors").select("*").eq("id", user!.id).single<Doctor>(),
    supabase
      .from("patients")
      .select("id, nombre_completo, dni")
      .eq("doctor_id", user!.id)
      .is("deleted_at", null)
      .order("nombre_completo", { ascending: true })
      .returns<PacienteLite[]>(),
  ])

  const perfilIncompleto =
    !doctor?.nombre_completo || !doctor?.cmp || !doctor?.clinica

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
        <span>Nueva</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nueva receta</h1>
        <p className="text-sm text-gray-500">
          Selecciona un paciente y escribe el diagnóstico y el contenido. La
          vista previa se actualiza a medida que escribes.
        </p>
      </div>

      {perfilIncompleto && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Perfil incompleto</AlertTitle>
          <AlertDescription>
            Para emitir recetas necesitas tener al menos tu nombre, CMP y
            dirección de la clínica en{" "}
            <Link href="/perfil" className="underline font-medium">
              tu perfil
            </Link>
            .
          </AlertDescription>
        </Alert>
      )}

      {(pacientes ?? []).length === 0 ? (
        <Alert>
          <AlertTitle>Aún no tienes pacientes</AlertTitle>
          <AlertDescription>
            Primero{" "}
            <Link href="/pacientes/nuevo" className="underline font-medium">
              crea un paciente
            </Link>{" "}
            para poder emitir su receta.
          </AlertDescription>
        </Alert>
      ) : (
        <RecetaForm
          doctorSnapshot={doctor ? buildSnapshot(doctor) : buildSnapshot({} as Doctor)}
          pacientes={pacientes ?? []}
          initialPacienteId={initialPacienteId}
        />
      )}
    </div>
  )
}
