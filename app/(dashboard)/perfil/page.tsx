import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Doctor } from "@/lib/database.types"
import { PerfilForm } from "./PerfilForm"

export default async function PerfilPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: doctor, error } = await supabase
    .from("doctors")
    .select("*")
    .eq("id", user.id)
    .single<Doctor>()

  if (error || !doctor) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-sm text-destructive">
          No se encontró tu ficha de médico. Contacta al administrador para que
          revise tu cuenta.
        </p>
        <p className="text-xs text-muted-foreground">
          Detalle técnico: {error?.message ?? "fila inexistente"}
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-sm text-gray-500">
          Datos que aparecen en el encabezado de cada receta
        </p>
      </div>
      <PerfilForm doctor={doctor} email={user.email ?? ""} />
    </div>
  )
}
