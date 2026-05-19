# Plan de Trabajo: Sistema de Recetas Médicas Digitales

**Proyecto:** Sistema de recetas digitales para Dr. Raúl Farfán Samanez (Pediatría / Cirugía Pediátrica)
**Cliente piloto:** Clínica Mac Salud, Cusco - Perú
**Objetivo:** Digitalizar el proceso de emisión de recetas manteniendo el diseño impreso exacto, con gestión de pacientes y trazabilidad.

> **Versión 2** – Incorpora decisiones del cliente:
> 1. Impresión **completa** en papel A5 blanco (encabezado + cuerpo + pie, todo desde el sistema).
> 2. Imágenes ilustradas del encabezado provistas por el médico.
> 3. **No se almacenan PDFs** ni datos basura: el PDF se genera **on-demand** a partir de los datos en BD.

---

## 1. Resumen ejecutivo

Aplicación web donde el médico inicia sesión, registra pacientes con su diagnóstico, genera una receta que replica fielmente el formato impreso actual (encabezado con datos del médico, ilustraciones laterales, nombre, diagnóstico, fecha, cita, pie de página con dirección de la clínica) y la imprime en tamaño A5 sobre papel blanco. La aplicación guarda únicamente los datos estructurados de la receta; el PDF se regenera al vuelo cada vez que se solicita ver o reimprimir.

**Stack final:**

- **Frontend / Backend:** Next.js 15 (App Router) desplegado en Vercel
- **Base de datos:** Supabase (PostgreSQL gestionado, free tier 500MB)
- **Autenticación:** Supabase Auth (email + contraseña)
- **Generación de PDF:** `@react-pdf/renderer` (server-side, on-demand, sin persistencia)
- **UI:** Tailwind CSS + shadcn/ui
- **Validación:** React Hook Form + Zod
- **Activos estáticos:** Imágenes del encabezado en `/public` (servidas por Vercel CDN)

> **Sin Google Drive.** Como las recetas no se almacenan como archivos, no hay necesidad de almacenamiento externo. Si en el futuro el médico quiere un respaldo descargable masivo, se puede agregar exportación a ZIP bajo demanda (sin persistencia).

---

## 2. Filosofía de "PDF on-demand"

Esta es una decisión arquitectónica importante que simplifica todo el sistema:

- En la BD se guardan **solo los campos estructurados** de cada receta (paciente, diagnóstico, contenido, fechas).
- Cuando el médico hace clic en **"Ver receta"** o **"Imprimir"**, el servidor toma los datos, los inyecta en el template y genera el PDF en memoria.
- El PDF se transmite al navegador como respuesta HTTP (`Content-Type: application/pdf`) y nunca toca el disco ni un bucket.

**Ventajas:**
- Cero costo de almacenamiento.
- BD ligera (cabe muchísimo en el free tier de Supabase).
- Si el diseño del encabezado cambia (nuevo CMP, nuevo celular, nueva clínica), **todas las recetas históricas se actualizan automáticamente** la próxima vez que se generan. ⚠️ Esto puede ser una ventaja o un problema según el caso.

**Mitigación de la actualización retroactiva:**
Para preservar el "documento original" tal como se emitió, en la tabla `prescriptions` se guarda un **snapshot** de los datos del médico que aplicaban al momento de emitir (CMP, dirección, celular, etc.). Así, una receta de 2026 siempre se regenera con los datos de 2026 aunque el médico haya cambiado de dirección en 2028.

---

## 3. Modelo de datos (PostgreSQL en Supabase)

