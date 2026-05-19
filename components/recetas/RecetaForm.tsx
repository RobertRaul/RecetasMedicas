"use client"

import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"

import { recetaSchema, type RecetaFormData } from "@/lib/validators/receta"
import type { DoctorSnapshot } from "@/lib/database.types"
import { crearReceta } from "@/app/(dashboard)/recetas/actions"
import {
  RecetaPreview,
  type RecetaPreviewData,
} from "@/components/receta/RecetaPreview"
import {
  PacienteSelector,
  type PacienteLite,
} from "@/components/recetas/PacienteSelector"

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
import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const PLACEHOLDER_CONTENIDO = `Ejemplo:

Amoxicilina 500 mg
1 tableta cada 8 horas por 7 días

Paracetamol 500 mg
1 tableta cada 6 horas en caso de fiebre o dolor

Indicaciones:
- Reposo relativo.
- Abundantes líquidos.
- Control en 7 días.`

function todayISO(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

type Props = {
  doctorSnapshot: DoctorSnapshot
  pacientes: PacienteLite[]
  initialPacienteId?: string
}

export function RecetaForm({
  doctorSnapshot,
  pacientes,
  initialPacienteId,
}: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const form = useForm<RecetaFormData>({
    resolver: zodResolver(recetaSchema),
    defaultValues: {
      patient_id: initialPacienteId ?? "",
      diagnostico: "",
      contenido: "",
      fecha_emision: todayISO(),
      fecha_cita: "",
    },
  })

  const watched = form.watch()
  const selectedPaciente = pacientes.find((p) => p.id === watched.patient_id)

  const previewData = useMemo<RecetaPreviewData>(
    () => ({
      doctor: doctorSnapshot,
      paciente_nombre: selectedPaciente?.nombre_completo ?? "",
      diagnostico: watched.diagnostico,
      contenido: watched.contenido || " ",
    }),
    [
      doctorSnapshot,
      selectedPaciente,
      watched.diagnostico,
      watched.contenido,
    ]
  )

  async function onSubmit(values: RecetaFormData) {
    setSaving(true)
    const result = await crearReceta(values)
    if (!result.ok) {
      toast.error(result.error)
      setSaving(false)
      return
    }
    toast.success("Receta creada correctamente")
    router.push(`/recetas/${result.id}`)
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(380px,440px)_1fr]">
      {/* ============== FORMULARIO ============== */}
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5"
            >
              <FormField
                control={form.control}
                name="patient_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paciente *</FormLabel>
                    <FormControl>
                      <PacienteSelector
                        pacientes={pacientes}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="diagnostico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diagnóstico *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej. Faringitis aguda"
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contenido"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contenido de la receta *</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={12}
                        placeholder={PLACEHOLDER_CONTENIDO}
                        className="font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Medicamentos, posología e indicaciones. Los saltos de
                      línea se preservan en el PDF.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="fecha_emision"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de emisión *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>Para el sistema</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fecha_cita"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de cita</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>Opcional</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t pt-4">
                <Link
                  href="/recetas"
                  className={cn(buttonVariants({ variant: "outline" }))}
                >
                  Cancelar
                </Link>
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando…" : "Crear receta"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* ============== PREVIEW EN VIVO ============== */}
      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">
          Vista previa en vivo
        </p>
        <div className="overflow-x-auto rounded-lg bg-slate-100 p-4">
          <RecetaPreview data={previewData} />
        </div>
      </div>
    </div>
  )
}
