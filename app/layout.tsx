import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = { title: { default: 'UniLab · Book. Learn. Innovate.', template: '%s | UniLab' }, description: 'Your university labs and equipment, all in one place.' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f7faff' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
