import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // @react-pdf/renderer usa dependencias nativas de Node (fontkit, pdfkit, etc.)
  // que no se pueden bundlear con Turbopack — deben quedar externas en el server.
  serverExternalPackages: ["@react-pdf/renderer"],
}

export default nextConfig
