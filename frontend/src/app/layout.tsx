import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chapter One — Relationship-First Dating',
  description: 'Every relationship deserves a better first chapter.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
