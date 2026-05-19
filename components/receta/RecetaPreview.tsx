/**
 * RecetaPreview — Vista HTML del template A5 de la receta.
 *
 * Replica fielmente la receta impresa del Dr. Farfán:
 *   - Encabezado: imágenes laterales + nombre cursivo + credenciales
 *   - Barra de ATENCIÓN con borde inferior azul (ancho completo)
 *   - Cuerpo: Nombre y Diagnóstico con líneas punteadas, espacio amplio
 *   - Pie: Fecha y Cita en blanco (el médico las escribe a mano) + dirección
 *
 * Tamaño físico: 148mm × 210mm (A5 portrait).
 */

import Image from "next/image"
import type { DoctorSnapshot } from "@/lib/database.types"

const BLUE = "#1e40af"

export type RecetaPreviewData = {
  doctor: DoctorSnapshot
  paciente_nombre: string
  diagnostico: string
  contenido: string
  // Las siguientes se aceptan por compatibilidad con la API, pero la receta
  // impresa siempre deja el espacio en blanco para que el médico escriba.
  fecha_emision?: string | Date
  fecha_cita?: string | Date | null
}

export function RecetaPreview({ data }: { data: RecetaPreviewData }) {
  const { doctor, paciente_nombre, diagnostico, contenido } = data

  return (
    <div
      data-receta-preview
      className="bg-white shadow-lg ring-1 ring-slate-200 mx-auto flex flex-col"
      style={{
        width: "148mm",
        minHeight: "210mm",
        padding: "6mm 8mm 5mm",
        fontFamily: "var(--font-sans)",
        color: "#0f172a",
      }}
    >
      {/* ============================================================
          ENCABEZADO
          ============================================================ */}
      <header>
        <div
          className="grid items-center"
          style={{
            gridTemplateColumns: "23mm minmax(0, 1fr) 23mm",
            columnGap: "1mm",
          }}
        >
          {/* Ilustración izquierda */}
          <div style={{ position: "relative", width: "23mm", height: "27mm" }}>
            <Image
              src="/encabezado/medico-izquierda.png"
              alt=""
              fill
              sizes="25mm"
              style={{ objectFit: "contain" }}
              priority
            />
          </div>

          {/* Texto central */}
          <div
            className="text-center"
            style={{ color: BLUE, minWidth: 0, overflow: "hidden" }}
          >
            <h1
              className="leading-[0.95]"
              style={{
                fontFamily: "var(--font-cursive)",
                fontSize: "26pt",
                fontWeight: 400,
                whiteSpace: "nowrap",
              }}
            >
              {doctor.nombre_completo}
            </h1>

            <p
              className="font-bold tracking-wide"
              style={{ fontSize: "10.5pt", marginTop: "0.5mm" }}
            >
              MÉDICO ESPECIALISTA
            </p>
            <p
              className="font-bold tracking-wide"
              style={{ fontSize: "10.5pt", lineHeight: 1.1 }}
            >
              {doctor.especialidad}
            </p>

            <p style={{ fontSize: "10pt", marginTop: "0.5mm" }}>
              <strong>CMP N°</strong>{" "}
              <span className="font-bold underline underline-offset-2">
                {doctor.cmp}
              </span>
              {doctor.rne && (
                <>
                  {" "}
                  / <strong>RNE N°</strong>{" "}
                  <span className="font-bold underline underline-offset-2">
                    {doctor.rne}
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Ilustración derecha (espejo) */}
          <div style={{ position: "relative", width: "23mm", height: "27mm" }}>
            <Image
              src="/encabezado/medico-derecha.png"
              alt=""
              fill
              sizes="25mm"
              style={{ objectFit: "contain" }}
              priority
            />
          </div>
        </div>

        {/* Barra ATENCIÓN ancho completo con borde inferior */}
        <div
          className="text-center whitespace-nowrap"
          style={{
            color: BLUE,
            borderBottom: `1.5px solid ${BLUE}`,
            paddingTop: "1.5mm",
            paddingBottom: "1.5mm",
            marginTop: "1mm",
            fontSize: "10.5pt",
          }}
        >
          <strong>ATENCIÓN:</strong> {doctor.horario}
          {doctor.celular && (
            <>
              {"   "}
              <strong>Cel.:</strong> {doctor.celular}
            </>
          )}
        </div>
      </header>

      {/* ============================================================
          CUERPO
          ============================================================ */}
      <section
        className="flex-1 flex flex-col"
        style={{ marginTop: "5mm", fontSize: "11pt" }}
      >
        <DottedField label="Nombre" value={paciente_nombre} />
        <div style={{ height: "3mm" }} />
        <DottedField label="Diagnóstico" value={diagnostico} />

        <div
          className="whitespace-pre-wrap"
          style={{
            marginTop: "8mm",
            lineHeight: 1.6,
            fontSize: "11pt",
            flex: 1,
          }}
        >
          {contenido}
        </div>
      </section>

      {/* ============================================================
          PIE — Fecha y Cita en blanco para que el médico los llene a mano
          ============================================================ */}
      <footer style={{ marginTop: "4mm" }}>
        <div
          className="flex justify-between items-baseline"
          style={{ fontSize: "12pt", marginBottom: "1.5mm", color: BLUE }}
        >
          <div className="flex items-baseline" style={{ gap: "2mm" }}>
            <strong>Fecha:</strong>
            <DateBox />
          </div>
          <div className="flex items-baseline" style={{ gap: "2mm" }}>
            <strong>Cita:</strong>
            <DateBox />
          </div>
        </div>
        <p
          className="text-center"
          style={{
            fontSize: "10pt",
            color: BLUE,
            fontWeight: 500,
          }}
        >
          {doctor.clinica}
        </p>
      </footer>
    </div>
  )
}

function DottedField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline" style={{ gap: "2mm" }}>
      <span className="font-bold whitespace-nowrap">{label}:</span>
      <span
        className="flex-1"
        style={{
          borderBottom: `1.5px dotted ${BLUE}`,
          paddingBottom: "2px",
          minHeight: "1.2em",
          lineHeight: 1.3,
        }}
      >
        {value || " "}
      </span>
    </div>
  )
}

/**
 * DateBox — tres líneas inferiores azules separadas por "/" para que el
 * médico escriba día / mes / año a mano. Siempre en blanco.
 */
function DateBox() {
  const slot: React.CSSProperties = {
    borderBottom: `1.5px solid ${BLUE}`,
    minWidth: "11mm",
    paddingBottom: "1px",
    display: "inline-block",
  }
  return (
    <span
      className="inline-flex items-baseline"
      style={{ gap: "1.5mm", color: BLUE, fontWeight: 700 }}
    >
      <span style={slot}>&nbsp;</span>
      /
      <span style={slot}>&nbsp;</span>
      /
      <span style={slot}>&nbsp;</span>
    </span>
  )
}
