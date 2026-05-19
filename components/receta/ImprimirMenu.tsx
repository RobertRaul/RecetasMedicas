"use client"

import { useState } from "react"
import { Printer, HelpCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  /** URL del PDF (ej. `/api/recetas/<id>/pdf`) */
  baseUrl: string
}

export function ImprimirMenu({ baseUrl }: Props) {
  const [showInstrucciones, setShowInstrucciones] = useState(false)

  return (
    <div className="flex items-center gap-2">
      <a
        href={baseUrl}
        target="_blank"
        rel="noreferrer"
        className={cn(buttonVariants(), "inline-flex items-center")}
      >
        <Printer className="mr-2 h-4 w-4" />
        Imprimir / Descargar PDF
      </a>

      <Button
        variant="outline"
        size="icon"
        onClick={() => setShowInstrucciones(true)}
        aria-label="Cómo configurar la impresora"
        title="Cómo configurar la impresora"
      >
        <HelpCircle className="h-4 w-4" />
      </Button>

      <Dialog open={showInstrucciones} onOpenChange={setShowInstrucciones}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Configuración de impresión</DialogTitle>
            <DialogDescription>
              Para que la receta salga del mismo tamaño que la receta original,
              configura el diálogo de impresión así:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <ul className="list-disc list-inside space-y-1.5 text-gray-700">
              <li>
                <strong>Tamaño de papel:</strong> A5 (148 × 210 mm)
              </li>
              <li>
                <strong>Escala:</strong> 100% — <em>NO uses</em>{" "}
                &ldquo;Ajustar a la página&rdquo;
              </li>
              <li>
                <strong>Márgenes:</strong> Ninguno o Mínimos
              </li>
              <li>
                <strong>Orientación:</strong> Vertical (Portrait)
              </li>
            </ul>

            <div className="rounded-md bg-blue-50 p-3 text-blue-900">
              <p className="font-medium mb-1">Consejo</p>
              <p className="text-xs">
                Antes de imprimir la receta del paciente, prueba primero con la{" "}
                <strong>vista previa del template</strong> para verificar que tu
                impresora está bien configurada.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