```sql
-- Médicos (vinculados a auth.users de Supabase)
doctors
├── id                 uuid (FK → auth.users.id, PK)
├── nombre_completo    text         -- "Dr. Raúl Farfán Samanez"
├── especialidad       text         -- "PEDIATRÍA / CIRUGÍA PEDIÁTRICA"
├── cmp                text         -- "27466"
├── rne                text         -- "17412 / 48994"
├── celular            text         -- "983 653822"
├── horario            text         -- "Lunes a Sábado: 3:30 p.m a 8:00 p.m"
├── clinica            text         -- "Clínica Mac Salud 5to piso Consultorio 502 ..."
└── created_at         timestamptz

-- Pacientes
patients
├── id                 uuid (PK)
├── doctor_id          uuid (FK → doctors.id)
├── nombre_completo    text
├── dni                text (opcional)
├── fecha_nacimiento   date (opcional)
├── telefono           text (opcional)
├── notas              text (opcional)
├── created_at         timestamptz
└── updated_at         timestamptz

-- Recetas (sin pdf_url, sin pdf_drive_id)
prescriptions
├── id                 uuid (PK)
├── doctor_id          uuid (FK → doctors.id)
├── patient_id         uuid (FK → patients.id)
├── diagnostico        text
├── contenido          text          -- cuerpo de la receta (medicamentos, indicaciones)
├── fecha_emision      date
├── fecha_cita         date (opcional)
├── doctor_snapshot    jsonb         -- snapshot inmutable de los datos del médico
└── created_at         timestamptz

-- Índices
CREATE INDEX idx_patients_doctor ON patients(doctor_id);
CREATE INDEX idx_patients_nombre ON patients(doctor_id, nombre_completo);
CREATE INDEX idx_prescriptions_doctor_fecha ON prescriptions(doctor_id, fecha_emision DESC);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);

-- Búsqueda full-text para diagnóstico y contenido
CREATE INDEX idx_prescriptions_fts ON prescriptions
  USING gin(to_tsvector('spanish', diagnostico || ' ' || contenido));
```

**Estructura del `doctor_snapshot`:**
```json
{
  "nombre_completo": "Dr. Raúl Farfán Samanez",
  "especialidad": "PEDIATRÍA / CIRUGÍA PEDIÁTRICA",
  "cmp": "27466",
  "rne": "17412 / 48994",
  "celular": "983 653822",
  "horario": "Lunes a Sábado: 3:30 p.m a 8:00 p.m",
  "clinica": "Clínica Mac Salud 5to piso Consultorio 502 Av. de la Cultura N° 1410 Cusco - Perú"
}
```

**Row Level Security (RLS):** Cada médico solo accede a sus pacientes y recetas. Política base: `auth.uid() = doctor_id`.

---

## 4. Estructura de carpetas del proyecto

```
recetas-medicas/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── registro/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx               # Sidebar + auth guard
│   │   ├── page.tsx                 # Dashboard inicial
│   │   ├── pacientes/
│   │   │   ├── page.tsx             # Listado + búsqueda
│   │   │   ├── nuevo/page.tsx
│   │   │   └── [id]/page.tsx        # Detalle + historial recetas
│   │   ├── recetas/
│   │   │   ├── page.tsx             # Listado + filtros
│   │   │   ├── nueva/page.tsx       # Formulario de creación
│   │   │   └── [id]/page.tsx        # Vista detalle + reimprimir
│   │   └── perfil/page.tsx          # Datos del médico
│   ├── api/
│   │   └── recetas/
│   │       ├── route.ts             # POST crear, GET listar
│   │       └── [id]/pdf/route.ts    # GET genera PDF al vuelo
│   └── layout.tsx
├── components/
│   ├── ui/                          # shadcn
│   ├── receta/
│   │   ├── RecetaPreview.tsx        # Vista previa A5 en pantalla (HTML)
│   │   └── RecetaPDFDocument.tsx    # Componente @react-pdf/renderer
│   ├── pacientes/
│   │   ├── PacienteForm.tsx
│   │   └── PacienteTable.tsx
│   └── shared/
│       ├── Sidebar.tsx
│       └── SearchBar.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── pdf/
│   │   └── generar-receta.ts        # Función que devuelve Buffer PDF
│   └── validators/
│       ├── paciente.ts
│       └── receta.ts
├── public/
│   └── encabezado/
│       ├── medico-izquierda.png     # Ilustración lado izquierdo
│       └── medico-derecha.png       # Ilustración lado derecho (espejo)
├── middleware.ts
├── .env.local
├── package.json
└── README.md
```

---

## 5. Diseño exacto de la receta (formato A5)

Tamaño A5: **148 mm × 210 mm** (portrait). Todo se imprime sobre papel blanco.

### Encabezado (zona superior, ~50 mm)

