import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://cuadrosabigail.store"),
  title: {
    default: "Cuadros Abigail | Fabricantes de cuadros decorativos",
    template: "%s | Cuadros Abigail"
  },
  description: "Fabricantes mexicanos de cuadros decorativos desde 2011. Venta de menudeo y mayoreo, para hogares, hoteles, Airbnb y proyectos comerciales. Envíos a todo México.",
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: "Cuadros Abigail",
    title: "Cuadros Abigail | Fabricantes de cuadros decorativos",
    description: "Cuadros decorativos de fabricación propia. Menudeo, mayoreo y proyectos comerciales."
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es-MX"><body>{children}</body></html>;
}