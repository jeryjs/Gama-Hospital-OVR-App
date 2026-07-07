import { AuthProvider } from "@/components/AuthProvider";
import { SWRProvider } from "@/components/SWRProvider";
import { ThemeRegistry } from "@/components/ThemeRegistry";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { SITE } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    template: '%s | Gama Hospital OVR System',
    default: `${SITE.default_content} | Gama Hospital OVR System`,
  },
  description: SITE.description,
  icons: {
    icon: '/gama_icon.png',
    apple: '/gama_icon.png',
  },
  openGraph: {
    type: 'website',
    locale: SITE.locale,
    siteName: SITE.app_name_short,
    url: '/',
    title: `${SITE.default_content} | Gama Hospital OVR System`,
    description: SITE.description,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: `${SITE.app_name} — ${SITE.default_content}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.default_content} | Gama Hospital OVR System`,
    description: SITE.description,
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
