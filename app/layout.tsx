import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Pacifico } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/firebase/auth-context'
import { SettingsProvider } from '@/lib/settings-context'
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register'
import { JsonLd } from '@/components/seo/json-ld'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const pacifico = Pacifico({ weight: "400", subsets: ["latin"], variable: "--font-logo" });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
}

export const metadata: Metadata = {
  title: {
    default: '貸金業務取扱主任者 対策アプリ | Kashikin',
    template: '%s | Kashikin',
  },
  description: '貸金試験の対策アプリKashikin。過去7年分の問題を無料で学習可能。隙間時間に効率的な学習が出来ます。',
  keywords: [
    '貸金業務取扱主任者',
    '貸金業務取扱主任者試験',
    '貸金業務取扱主任者 過去問',
    '貸金業務取扱主任者 問題集',
    '貸金業務取扱主任者 対策',
    '貸金業務取扱主任者 アプリ',
    '貸金業務取扱主任者 勉強',
    '貸金業 資格',
    '金融資格',
    '資格試験 アプリ',
  ],
  authors: [{ name: 'Kashikin' }],
  creator: 'Kashikin',
  publisher: 'Kashikin',
  manifest: '/manifest.json',
  metadataBase: new URL('https://kashikin.app'),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: '貸金業務取扱主任者 対策アプリ | Kashikin',
    description: '貸金試験の対策アプリKashikin。過去7年分の問題を無料で学習可能。隙間時間に効率的な学習が出来ます。',
    type: 'website',
    locale: 'ja_JP',
    url: 'https://kashikin.app',
    siteName: 'Kashikin',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '貸金業務取扱主任者 対策アプリ Kashikin',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '貸金業務取扱主任者 対策アプリ | Kashikin',
    description: '貸金試験の対策アプリKashikin。過去7年分の問題を無料で学習可能。隙間時間に効率的な学習が出来ます。',
    images: ['/og-image.png'],
    creator: '@kashikin_app',
  },
  verification: {
    google: 'YOUR_GOOGLE_VERIFICATION_CODE',
  },
  category: '教育',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Kashikin',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon-32x32.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <head>
        <JsonLd />
      </head>
      <body className={`font-sans antialiased ${pacifico.variable}`}>
        <ServiceWorkerRegister />
        <SettingsProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </SettingsProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