| Elemento | Detalle |
|---|---|
| Ilustración izquierda | `medico-izquierda.png` (médico señalando, maletín a su izquierda) |
| Ilustración derecha | `medico-derecha.png` (espejo, maletín a su derecha) |
| Título central | **"Dr. Raúl Farfán Samanez"** – fuente cursiva tipo *Great Vibes* o similar |
| Subtítulo 1 | "MÉDICO ESPECIALISTA" (centrado, negrita, mayúsculas) |
| Subtítulo 2 | "PEDIATRÍA / CIRUGÍA PEDIÁTRICA" |
| Credenciales | `CMP N° 27466 / RNE N° 17412 / 48994` (números subrayados) |
| Línea horaria | "**ATENCIÓN:** Lunes a Sábado: 3:30 p.m a 8:00 p.m  **Cel.:** 983 653822" |
| Divisor | Línea horizontal doble o sencilla |

### Cuerpo (zona media, ~120 mm)

- `Nombre: __________________________________________________`
- `Diagnóstico: ______________________________________________`
- Espacio amplio para el contenido (medicamentos, indicaciones, posología)

### Pie de página (zona inferior, ~25 mm)

- `Fecha: __ / __ / __`  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; `Cita: __ / __ / __`
- "Clínica Mac Salud 5to piso Consultorio 502 Av. de la Cultura N° 1410 Cusco - Perú"

### Consideraciones tipográficas

- Fuente cursiva para el nombre del médico: cargar Google Font (*Great Vibes*, *Allura* o *Sacramento*) e incrustar en el PDF.
- Cuerpo del documento: Arial / Helvetica / sans-serif estándar.
- Color del encabezado: azul (acorde a las ilustraciones), ej. `#1e3a8a` o el tono que mejor combine.

### Sobre las imágenes del encabezado

Las fotos actuales de las ilustraciones están **escaneadas con trama de medios tonos** (los puntitos azules visibles). Para que el PDF se vea limpio:

1. **Ideal:** pedirle al diseñador original el archivo en PNG/SVG/AI.
2. **Si no se tiene:** procesar las fotos actuales:
   - Eliminar fondo (background-removal).
   - Aplicar desenfoque ligero para suavizar la trama.
   - Vectorizar (Adobe Illustrator, Inkscape, o herramienta online tipo *vectorizer.ai*).
   - Exportar como PNG con fondo transparente a 300 DPI, ancho ~400 px.
3. **Plan B aceptable:** usar las fotos limpias tal cual (resultado decente para impresión doméstica).

---

## 6. Generación del PDF on-demand

### Flujo

```
[Usuario clic "Imprimir"]
        ↓
GET /api/recetas/[id]/pdf
        ↓
Server: lee receta + paciente + doctor_snapshot de Supabase
        ↓
Server: renderiza <RecetaPDFDocument /> con @react-pdf/renderer
        ↓
Server: devuelve Buffer con header Content-Type: application/pdf
        ↓
Browser: abre PDF en nueva pestaña → diálogo de impresión
```

### Esqueleto del endpoint

```typescript
// app/api/recetas/[id]/pdf/route.ts
import { renderToBuffer } from '@react-pdf/renderer';
import { RecetaPDFDocument } from '@/components/receta/RecetaPDFDocument';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: receta, error } = await supabase
    .from('prescriptions')
    .select('*, patients(*), doctors(*)')
    .eq('id', params.id)
    .single();

  if (error || !receta) return new Response('No encontrada', { status: 404 });

  const buffer = await renderToBuffer(<RecetaPDFDocument receta={receta} />);

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="receta-${receta.id}.pdf"`,
    },
  });
}
```

### Configuración del documento PDF (A5)

```tsx
import { Document, Page, View, Text, Image, StyleSheet, Font } from '@react-pdf/renderer';

Font.register({
  family: 'GreatVibes',
  src: 'https://fonts.gstatic.com/s/greatvibes/...woff'
});

const styles = StyleSheet.create({
  page: { padding: 0, fontFamily: 'Helvetica' },
  // A5 = 148mm x 210mm, react-pdf maneja esto con size="A5"
});

