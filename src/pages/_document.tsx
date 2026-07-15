import { Html, Head, Main, NextScript } from "next/document";
import { SEOElements } from "@/components/SEO";

export default function Document() {
  return (
    <Html lang="cs" suppressHydrationWarning>
      <Head>
        <SEOElements />
        
        {/* Viewport - CRITICAL for mobile */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0F5156" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* iOS PWA specific */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Ukaž Rybu" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js', { 
                    updateViaCache: 'none' 
                  }).then(
                    (registration) => {
                      console.log('SW registered: ', registration);
                      // Check for updates immediately after registration
                      registration.update();
                    },
                    (err) => {
                      console.log('SW registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
