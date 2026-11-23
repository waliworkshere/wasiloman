import type { Metadata, Viewport } from "next";
import { Geist, IBM_Plex_Sans_Arabic } from "next/font/google";
import { LangProvider } from "@/lib/i18n";
import "./globals.css";

const latin = Geist({ subsets: ["latin"], variable: "--font-latin", display: "swap" });
const arabic = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500", "600", "700"], variable: "--font-arabic", display: "swap" });

export const metadata: Metadata = {
  title: "WasilOman — WhatsApp marketing for shops and businesses in Oman",
  description: "Send one WhatsApp offer to all your customers, see who read it, and let a bot answer the daily questions. Arabic and English, on the official WhatsApp Business API.",
  openGraph: { title: "WasilOman — WhatsApp marketing for businesses in Oman", description: "Bulk WhatsApp messages, a shared inbox and auto-reply bots. Arabic and English.", images: ["/photos/photo-f183280244-960.jpg"] },
};

export const viewport: Viewport = { themeColor: "#000000" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${latin.variable} ${arabic.variable}`}>
      <body className="font-sans">
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
