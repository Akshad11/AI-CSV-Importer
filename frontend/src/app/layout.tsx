import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'LeadFlow AI | Intelligent CRM CSV Importer',
  description:
    'Extract CRM lead data with high precision from any CSV file using advanced AI parser extraction.',
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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="h-full flex bg-background text-foreground font-sans selection:bg-indigo-500/20 selection:text-indigo-600 transition-colors duration-150 overflow-hidden">
        <Providers>
          <div className="flex w-full h-full overflow-hidden">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Application Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* Header */}
              <Header />

              {/* Main Scrollable Content */}
              <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 outline-none">
                <div className="max-w-7xl mx-auto w-full h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