export const RecetaPDFDocument = ({ receta }) => (
  <Document>
    <Page size="A5" style={styles.page}>
      {/* Encabezado, cuerpo, pie */}
    </Page>
  </Document>
);
```

---

## 7. Fases del desarrollo

### Fase 0 · Preparación (medio día)
- [ ] Crear repositorio en GitHub
- [ ] Crear proyecto en Vercel y vincular repo
- [ ] Crear proyecto en Supabase, anotar URL y keys
- [ ] Procesar las imágenes del encabezado (limpiar, vectorizar idealmente) y colocarlas en `public/encabezado/`
- [ ] Configurar `.env.local` y variables en Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

### Fase 1 · Scaffold (medio día)
- [ ] `npx create-next-app@latest` con TypeScript, Tailwind, App Router
- [ ] Instalar: `@supabase/ssr`, `@supabase/supabase-js`, `@react-pdf/renderer`, `react-hook-form`, `zod`, `@hookform/resolvers`, `lucide-react`, `date-fns`, `sonner`
- [ ] Configurar shadcn/ui: `npx shadcn@latest init`
- [ ] Layout base, sidebar

### Fase 2 · Base de datos y autenticación (1 día)
- [ ] Crear tablas SQL en Supabase
- [ ] Activar RLS y crear políticas
- [ ] Cliente Supabase (browser + server)
- [ ] Middleware de protección de rutas
- [ ] Páginas `/login` y `/registro`
- [ ] Trigger SQL: al crear `auth.users` → insertar fila vacía en `doctors`
- [ ] Página `/perfil` (precarga con datos del Dr. Farfán para el piloto)

### Fase 3 · Gestión de pacientes (1 día)
- [ ] Página `/pacientes` con tabla, búsqueda y paginación
- [ ] Formulario `/pacientes/nuevo` con validación Zod
- [ ] Página `/pacientes/[id]` con datos + historial de recetas
- [ ] Edición + soft delete (no romper FK de recetas históricas)

### Fase 4 · Diseño y preview de receta (1.5 días)
- [ ] Componente `RecetaPreview` (HTML + Tailwind) que reproduce el diseño A5 en pantalla
- [ ] Cargar fuente cursiva (Google Fonts) para el nombre del médico
- [ ] Maquetar encabezado con las dos ilustraciones laterales
- [ ] Validar visualmente que se ve igual que la receta original

### Fase 5 · Generación PDF on-demand (1.5 días)
- [ ] Componente `RecetaPDFDocument` con `@react-pdf/renderer`
- [ ] Registrar fuente cursiva en el PDF
- [ ] Incrustar las dos imágenes laterales en el encabezado
- [ ] Endpoint `GET /api/recetas/[id]/pdf` que renderiza y devuelve buffer
- [ ] Probar que el PDF abre correctamente en Chrome, Firefox, móvil

### Fase 6 · Creación de recetas (1 día)
- [ ] Página `/recetas/nueva` con split view (formulario + preview en vivo)
- [ ] Selector/búsqueda de paciente con opción "crear nuevo" inline
- [ ] Campos: diagnóstico, contenido, fecha emisión, fecha cita
- [ ] Endpoint `POST /api/recetas`:
  1. Valida payload con Zod
  2. Toma snapshot actual del médico
  3. Inserta fila en `prescriptions` con `doctor_snapshot`
  4. Devuelve ID de la receta creada
- [ ] Al guardar, redirigir a `/recetas/[id]` con botón "Imprimir ahora"

### Fase 7 · Impresión A5 (medio día)
- [ ] El PDF se abre en nueva pestaña; el usuario usa Ctrl+P
- [ ] Configurar `@page { size: A5; margin: 0; }` en el PDF
- [ ] Probar en impresora real con papel A5
- [ ] Documentar configuración recomendada de impresora (escala 100%, sin márgenes)
- [ ] Si la impresora no tiene A5, alternativa: imprimir 2 recetas por hoja A4

### Fase 8 · Búsqueda, filtros e historial (1 día)
- [ ] Página `/recetas` con tabla paginada server-side
- [ ] Filtros: rango de fechas, paciente, búsqueda full-text (índice GIN ya creado)
- [ ] Búsqueda global Ctrl+K (pacientes + recetas)
- [ ] Exportar listado a CSV (sin PDFs, solo datos)

### Fase 9 · Pulido y QA (1 día)
- [ ] Estados vacíos, loaders, errores
- [ ] Toasts (sonner)
- [ ] Confirmaciones para acciones destructivas
- [ ] Responsive (tablet)
- [ ] Pruebas end-to-end manuales

### Fase 10 · Despliegue (medio día)
- [ ] Dominio en Vercel
- [ ] Variables de producción
- [ ] Crear cuenta del Dr. Farfán y precargar sus datos
- [ ] Sesión de capacitación de 30 min

**Total estimado: 8-9 días de trabajo efectivo.**

---

## 8. Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app
```

