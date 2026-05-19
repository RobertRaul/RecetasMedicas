import Link from "next/link"
import { ArrowLeft, Info } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import type { Doctor, DoctorSnapshot } from "@/lib/database.types"
import {
  RecetaPreview,
  type RecetaPreviewData,
} from "@/components/receta/RecetaPreview"
import { ImprimirMenu } from "@/components/receta/ImprimirMenu"
import { Alert, AlertDescription } from "@/components/ui/alert"

function toSnapshot(d: Doctor): DoctorSnapshot {
  return {
    nombre_completo: d.nombre_completo ?? "Dr. (sin nombre)",
    especialidad: d.especialidad ?? "ESPECIALIDAD",
    cmp: d.cmp ?? "—",
    rne: d.rne ?? "",
    celular: d.celular ?? "",
    horario: d.horario ?? "",
    clinica: d.clinica ?? "",
  }
}

const CONTENIDO_DEMO = `Amoxicilina 500 mg
1 tableta cada 8 horas por 7 días

Paracetamol 500 mg
1 tableta cada 6 horas en caso de fiebre o dolor

Indicaciones:
- Reposo relativo.
- Abundantes líquidos.
- Control en 7 días.`

export default async function PreviewRecetaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: doctor } = await supabase
    .from("doctors")
    .select("*")
    .eq("id", user!.id)
    .single<Doctor>()

  const doctorSnapshot: DoctorSnapshot = doctor
    ? toSnapshot(doctor)
    : {
        nombre_completo: "Dr. Raúl Farfán Samanez",
        especialidad: "PEDIATRÍA / CIRUGÍA PEDIÁTRICA",
        cmp: "27466",
        rne: "17412 / 48994",
        celular: "983 653822",
        horario: "Lunes a Sábado: 3:30 p.m a 8:00 p.m",
        clinica:
          "Clínica Mac Salud 5to piso Consultorio 502 Av. de la Cultura N° 1410 Cusco - Perú",
      }

  const data: RecetaPreviewData = {
    doctor: doctorSnapshot,
    paciente_nombre: "María Quispe Mamani",
    diagnostico: "Faringitis aguda",
    contenido: CONTENIDO_DEMO,
    fecha_emision: new Date(),
    fecha_cita: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  }

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
        <span>Vista previa del template</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Vista previa de la receta
          </h1>
          <p className="text-sm text-gray-500">
            Demo del template con datos de ejemplo. Sirve para verificar el
            diseño antes de imprimir una receta real.
          </p>
        </div>
        <ImprimirMenu baseUrl="/api/recetas/preview/pdf" />
      </div>

      {perfilIncompleto && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Tu perfil está incompleto. Algunos campos del encabezado mostrarán
            placeholders.{" "}
            <Link href="/perfil" className="underline font-medium">
              Completa tu perfil aquí
            </Link>
            .
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-slate-200 -mx-6 px-6 py-10 overflow-x-auto">
        <RecetaPreview data={data} />
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p>
          <strong>Notas sobre el diseño:</strong>
        </p>
        <ul className="list-disc list-inside space-y-0.5 pl-2">
          <li>Tamaño físico: 148&nbsp;mm × 210&nbsp;mm (A5 portrait).</li>
          <li>
            Las dos ilustraciones laterales están en{" "}
            <code>public/encabezado/</code>. Si quieres reemplazarlas por
            versiones vectorizadas/limpias, sustituye los archivos con los
            mismos nombres.
          </li>
          <li>
            El nombre del médico usa la fuente Google <em>Great Vibes</em>.
          </li>
          <li>
            Este mismo template se renderiza en el PDF on-demand (Fase 5).
          </li>
        </ul>
      </div>
    </div>
  )
}
