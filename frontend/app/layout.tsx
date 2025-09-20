import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import Providers from "@/components/providers";

const fontSans = Montserrat({
  subsets: ["latin"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  title: "Save a Planet",
  description: ""
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn("min-h-screen font-sans antialiased", fontSans.variable)}
      >
        <link rel="icon" href="/kenlogo.png" sizes="any" />
        <Toaster
          position="top-right"
          richColors
          closeButton
          visibleToasts={9}
          toastOptions={{
            duration: 10000
          }}
        />
        <Providers>
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
