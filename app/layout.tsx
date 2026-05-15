import { AuthProvider } from "@/components/AuthProvider";
import { SWRProvider } from "@/components/SWRProvider";
import { ThemeRegistry } from "@/components/ThemeRegistry";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OVR System - Gama Hospital",
  description: "Occurrence Variance Reporting System for Healthcare",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <AuthProvider>
            <SWRProvider>
              {children}
            </SWRProvider>
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
