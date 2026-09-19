import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brizoa · Tu radar de precios",
  description: "Sigue productos, compara su historial y decide con perspectiva. Alfa privada con datos de demostración.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  manifest: "/manifest.webmanifest",
  applicationName: "Brizoa",
  appleWebApp: { capable: true, title: "Brizoa", statusBarStyle: "black-translucent" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX">
      <body className="antialiased">{children}</body>
    </html>
  );
}
