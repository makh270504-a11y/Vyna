import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Cormorant_Garamond } from 'next/font/google'
import { CartProvider } from '@/lib/cart-context'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Toaster } from '@/components/ui/sonner'
import { ChatWidget } from '@/components/chatbot/chat-widget'
import { headers } from 'next/headers'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Vyna — Beauté, accessoires et essentiels',
  description:
    'Boutique en ligne de produits de beauté, accessoires et lifestyle sélectionnés avec soin. Commandez directement en ligne, livraison internationale.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f7f4ee',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headersList = await headers()
  const isComingSoon = headersList.get('x-coming-soon') === 'true'

  return (
    <html lang="fr" className={`${inter.variable} ${cormorant.variable} bg-background`}>
      <body className="font-sans antialiased">
        <CartProvider>
          {!isComingSoon && <SiteHeader />}
          <main className={isComingSoon ? "min-h-screen flex flex-col" : "min-h-screen"}>
            {children}
          </main>
          {!isComingSoon && <SiteFooter />}
          {!isComingSoon && <ChatWidget />}
        </CartProvider>
        <Toaster position="top-center" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
