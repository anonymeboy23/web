import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Noria | Gestion scolaire",
  description: "Une plateforme claire et sécurisée pour la vie scolaire.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
