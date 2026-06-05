import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

import "@/styles/globals.css";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "Evidoxa",
  description: "Historical research management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="de"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              classNames: {
                toast: "bg-card border border-border text-foreground shadow-md rounded-lg",
                title: "text-sm font-semibold",
                description: "text-sm text-muted-foreground",
                actionButton:
                  "bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium px-3 py-1.5 rounded-md",
                cancelButton:
                  "bg-muted text-muted-foreground hover:bg-muted/80 text-xs font-medium px-3 py-1.5 rounded-md",
                closeButton: "text-muted-foreground hover:text-foreground",
                success: "bg-success-background border-success-border text-success-foreground",
                error:
                  "bg-destructive-background border-destructive-border text-destructive-foreground",
                warning: "bg-warning-background border-warning-border text-warning-foreground",
                info: "bg-info-background border-info-border text-info-foreground",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
