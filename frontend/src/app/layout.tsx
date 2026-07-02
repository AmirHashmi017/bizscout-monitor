import type { Metadata, Viewport } from 'next';
import './globals.css';

// Root layout and page metadata.
export const metadata: Metadata = {
  title: 'BizScout Monitor',
  description: 'Real-time HTTP monitoring dashboard with LLM-powered insights',
};

// Correct scaling on mobile devices.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
