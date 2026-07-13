import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import Navbar from '../components/Navbar';

export const metadata: Metadata = {
  title: 'Truvial - Transparent Charity Fund Distribution System',
  description: 'A decentralized treasury and milestone payout management platform built on Stellar Soroban.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-screen flex-col bg-canvas font-sans antialiased text-body-text overflow-x-hidden">
        <Providers>
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
            {children}
          </main>
          <footer className="border-t border-hairline bg-canvas py-8 px-6 text-center">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between font-sans text-xs text-charcoal">
              <div>
                &copy; {new Date().getFullYear()} Truvial Inc. Built for transparent, milestone-driven giving.
              </div>
              <div className="flex items-center space-x-2 mt-4 md:mt-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-green"></span>
                </span>
                <span className="font-mono text-ash">Stellar Network: Active</span>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
