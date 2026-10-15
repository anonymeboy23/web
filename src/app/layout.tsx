import type { Metadata } from "next";
import "./globals.css";
import SchoolBranding from "./school-branding";

export const metadata: Metadata = {
  title: "Noria | Gestion scolaire",
  description: "Une plateforme claire et sécurisée pour la vie scolaire.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr">
      <body><SchoolBranding />{children}</body>
    </html>
  );
}
