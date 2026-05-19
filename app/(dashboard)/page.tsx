import { createClient } from "@/lib/supabase/server"
import { FileText, Users, CalendarDays } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ count: totalPacientes }, { count: totalRecetas }] =
    await Promise.all([
      supabase
        .from("patients")
        .select("*", { count: "exact", head: true })
        .eq("doctor_id", user!.id),
      supabase
        .from("prescriptions")
        .select("*", { count: "exact", head: true })
        .eq("doctor_id", user!.id),
    ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inicio</h1>
        <p className="text-gray-500 text-sm">
          Bienvenido al sistema de recetas médicas
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Pacientes registrados
            </CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalPacientes ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Recetas emitidas
            </CardTitle>
            <FileText className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalRecetas ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Fecha de hoy
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {new Date().toLocaleDateString("es-PE", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Link href="/recetas/nueva" className={cn(buttonVariants())}>
          Nueva receta
        </Link>
        <Link href="/pacientes/nuevo" className={cn(buttonVariants({ variant: "outline" }))}>
          Nuevo paciente
        </Link>
      </div>
    </div>
  )
}
