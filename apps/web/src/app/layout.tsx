import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Umrah Hub | Strategic Intelligence Dashboard",
  description: "Next-gen CRM for Umrah & Islamic Education Aggregators",
};

import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import AppWrapper from "@/components/layout/AppWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.className} antialiased selection:bg-brand-500/30 selection:text-white`}>
        <ThemeProvider>
          <LanguageProvider>
            <AppWrapper>
              {children}
            </AppWrapper>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
