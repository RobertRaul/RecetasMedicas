"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import type { PacienteLite } from "@/components/recetas/PacienteSelector"

type Props = {
  pacientes: PacienteLite[]
}

export function RecetasFilters({ pacientes }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const [q, setQ] = useState(searchParams.get("q") ?? "")
  const [paciente, setPaciente] = useState(searchParams.get("paciente") ?? "")
  const [desde, setDesde] = useState(searchParams.get("desde") ?? "")
  const [hasta, setHasta] = useState(searchParams.get("hasta") ?? "")

  // Sincroniza URL con filtros (debounce solo en el texto)
  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams()
      if (q.trim()) params.set("q", q.trim())
      if (paciente) params.set("paciente", paciente)
      if (desde) params.set("desde", desde)
      if (hasta) params.set("hasta", hasta)

      const qs = params.toString()
      const next = qs ? `${pathname}?${qs}` : pathname

      startTransition(() => {
        router.replace(next, { scroll: false })
      })
    }, 300)

    return () => clearTimeout(handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, paciente, desde, hasta])

  const hayFiltros = q || paciente || desde || hasta

  function limpiar() {
    setQ("")
    setPaciente("")
    setDesde("")
    setHasta("")
  }

  return (
    <div className="space-y-3 rounded-lg border bg-white p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[1fr_220px_160px_160px]">
        {/* Búsqueda full-text */}
        <div className="space-y-1.5">
          <Label htmlFor="q" className="text-xs">
            Buscar en diagnóstico o contenido
          </Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="q"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ej. amoxicilina, faringitis…"
              className="pl-9"
            />
          </div>
        </div>

        {/* Filtro paciente */}
        <div className="space-y-1.5">
          <Label htmlFor="paciente-filter" className="text-xs">
            Paciente
          </Label>
          <select
            id="paciente-filter"
            value={paciente}
            onChange={(e) => setPaciente(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
          >
            <option value="">Todos los pacientes</option>
            {pacientes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre_completo}
                {p.dni ? ` · ${p.dni}` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Fechas */}
        <div className="space-y-1.5">
          <Label htmlFor="desde" className="text-xs">
            Desde
          </Label>
          <Input
            id="desde"
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="hasta" className="text-xs">
            Hasta
          </Label>
          <Input
            id="hasta"
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
          />
        </div>
      </div>

      {hayFiltros && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={limpiar}
            className="text-xs"
          >
            <X className="mr-1 h-3 w-3" />
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  )
}
