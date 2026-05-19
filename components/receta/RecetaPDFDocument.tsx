/**
 * RecetaPDFDocument — Versión PDF (A5) del template de la receta.
 *
 * Genera un PDF de tamaño A5 portrait (148×210mm) listo para imprimir.
 *
 * Notas:
 *  - La fuente Allura y las imágenes del encabezado se cargan como Buffer
 *    desde public/ — @react-pdf no procesa bien los paths de Windows.
 *  - Este módulo solo debe importarse desde código server-side.
 */

import fs from "node:fs"
import path from "node:path"
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
  renderToBuffer,
} from "@react-pdf/renderer"
import type { DoctorSnapshot } from "@/lib/database.types"

const BLUE = "#1e40af"
const DARK = "#0f172a"

// ----------------------------------------------------------------------------
// Recursos estáticos
// ----------------------------------------------------------------------------
function publicPath(...segments: string[]): string {
  return path.join(process.cwd(), "public", ...segments)
}

const ALLURA_PATH = publicPath("fonts", "Allura-Regular.ttf")
const IMG_IZQ_BUF = fs.readFileSync(publicPath("encabezado", "medico-izquierda.png"))
const IMG_DER_BUF = fs.readFileSync(publicPath("encabezado", "medico-derecha.png"))

Font.register({ family: "Allura", src: ALLURA_PATH })
Font.registerHyphenationCallback((word) => [word])

// ----------------------------------------------------------------------------
// Estilos
// ----------------------------------------------------------------------------
const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: DARK,
    paddingTop: "6mm",
    paddingBottom: "5mm",
    paddingLeft: "6mm",
    paddingRight: "6mm",
  },

  // ===== ENCABEZADO ========================================================
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  imageBox: {
    width: "24mm",
    height: "28mm",
  },
  center: {
    flex: 1,
    textAlign: "center",
    paddingHorizontal: "1mm",
  },
  doctorName: {
    fontFamily: "Allura",
    fontSize: 24,
    color: BLUE,
    textAlign: "center",
    lineHeight: 1,
  },
  especialidad: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
    color: BLUE,
    textAlign: "center",
    letterSpacing: 0.5,
    marginTop: "0.5mm",
  },
  credenciales: {
    fontSize: 10,
    color: BLUE,
    textAlign: "center",
    marginTop: "0.5mm",
  },
  bold: { fontFamily: "Helvetica-Bold" },
  underline: { textDecoration: "underline" },

  atencionBar: {
    borderBottomWidth: 1.5,
    borderBottomColor: BLUE,
    paddingTop: "1.5mm",
    paddingBottom: "1.5mm",
    marginTop: "1mm",
  },
  atencionText: {
    textAlign: "center",
    color: BLUE,
    fontSize: 10,
  },

  // ===== CUERPO =============================================================
  body: {
    flex: 1,
    marginTop: "5mm",
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: "3mm",
  },
  fieldLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    marginRight: "2mm",
  },
  fieldValue: {
    flex: 1,
    fontSize: 11,
    borderBottomWidth: 1.5,
    borderBottomColor: BLUE,
    borderStyle: "dotted",
    paddingBottom: 2,
    minHeight: 14,
  },
  contenido: {
    marginTop: "6mm",
    fontSize: 11,
    lineHeight: 1.55,
    flex: 1,
  },

  // ===== PIE ================================================================
  footer: {
    marginTop: "4mm",
  },
  fechaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "2mm",
  },
  fechaItem: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  fechaLabel: {
    fontFamily: "Helvetica-Bold",
    color: BLUE,
    fontSize: 12,
    marginRight: "2mm",
  },
  dateSlot: {
    width: "11mm",
    height: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: BLUE,
    marginHorizontal: "1mm",
  },
  slash: {
    color: BLUE,
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  clinica: {
    textAlign: "center",
    fontSize: 9,
    color: BLUE,
    fontFamily: "Helvetica-Bold",
  },
})

// ----------------------------------------------------------------------------
// Tipos
// ----------------------------------------------------------------------------
export type RecetaPDFData = {
  doctor: DoctorSnapshot
  paciente_nombre: string
  diagnostico: string
  contenido: string
}

// ----------------------------------------------------------------------------
// Componente
// ----------------------------------------------------------------------------
function DateBoxPDF() {
  return (
    <>
      <View style={styles.dateSlot} />
      <Text style={styles.slash}>/</Text>
      <View style={styles.dateSlot} />
      <Text style={styles.slash}>/</Text>
      <View style={styles.dateSlot} />
    </>
  )
}

export function RecetaPDFDocument({ data }: { data: RecetaPDFData }) {
  const { doctor, paciente_nombre, diagnostico, contenido } = data

  return (
    <Document
      title={`Receta - ${paciente_nombre}`}
      author={doctor.nombre_completo}
      creator="Sistema de Recetas - Clínica Mac Salud"
    >
      <Page size="A5" style={styles.page}>
        {/* ENCABEZADO */}
        <View>
          <View style={styles.headerRow}>
            <Image src={IMG_IZQ_BUF} style={styles.imageBox} />
            <View style={styles.center}>
              <Text style={styles.doctorName}>{doctor.nombre_completo}</Text>
              <Text style={styles.especialidad}>MÉDICO ESPECIALISTA</Text>
              <Text style={styles.especialidad}>{doctor.especialidad}</Text>
              <Text style={styles.credenciales}>
                <Text style={styles.bold}>CMP N° </Text>
                <Text style={[styles.bold, styles.underline]}>{doctor.cmp}</Text>
                {doctor.rne ? (
                  <Text>
                    <Text> / </Text>
                    <Text style={styles.bold}>RNE N° </Text>
                    <Text style={[styles.bold, styles.underline]}>
                      {doctor.rne}
                    </Text>
                  </Text>
                ) : null}
              </Text>
            </View>
            <Image src={IMG_DER_BUF} style={styles.imageBox} />
          </View>

          <View style={styles.atencionBar}>
            <Text style={styles.atencionText}>
              <Text style={styles.bold}>ATENCIÓN:</Text> {doctor.horario}
              {doctor.celular ? (
                <Text>
                  {"   "}
                  <Text style={styles.bold}>Cel.:</Text> {doctor.celular}
                </Text>
              ) : null}
            </Text>
          </View>
        </View>

        {/* CUERPO */}
        <View style={styles.body}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Nombre:</Text>
            <Text style={styles.fieldValue}>{paciente_nombre}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Diagnóstico:</Text>
            <Text style={styles.fieldValue}>{diagnostico}</Text>
          </View>
          <Text style={styles.contenido}>{contenido}</Text>
        </View>

        {/* PIE */}
        <View style={styles.footer}>
          <View style={styles.fechaRow}>
            <View style={styles.fechaItem}>
              <Text style={styles.fechaLabel}>Fecha:</Text>
              <DateBoxPDF />
            </View>
            <View style={styles.fechaItem}>
              <Text style={styles.fechaLabel}>Cita:</Text>
              <DateBoxPDF />
            </View>
          </View>
          <Text style={styles.clinica}>{doctor.clinica}</Text>
        </View>
      </Page>
    </Document>
  )
}

// ----------------------------------------------------------------------------
// Helper: renderiza el componente a un Buffer listo para servir como PDF
// ----------------------------------------------------------------------------
export async function generarRecetaPDF(data: RecetaPDFData): Promise<Buffer> {
  return await renderToBuffer(<RecetaPDFDocument data={data} />)
}