(Mucho más sencillo que la v1 al eliminar Google Drive.)

---

## 9. Consideraciones legales y de seguridad

- **Ley N° 29733 (Perú) – Protección de Datos Personales.**
- HTTPS automático en Vercel.
- Cifrado en reposo en Supabase.
- Política de privacidad mínima al iniciar sesión.
- Backups: el plan free de Supabase guarda backups diarios automáticos (7 días). Para más, plan Pro.
- **Retención legal:** historia clínica en Perú se conserva mínimo 15 años. Como no se borran recetas (solo se "archivan"), esto se cumple por diseño.

---

## 10. Roadmap futuro (no incluido en MVP)

- Firma digital del médico (imagen escaneada de firma)
- Envío de PDF por WhatsApp al paciente (con un clic, sin guardar)
- Plantillas de diagnósticos frecuentes
- Autocompletado CIE-10
- Multi-médico (varios doctores en la misma clínica, cada uno con su encabezado)
- Dashboard con estadísticas (recetas/mes, diagnósticos frecuentes)
- Exportación masiva a ZIP (genera todos los PDFs de un rango en una descarga única, sin persistir)
- App móvil con React Native

---

## 11. Cómo trabajar con Claude Code

1. Empezar por las Fases 0 y 1 (scaffold + setup).
2. Para cada fase nueva, abrir una sesión limpia y decirle a Claude Code:
   > *"Lee `PLAN_RECETAS_MEDICAS.md` y arranca con la Fase X. Antes de codificar, dime qué dudas tienes."*
3. Tener a mano la imagen original de la receta y las dos ilustraciones laterales al llegar a la Fase 4.
4. Probar impresión A5 con la impresora real **antes** de la Fase 8, no al final.
5. La Fase 5 (PDF on-demand) es la más delicada técnicamente; reservar tiempo extra si surgen ajustes de diseño.

**Comando inicial sugerido:**
```bash
claude "Lee PLAN_RECETAS_MEDICAS.md completo. Arranca con la Fase 0. Antes de codificar dime qué dudas tienes y qué decisiones necesitas que confirme."
```

---

## 12. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Supabase free 500MB se queda corto | A ~2KB por receta sin PDFs, caben ~250.000 recetas. Sobra para años. |
| El PDF generado se ve distinto a la receta original | Fase 4 incluye validación visual lado a lado con la imagen original. |
| Las ilustraciones del encabezado se ven con trama de medios tonos | Vectorizar o pedir originales antes de Fase 4. |
| Impresión A5 sale descentrada | Probar configuración real en Fase 7; ajustar márgenes del PDF si es necesario. |
| Médico olvida contraseña | Magic link / reset por email de Supabase. |
| Renderizar PDF en cada solicitud es lento | `@react-pdf/renderer` server-side rinde un A5 en <500ms. Si fuera problema, cachear en memoria del runtime (sin persistir en disco). |
| Caída de Vercel o Supabase | Datos seguros (solo degradación temporal); avisar al médico que mantenga una libreta de respaldo por unos días. |

---

## 13. Cambios respecto a la versión 1

| Tema | v1 | v2 (esta) |
|---|---|---|
| Almacenamiento PDF | Google Drive vía OAuth | **No se almacena, se genera on-demand** |
| Tabla `prescriptions` | Incluía `pdf_drive_id`, `pdf_drive_url` | Esos campos eliminados; agregado `doctor_snapshot` |
| Modos de impresión | Preimpreso + Completo | **Solo Completo** (todo en A5 blanco) |
| Imágenes encabezado | Por confirmar | **Provistas por el médico**, en `public/encabezado/` |
| Variables de entorno | 6 (incluyendo Google) | 4 (solo Supabase) |
| Fases | 9 | 10 (más granular en PDF on-demand) |
| Estimación | 8-9 días | 8-9 días (igual; lo ahorrado en Drive se invierte en pulir PDF on-demand) |
