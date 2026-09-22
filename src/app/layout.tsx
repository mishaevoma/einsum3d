import type { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/next';
import '@/styles/main.css';
import styles from './layout.module.scss';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={styles.html}>
      <body className={styles.body}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
