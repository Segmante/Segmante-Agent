import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { SuperMemoryNavbar } from '@/components/supermemory-navbar';
import { SuperMemoryFooter } from '@/components/supermemory-footer';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Segmante AI Agent - Shopify Product Management',
  description: 'Next-gen AI Agent for Shopify product management powered by Sensay',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-slate-900">
            <SuperMemoryNavbar />
            <main className="pt-0">
              {children}
            </main>
            <SuperMemoryFooter />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}