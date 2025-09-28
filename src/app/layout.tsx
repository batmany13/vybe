import "globals.css";

import { Inter } from "next/font/google";
import { type Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { Topbar } from "@/components/Topbar";
import { SelectedLPProvider } from "@/contexts/SelectedLPContext";



const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
})

const appName = process.env.APP_NAME || "Gandhi Capital Tracker";

export const metadata: Metadata = {
  title: appName,
  description: `${appName} - Venture Capital Management System`,
  icons: "https://vybe.build/vybe-icon.svg"
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.className}`}>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SelectedLPProvider>
            <Topbar />
            <main className="pt-12">{children}</main>
            <Toaster richColors />
          </SelectedLPProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
