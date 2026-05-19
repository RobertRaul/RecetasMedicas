import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // @react-pdf/renderer usa dependencias nativas de Node (fontkit, pdfkit, etc.)
  // que no se pueden bundlear con Turbopack — deben quedar externas en el server.
  serverExternalPackages: ["@react-pdf/renderer"],

  // Garantiza que Vercel empaqueta los assets que el endpoint PDF lee
  // desde el filesystem (process.cwd()/public/...). Sin esto, en producción
  // el endpoint puede fallar con ENOENT.
  outputFileTracingIncludes: {
    "/api/recetas/[id]/pdf": [
      "./public/fonts/Allura-Regular.ttf",
      "./public/encabezado/medico-izquierda.png",
      "./public/encabezado/medico-derecha.png",
    ],
    "/api/recetas/preview/pdf": [
      "./public/fonts/Allura-Regular.ttf",
      "./public/encabezado/medico-izquierda.png",
      "./public/encabezado/medico-derecha.png",
    ],
  },
}

export default nextConfig
