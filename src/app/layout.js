import { Nunito, Inter } from 'next/font/google'
import Script from 'next/script'
import BundleToast from '@/components/cart/BundleToast'
import SocialToast from '@/components/homepage/SocialToast'
import './globals.css'
import WhatsAppFloat from '@/components/layout/WhatsAppFloat'

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-nunito',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata = {
  title: { default: 'HK Games — Slime Artisanal Premium Tunisie', template: '%s | HK Games' },
  description: 'Slimes artisanaux premium en Tunisie — Unicolores, Bicolores et Buddies. Commandez en ligne, paiement à la livraison partout en Tunisie.',
  metadataBase: new URL('https://hap-p-kids.store'),
  openGraph: {
    title: 'HK Games Slime Store',
    description: 'Le Slime N°1 de Tunisie',
    images: ['/og/og-default.jpg'],
    locale: 'fr_TN',
    type: 'website',
  },
  icons: {
    icon: '/icons/hk-logo-192.png',
    apple: '/icons/hk-logo-192.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({ children }) {
  const pixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID

  return (
    <html lang="fr" className={`${nunito.variable} ${inter.variable}`}>
      <head>
        {/* Préconnexion Supabase — réduit le LCP des images */}
        <link rel="preconnect" href="https://rsmebjtwmvwyeocvsowg.supabase.co" />
        <link rel="dns-prefetch" href="https://rsmebjtwmvwyeocvsowg.supabase.co" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {pixelId && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${pixelId}');
                fbq('track', 'PageView');
              `,
            }}
          />
        )}
      </head>
      <body>
        {/* Background blobs */}
        <div className="blob blob-1" aria-hidden="true" />
        <div className="blob blob-2" aria-hidden="true" />
        <div className="blob blob-3" aria-hidden="true" />
        <WhatsAppFloat />

        <div style={{ position: 'relative', zIndex: 1 }}>
    
          {/* Microsoft Clarity */}
          <Script
            id="ms-clarity"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "pdebfub46n");`,
            }}
          />
      {children}
      <BundleToast />
        <SocialToast />
        </div>


        {/* Service Worker registration — force update Android */}
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    // Forcer la vérification de mise à jour du SW
                    reg.update();
                    // Écouter les mises à jour
                    reg.addEventListener('updatefound', function() {
                      var newWorker = reg.installing;
                      if (newWorker) {
                        newWorker.addEventListener('statechange', function() {
                          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                          }
                        });
                      }
                    });
                  }).catch(function(err) {
                    console.warn('SW registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
