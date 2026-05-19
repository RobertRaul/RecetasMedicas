import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"

export default function PacientesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-sm text-gray-500">Gestiona tu lista de pacientes</p>
        </div>
        <Link href="/pacientes/nuevo" className={cn(buttonVariants())}>
          <UserPlus className="mr-2 h-4 w-4" />
          Nuevo paciente
        </Link>
      </div>
      <p className="text-gray-400 text-sm">
        (En construcción — Fase 3)
      </p>
    </div>
  )
}
