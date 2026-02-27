import React from 'react';
import { LanguageProvider } from '@/components/LanguageContext';
import { ThemeProvider } from '@/components/ThemeContext';

export default function Layout({ children }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <div className="min-h-screen bg-[#F1F1F2] dark:bg-slate-900 text-slate-900 dark:text-white">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover" />
          <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
          <meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)" />
          <meta name="color-scheme" content="light dark" />
          <style>{`
            :root {
              --background: 0 0% 100%;
              --foreground: 0 0% 3.9%;
            }
            .dark {
              --background: 0 0% 3.9%;
              --foreground: 0 0% 98%;
            }

            /* Global responsive reset */
            * {
              transition: background-color 0.3s ease, color 0.2s ease, border-color 0.2s ease;
              overflow-wrap: break-word;
              word-wrap: break-word;
              box-sizing: border-box;
            }

            html, body, #root, #__next, main {
              background-color: transparent !important;
              overflow-x: hidden;
              max-width: 100vw;
            }

            /* Responsive images */
            img, video, svg, iframe {
              max-width: 100%;
              height: auto;
            }

            /* Touch-friendly buttons */
            button, a {
              min-height: 44px;
              min-width: 44px;
              touch-action: manipulation;
            }

            /* Mobile-first typography */
            body {
              font-size: clamp(14px, 4vw, 18px);
            }

            .rtl {
              direction: rtl;
            }

            /* Sidebar fix - complete removal */
            [role="dialog"][aria-hidden="true"],
            .sidebar[aria-hidden="true"],
            [class*="sidebar"][aria-hidden="true"],
            [class*="drawer"][aria-hidden="true"],
            [class*="overlay"][aria-hidden="true"] {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
              pointer-events: none !important;
              width: 0 !important;
              height: 0 !important;
              overflow: hidden !important;
            }

            /* Responsive breakpoints */
            @media screen and (max-width: 1024px) {
              .container, .section, .card {
                padding-left: 16px;
                padding-right: 16px;
              }
            }
          `}</style>
          {children}
        </div>
      </LanguageProvider>
    </ThemeProvider>
  );
}
