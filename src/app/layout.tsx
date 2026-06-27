import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Äkta Restaurant Genève — Cuisine Authentique & Terroir",
  description: "Découvrez Äkta, restaurant bistronomique au cœur de Plainpalais à Genève (Bd de la Cluse 20). Cuisine locale fait-maison le midi, assiettes créatives à partager et vins suisses bio le soir.",
  keywords: ["Akta", "Äkta", "Restaurant", "Genève", "Geneva", "Plainpalais", "Cluse", "Cuisine locale", "Fait maison", "Vin nature", "Partager", "Pain au levain", "Lisa Otterström", "Grégoire Lieutet"],
  authors: [{ name: "Lisa Otterström & Grégoire Lieutet" }],
  openGraph: {
    title: "Äkta Restaurant Genève",
    description: "Cuisine authentique, fait maison, vins suisses et assiettes à partager au cœur de Plainpalais.",
    url: "https://www.akta-restaurant.ch",
    siteName: "Äkta Restaurant",
    locale: "fr_CH",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#1e3f20", // Forest green
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
