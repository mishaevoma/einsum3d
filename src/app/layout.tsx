import type { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/next';
import '@fortawesome/fontawesome-svg-core/styles.css';
import '@/styles/main.css';
import styles from './layout.module.scss';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={styles.html}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Roboto&family=Merriweather:ital@0;1&display=swap"
        />
      </head>
      <body className={styles.body}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
