import { Html, Head, Main, NextScript } from "next/document";
import { SEOElements } from "@/components/SEO";

export default function Document() {
  return (
    <Html lang="cs" suppressHydrationWarning>
      <Head>
        <SEOElements />
        
        {/* CRITICAL: Inline CSS to prevent FOUC - MUST be before any external CSS */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* ========================================
               CRITICAL CSS - Prevents Flash of Unstyled Content
               This renders IMMEDIATELY before any external resources
               ======================================== */
            
            /* Set correct background color instantly */
            html {
              background-color: #FAF8F5 !important;
              -webkit-text-size-adjust: 100%;
              -webkit-font-smoothing: antialiased;
            }
            
            /* Hide body until styles are loaded */
            body {
              margin: 0 !important;
              padding: 0 !important;
              background-color: #FAF8F5 !important;
              color: #1A3D3E !important;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
              
              /* CRITICAL: Hide unstyled content */
              opacity: 0 !important;
              overflow-x: hidden !important;
            }
            
            /* Show body when styles are ready */
            body.styles-ready {
              opacity: 1 !important;
              transition: opacity 0.15s ease-in;
            }
            
            /* Fallback: Show content if JavaScript fails completely */
            noscript body {
              opacity: 1 !important;
            }
            
            /* Prevent layout shift during load */
            #__next {
              min-height: 100vh;
            }
          `
        }} />
        
        {/* Preconnect to Google Fonts - CRITICAL for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Load Google Fonts via link tags (non-blocking) */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&family=Work+Sans:wght@400;500;600&display=swap" 
          rel="stylesheet"
        />
        
        {/* Theme initialization BEFORE hydration to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Initialize theme immediately to prevent flash
                try {
                  var theme = localStorage.getItem('theme') || 'light';
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.backgroundColor = '#0D1E1F';
                    document.body.style.backgroundColor = '#0D1E1F';
                  }
                } catch (e) {}
                
                // Multiple strategies to show content when styles are ready
                
                // Strategy 1: Show on DOMContentLoaded (fastest)
                var domReady = false;
                document.addEventListener('DOMContentLoaded', function() {
                  domReady = true;
                  showBody();
                });
                
                // Strategy 2: Show on window.load (fallback)
                window.addEventListener('load', function() {
                  showBody();
                });
                
                // Strategy 3: Timeout fallback (safety net)
                setTimeout(function() {
                  showBody();
                }, 300); // Max 300ms wait
                
                // Function to reveal body
                function showBody() {
                  if (typeof document !== 'undefined' && document.body) {
                    document.body.classList.add('styles-ready');
                  }
                }
                
                // Strategy 4: MutationObserver for React hydration
                if (typeof MutationObserver !== 'undefined') {
                  var observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                      if (mutation.target.id === '__next' && mutation.target.childNodes.length > 0) {
                        showBody();
                        observer.disconnect();
                      }
                    });
                  });
                  
                  // Start observing when DOM is ready
                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', function() {
                      var nextEl = document.getElementById('__next');
                      if (nextEl) observer.observe(nextEl, { childList: true });
                    });
                  } else {
                    var nextEl = document.getElementById('__next');
                    if (nextEl) observer.observe(nextEl, { childList: true });
                  }
                }
              })();
            `,
          }}
        />
        
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
        
        {/* Service Worker Registration with aggressive update checking */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                // Register service worker
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { 
                    scope: '/',
                    updateViaCache: 'none' // Don't cache the SW script itself
                  }).then(function(registration) {
                    console.log('SW registered:', registration.scope);
                    
                    // Check for updates EVERY time
                    registration.update();
                    
                    // Also check periodically (every 30 seconds)
                    setInterval(function() {
                      registration.update();
                    }, 30000);
                    
                    // When new SW is installed, reload page automatically
                    registration.addEventListener('updatefound', function() {
                      var newWorker = registration.installing;
                      newWorker.addEventListener('statechange', function() {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                          // New SW is waiting, tell user or auto-reload
                          console.log('New SW available, reloading...');
                          // Optional: Show "Update available" toast instead of auto-reload
                          // For now, we'll let user refresh manually or reload on next visit
                        }
                      });
                    });
                  }).catch(function(error) {
                    console.log('SW registration failed:', error);
                  });
                  
                  // When new SW takes control, reload page to get fresh assets
                  navigator.serviceWorker.addEventListener('controllerchange', function() {
                    console.log('New SW took control, reloading page...');
                    window.location.reload();
                  });
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
