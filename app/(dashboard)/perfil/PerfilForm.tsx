"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { createClient } from "@/lib/supabase/client"
import { doctorSchema, type DoctorFormData } from "@/lib/validators/doctor"
import type { Doctor } from "@/lib/database.types"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function PerfilForm({ doctor, email }: { doctor: Doctor; email: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)

  const form = useForm<DoctorFormData>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      nombre_completo: doctor.nombre_completo ?? "",
      especialidad: doctor.especialidad ?? "",
      cmp: doctor.cmp ?? "",
      rne: doctor.rne ?? "",
      celular: doctor.celular ?? "",
      horario: doctor.horario ?? "",
      clinica: doctor.clinica ?? "",
    },
  })

  async function onSubmit(values: DoctorFormData) {
    setSaving(true)
    const { error } = await supabase
      .from("doctors")
      .update(values)
      .eq("id", doctor.id)

    if (error) {
      toast.error(`No se pudo guardar: ${error.message}`)
    } else {
      toast.success("Perfil actualizado correctamente")
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos profesionales</CardTitle>
        <p className="text-sm text-muted-foreground">
          Estos datos aparecen en el encabezado y pie de cada receta. Cambios
          futuros no afectan recetas ya emitidas (se guarda un snapshot por receta).
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="nombre_completo"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Nombre completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Dr. Raúl Farfán Samanez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="especialidad"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Especialidad</FormLabel>
                    <FormControl>
                      <Input placeholder="PEDIATRÍA / CIRUGÍA PEDIÁTRICA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cmp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CMP</FormLabel>
                    <FormControl>
                      <Input placeholder="27466" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rne"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RNE</FormLabel>
                    <FormControl>
                      <Input placeholder="17412 / 48994" {...field} />
                    </FormControl>
                    <FormDescription>Opcional</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="celular"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Celular</FormLabel>
                    <FormControl>
                      <Input placeholder="983 653822" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="horario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horario de atención</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Lunes a Sábado: 3:30 p.m a 8:00 p.m"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clinica"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Dirección de la clínica</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder="Clínica Mac Salud 5to piso Consultorio 502 Av. de la Cultura N° 1410 Cusco - Perú"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Sesión: <span className="font-medium">{email}</span>
              </p>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando…" : "Guardar cambios"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
