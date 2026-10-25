import type { Metadata } from "next";
import "./globals.css";
import { AdminProvider } from "@/context/AdminContext";

export const metadata: Metadata = {
  title: "RIWY — SuperAdmin Dashboard | Rook Eventi Toscana",
  description: "Piattaforma di controllo totale per l'app mobile Rook (Eventi, Utenti, Organizzatori, Audit Log)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className="dark">
      <body className="bg-[#090d16] text-slate-100 min-h-screen">
        <AdminProvider>{children}</AdminProvider>
      </body>
    </html>
  );
}
