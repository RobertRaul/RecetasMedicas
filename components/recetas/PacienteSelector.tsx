"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Search, X, UserPlus } from "lucide-react"
import { Input } from "@/components/ui/input"

export type PacienteLite = {
  id: string
  nombre_completo: string
  dni: string | null
}

type Props = {
  pacientes: PacienteLite[]
  value: string
  onChange: (id: string) => void
}

export function PacienteSelector({ pacientes, value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const selected = pacientes.find((p) => p.id === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return pacientes.slice(0, 30)
    return pacientes
      .filter(
        (p) =>
          p.nombre_completo.toLowerCase().includes(q) ||
          (p.dni?.toLowerCase().includes(q) ?? false)
      )
      .slice(0, 30)
  }, [pacientes, query])

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border bg-blue-50 border-blue-200 px-3 py-2">
        <div className="min-w-0">
          <div className="font-medium text-blue-900 truncate">
            {selected.nombre_completo}
          </div>
          {selected.dni && (
            <div className="text-xs text-blue-700">DNI: {selected.dni}</div>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            onChange("")
            setQuery("")
            setOpen(false)
          }}
          className="shrink-0 rounded-full p-1 text-blue-700 hover:bg-blue-100"
          aria-label="Cambiar paciente"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          type="search"
          className="pl-9"
          placeholder="Buscar paciente por nombre o DNI…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
        />
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border bg-white shadow-lg">
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-sm text-gray-500">
                No hay coincidencias.
              </div>
            ) : (
              filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onChange(p.id)
                    setOpen(false)
                    setQuery("")
                  }}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-blue-50"
                >
                  <div className="font-medium">{p.nombre_completo}</div>
                  {p.dni && (
                    <div className="text-xs text-muted-foreground">
                      DNI: {p.dni}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
          <div className="border-t bg-gray-50 px-3 py-2">
            <Link
              href="/pacientes/nuevo"
              target="_blank"
              className="flex items-center gap-2 text-xs text-blue-700 hover:underline"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Crear nuevo paciente
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
