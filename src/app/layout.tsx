import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { Toaster } from "sonner";
import { sidebarInitScript } from "@/components/shell/sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "Lyro",
    template: "%s · Lyro",
  },
  description: "Lyro — CRM para leads, pipeline, clientes e propostas.",
};

export const viewport: Viewport = {
  themeColor: "#f5f5f4",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} h-full antialiased`}
      // O script abaixo pode marcar o <html> antes de o React hidratar
      suppressHydrationWarning
    >
      <head>
        {/* Menu lateral recolhido salvo: aplica antes da primeira pintura (sem piscar) */}
        <script dangerouslySetInnerHTML={{ __html: sidebarInitScript }} />
      </head>
      <body className="min-h-full">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast:
                "!rounded-lg !border !border-line !bg-panel !text-ink !shadow-pop !font-sans !text-[13px]",
              description: "!text-ink-3",
              actionButton: "!bg-ink !text-white !rounded-md",
            },
          }}
        />
      </body>
    </html>
  );
}
