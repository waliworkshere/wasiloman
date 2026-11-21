import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Instrument_Sans } from "next/font/google";
import { LangProvider } from "@/lib/i18n";
import "./globals.css";

const latin = Instrument_Sans({ subsets: ["latin"], variable: "--font-latin", display: "swap" });
const arabic = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500", "600", "700"], variable: "--font-arabic", display: "swap" });

export const metadata: Metadata = {
  title: "Wasil Oman — WhatsApp marketing for Omani businesses",
  description: "Send WhatsApp offers to all your customers at once and answer them automatically. Arabic and English.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${latin.variable} ${arabic.variable}`}>
      <body className="font-sans">
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
