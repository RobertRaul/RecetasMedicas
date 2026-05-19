"use client"

import Link from "next/link"
import { MoreHorizontal, Eye, Printer, User } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  recetaId: string
  pacienteId: string | null
}

export function RecetaRowActions({ recetaId, pacienteId }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
        aria-label="Acciones"
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem render={<Link href={`/recetas/${recetaId}`} />}>
          <Eye className="mr-2 h-4 w-4" />
          Ver detalle
        </DropdownMenuItem>
        <DropdownMenuItem
          render={
            <a
              href={`/api/recetas/${recetaId}/pdf`}
              target="_blank"
              rel="noreferrer"
            />
          }
        >
          <Printer className="mr-2 h-4 w-4" />
          Imprimir PDF
        </DropdownMenuItem>
        {pacienteId && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              render={<Link href={`/pacientes/${pacienteId}`} />}
            >
              <User className="mr-2 h-4 w-4" />
              Ver paciente
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
