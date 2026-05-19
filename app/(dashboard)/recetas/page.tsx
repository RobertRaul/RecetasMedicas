import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { FilePlus } from "lucide-react"
import { cn } from "@/lib/utils"

export default function RecetasPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recetas</h1>
          <p className="text-sm text-gray-500">Historial de recetas emitidas</p>
        </div>
        <Link href="/recetas/nueva" className={cn(buttonVariants())}>
          <FilePlus className="mr-2 h-4 w-4" />
          Nueva receta
        </Link>
      </div>
      <p className="text-gray-400 text-sm">(En construcción — Fase 6 y 8)</p>
    </div>
  )
}
