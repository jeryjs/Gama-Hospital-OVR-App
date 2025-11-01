import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import { ThemeRegistry } from "@/components/ThemeRegistry";
import { AuthProvider } from "@/components/AuthProvider";
import { SWRProvider } from "@/components/SWRProvider";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

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
      <body className={inter.variable}>
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
