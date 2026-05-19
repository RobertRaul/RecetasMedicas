"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, User, FileText, Loader2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"

type Result =
  | {
      type: "patient"
      id: string
      title: string
      subtitle: string
      href: string
    }
  | {
      type: "prescription"
      id: string
      title: string
      subtitle: string
      href: string
    }

export function GlobalSearch() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)

  // Atajo Ctrl/Cmd + K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  // Cuando se abre, foco al input y resetea estado
  useEffect(() => {
    if (open) {
      setActiveIdx(0)
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    } else {
      setQuery("")
      setResults([])
    }
  }, [open])

  // Búsqueda con debounce
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    const handler = setTimeout(async () => {
      setLoading(true)
      const supabase = createClient()
      const term = `%${q}%`

      const [pacientesResp, recetasResp] = await Promise.all([
        supabase
          .from("patients")
          .select("id, nombre_completo, dni")
          .is("deleted_at", null)
          .or(`nombre_completo.ilike.${term},dni.ilike.${term}`)
          .order("nombre_completo")
          .limit(6),
        supabase
          .from("prescriptions")
          .select(
            "id, diagnostico, fecha_emision, patients ( nombre_completo )"
          )
          .or(`diagnostico.ilike.${term},contenido.ilike.${term}`)
          .order("fecha_emision", { ascending: false })
          .limit(6),
      ])

      const combined: Result[] = []

      for (const p of pacientesResp.data ?? []) {
        combined.push({
          type: "patient",
          id: p.id,
          title: p.nombre_completo,
          subtitle: p.dni ? `DNI ${p.dni}` : "Paciente",
          href: `/pacientes/${p.id}`,
        })
      }
      const recetasRows = (recetasResp.data ?? []) as unknown as Array<{
        id: string
        diagnostico: string
        fecha_emision: string
        patients: { nombre_completo: string } | null
      }>
      for (const r of recetasRows) {
        const fecha = new Intl.DateTimeFormat("es-PE", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(new Date(r.fecha_emision))
        combined.push({
          type: "prescription",
          id: r.id,
          title: r.diagnostico,
          subtitle: `${r.patients?.nombre_completo ?? "—"} · ${fecha}`,
          href: `/recetas/${r.id}`,
        })
      }

      setResults(combined)
      setActiveIdx(0)
      setLoading(false)
    }, 250)

    return () => clearTimeout(handler)
  }, [query])

  const goTo = useCallback(
    (href: string) => {
      setOpen(false)
      router.push(href)
    },
    [router]
  )

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      const r = results[activeIdx]
      if (r) {
        e.preventDefault()
        goTo(r.href)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Búsqueda global</DialogTitle>
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Buscar pacientes o recetas…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
            autoComplete="off"
          />
          {loading && (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gray-400" />
          )}
          <kbd className="hidden rounded border bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-500 sm:inline-block">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {query.trim().length < 2 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              Escribe al menos 2 caracteres para buscar
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              Sin resultados para &ldquo;{query}&rdquo;
            </div>
          ) : (
            <ul className="py-1">
              {results.map((r, idx) => (
                <li key={`${r.type}-${r.id}`}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={() => goTo(r.href)}
                    className={`flex w-full items-start gap-3 px-4 py-2.5 text-left text-sm ${
                      idx === activeIdx ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                  >
                    {r.type === "patient" ? (
                      <User className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                    ) : (
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-gray-900">
                        {r.title}
                      </div>
                      <div className="truncate text-xs text-gray-500">
                        {r.subtitle}
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] uppercase tracking-wide text-gray-400">
                      {r.type === "patient" ? "Paciente" : "Receta"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-2 text-[11px] text-gray-500">
          <span>
            <kbd className="rounded border bg-white px-1">↑</kbd>{" "}
            <kbd className="rounded border bg-white px-1">↓</kbd> navegar
          </span>
          <span>
            <kbd className="rounded border bg-white px-1">Enter</kbd> abrir
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Pequeño botón para abrir la búsqueda global desde el sidebar.
 */
export function GlobalSearchTrigger() {
  function openSearch() {
    // Reutilizamos el atajo: simulamos Ctrl+K
    const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true })
    window.dispatchEvent(event)
  }

  return (
    <button
      type="button"
      onClick={openSearch}
      className="flex w-full items-center gap-2 rounded-lg border bg-gray-50 px-3 py-2 text-xs text-gray-500 hover:bg-gray-100"
    >
      <Search className="h-3.5 w-3.5" />
      <span className="flex-1 text-left">Buscar…</span>
      <kbd className="rounded border bg-white px-1.5 py-0.5 text-[10px]">
        Ctrl K
      </kbd>
    </button>
  )
}
