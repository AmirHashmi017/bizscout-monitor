import type { Metadata } from 'next';
import './globals.css';

// Root layout and page metadata.
export const metadata: Metadata = {
  title: 'BizScout Monitor',
  description: 'Real-time HTTP monitoring dashboard with LLM-powered insights',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
