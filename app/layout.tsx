import { AuthProvider } from "@/components/AuthProvider";
import { SWRProvider } from "@/components/SWRProvider";
import { ThemeRegistry } from "@/components/ThemeRegistry";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OVR System",
  description: "Occurrence Variance Reporting System for Healthcare",
  icons: {
    icon: '/gama_icon.png',
  },
};

async function getInitialTheme(): Promise<{ mode: 'light' | 'dark' | 'system'; resolved: 'light' | 'dark' }> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get('theme-mode')?.value as 'light' | 'dark' | 'system' | undefined;
  const mode = cookie ?? 'system';
  const resolved = mode === 'system' ? 'dark' : mode;
  return { mode, resolved };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { mode, resolved } = await getInitialTheme();
  return (
    <html lang="en">
      <body>
        <ThemeRegistry initialMode={mode} initialResolvedMode={resolved}>
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
