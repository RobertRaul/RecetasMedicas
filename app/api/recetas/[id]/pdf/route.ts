// Endpoint PDF on-demand — implementación completa en Fase 5
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return new Response(`PDF para receta ${id} — pendiente implementación`, {
    status: 501,
    headers: { "Content-Type": "text/plain" },
  })
}
