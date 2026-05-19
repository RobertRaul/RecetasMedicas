"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"

import { pacienteSchema, type PacienteFormData } from "@/lib/validators/paciente"
import type { Patient } from "@/lib/database.types"
import { crearPaciente, actualizarPaciente } from "@/app/(dashboard)/pacientes/actions"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  paciente?: Patient
  redirectAfterCreate?: string
}

export function PacienteForm({ paciente, redirectAfterCreate = "/pacientes" }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const isEditing = Boolean(paciente)

  const form = useForm<PacienteFormData>({
    resolver: zodResolver(pacienteSchema),
    defaultValues: {
      nombre_completo: paciente?.nombre_completo ?? "",
      dni: paciente?.dni ?? "",
      fecha_nacimiento: paciente?.fecha_nacimiento ?? "",
      telefono: paciente?.telefono ?? "",
      notas: paciente?.notas ?? "",
    },
  })

  async function onSubmit(values: PacienteFormData) {
    setSaving(true)
    const result = isEditing
      ? await actualizarPaciente(paciente!.id, values)
      : await crearPaciente(values)

    if (!result.ok) {
      toast.error(result.error)
      setSaving(false)
      return
    }

    toast.success(isEditing ? "Paciente actualizado" : "Paciente creado")
    if (isEditing) {
      router.push(`/pacientes/${paciente!.id}`)
    } else {
      router.push(redirectAfterCreate)
    }
    router.refresh()
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="nombre_completo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej. María Quispe Mamani"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="dni"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DNI</FormLabel>
                    <FormControl>
                      <Input placeholder="12345678" {...field} />
                    </FormControl>
                    <FormDescription>Opcional</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fecha_nacimiento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de nacimiento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>Opcional</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="984 123 456" {...field} />
                    </FormControl>
                    <FormDescription>Opcional</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notas"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Alergias, antecedentes relevantes, etc."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Opcional</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t pt-4">
              <Link
                href={isEditing ? `/pacientes/${paciente!.id}` : "/pacientes"}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Cancelar
              </Link>
              <Button type="submit" disabled={saving}>
                {saving
                  ? "Guardando…"
                  : isEditing
                  ? "Guardar cambios"
                  : "Crear paciente"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
