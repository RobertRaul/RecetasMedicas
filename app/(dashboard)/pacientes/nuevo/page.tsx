import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PacienteForm } from "@/components/pacientes/PacienteForm"

export default function NuevoPacientePage() {
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
        <span>Nuevo</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo paciente</h1>
        <p className="text-sm text-gray-500">
          Solo el nombre es obligatorio. El resto de campos puedes agregarlos
          después.
        </p>
      </div>

      <PacienteForm />
    </div>
  )
}
