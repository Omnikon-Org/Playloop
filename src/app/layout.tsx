import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import './globals.css';
import { AppShell } from '../components/layout/AppShell';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#07070c',
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'PLAYLOOP - Playable Content Feed',
  description: 'A platform for playable HTML5 mini-games.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.variable} ${inter.variable} font-sans bg-[#07070c] text-white overflow-hidden`}>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
