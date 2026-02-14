import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { FeedbackProvider } from "@/components/Feedback";
import { AuthSessionProvider } from "@/components/AuthSessionProvider";
import { I18nProvider } from "@/lib/i18n";
import { CinematicProvider } from "@/components/CinematicCombat";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: '#050508',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  colorScheme: 'dark',
};

export const metadata: Metadata = {
  title: {
    default: "Taverna — Your D&D Table, Online",
    template: "%s | Taverna",
  },
  description: "A premium platform for playing Dungeons & Dragons online. Real-time sessions, interactive battle maps, character sheets, dice rolling, lore wiki, quest tracking, and everything your party needs.",
  icons: { icon: "/favicon.svg" },
  keywords: ["D&D", "Dungeons & Dragons", "tabletop RPG", "online D&D", "virtual tabletop", "DnD 5e", "campaign manager"],
  authors: [{ name: "Taverna" }],
  creator: "Taverna",
  openGraph: {
    title: "Taverna — Your D&D Table, Online",
    description: "A premium platform for playing Dungeons & Dragons online with your party. Voice, maps, dice, and everything your DM needs.",
    type: "website",
    siteName: "Taverna",
  },
  twitter: {
    card: "summary_large_image",
    title: "Taverna — Your D&D Table, Online",
    description: "A premium platform for playing Dungeons & Dragons online.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-surface-0 text-text-primary min-h-screen`}
      >
        <I18nProvider>
          <CinematicProvider>
            <AuthSessionProvider>
              <FeedbackProvider>
                {children}
              </FeedbackProvider>
            </AuthSessionProvider>
          </CinematicProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
