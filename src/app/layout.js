import { Nunito, Inter } from 'next/font/google'
import Script from 'next/script'
import BundleToast from '@/components/cart/BundleToast'
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
  title: {
    default:  'HK Games — Slime Tunisie | Achetez Slime Premium en Ligne',
    template: '%s | HK Games Slime Tunisie',
  },
  description:
    'Achetez du slime premium en Tunisie — Slime Unicolore, Bicolore et Buddy 170g. Livraison rapide Navex partout en Tunisie, paiement à la livraison. Jouet sensoriel certifié pour enfants.',
  metadataBase: new URL('https://www.hap-p-kids.store'),
  keywords: [
    'slime','vendre slime tunisie','vente slime tunisie','slime à vendre tunisie','vendre slime','slime tunisie','acheter slime','slime premium tunisie',
    'slime enfant','slime enfant tunisie','slime livraison tunisie',
    'jouet slime tunisie','slime unicolore','slime bicolore','slime buddy',
    'hk games','slime asmr','slime asmr tunisie','slime satisfaisant',
    'slime pas cher tunisie','cadeau enfant tunisie','cadeau anniversaire enfant',
    'jouet sensoriel enfant','slime 170g','slime certifié enfants',
    'jouet créatif tunisie','slime paiement livraison','slime navex',
    'slime tunis','slime sfax','slime sousse','slime nabeul',
    'pate slime tunisie','slime anti-stress','slime 2026 tunisie',
  ],
  authors:  [{ name: 'HK Games', url: 'https://www.hap-p-kids.store' }],
  creator:  'HK Games',
  publisher:'HK Games',
  robots: {
    index:          true,
    follow:         true,
    googleBot: {
      index:             true,
      follow:            true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet':       -1,
    },
  },
  openGraph: {
    type:        'website',
    locale:      'fr_TN',
    url:         'https://www.hap-p-kids.store',
    siteName:    'HK Games',
    title:       'HK Games — Slime Premium en Tunisie',
    description: 'Le slime N°1 de Tunisie. Unicolore, Bicolore et Buddy 170g. Livraison Navex, paiement à la livraison.',
    images: [{
      url:    'https://www.hap-p-kids.store/og/og-default.jpg',
      width:  1200,
      height: 630,
      alt:    'HK Games — Slime Premium Tunisie',
    }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'HK Games — Slime Premium en Tunisie',
    description: 'Le slime N°1 de Tunisie. Livraison partout, paiement à la livraison.',
    images:      ['https://www.hap-p-kids.store/og/og-default.jpg'],
  },
  alternates: {
    canonical: 'https://www.hap-p-kids.store',
  },
  icons: {
    icon:  [
      { url: '/icons/hk-logo-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/hk-logo-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple:    '/icons/hk-logo-192.png',
    shortcut: '/icons/hk-logo-192.png',
  },
  manifest: '/manifest.json',
  verification: {
    google: '6dT3Ex5aE0-WHJaV5l3WK1PhYt3YWIIrKsNoqW6Kbrk',
  },
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
