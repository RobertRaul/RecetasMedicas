import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import type { Patient } from "@/lib/database.types"
import { PacienteForm } from "@/components/pacientes/PacienteForm"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EditarPacientePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: paciente, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .single<Patient>()

  if (error || !paciente) notFound()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link
          href="/pacientes"
          className="inline-flex items-center gap-1 hover:text-gray-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Pacientes
        </Link>
        <span>·</span>
        <Link
          href={`/pacientes/${paciente.id}`}
          className="hover:text-gray-900"
        >
          {paciente.nombre_completo}
        </Link>
        <span>·</span>
        <span>Editar</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Editar paciente</h1>
      </div>

      <PacienteForm paciente={paciente} />
    </div>
  )
}
