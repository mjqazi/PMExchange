import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://pmexchange.pk'),
  title: {
    default: 'PMX Pharma Exchange \u2014 Pakistan\'s B2B Pharmaceutical Export Marketplace',
    template: '%s | PMX Pharma Exchange',
  },
  description: 'Pakistan\'s first compliance-linked B2B pharmaceutical export marketplace. Connect with DRAP-certified manufacturers. WHO-GMP verified. Escrow-protected transactions. 200+ products across 47 verified manufacturers.',
  keywords: [
    'Pakistan pharmaceutical export', 'B2B pharma marketplace', 'DRAP certified manufacturers',
    'WHO-GMP pharmaceutical', 'Pakistan medicine export', 'bulk pharmaceutical supplier Pakistan',
    'pharmaceutical raw materials Pakistan', 'generic medicine manufacturer',
    'pharma export compliance', 'drug manufacturing Pakistan', 'GMP certified pharma',
    'pharmaceutical marketplace', 'medicine wholesale Pakistan', 'API supplier Pakistan',
    'Metformin manufacturer Pakistan', 'Amoxicillin supplier', 'Ciprofloxacin exporter',
    'pharmaceutical quality assurance', 'electronic batch records', 'CoA certificates',
    'SFDA approved drugs', 'Middle East pharma supplier', 'Africa medicine export',
    'pharmaceutical escrow payment', 'compliance quality score', 'PMX exchange',
  ],
  authors: [{ name: 'PMX Pharma Exchange' }],
  creator: 'PMX Pharma Exchange',
  publisher: 'PMX Pharma Exchange',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://pmexchange.pk',
    siteName: 'PMX Pharma Exchange',
    title: 'PMX Pharma Exchange \u2014 Pakistan\'s B2B Pharmaceutical Export Marketplace',
    description: 'Connect with DRAP-certified Pakistani pharmaceutical manufacturers. WHO-GMP verified quality. Escrow-protected B2B transactions. 200+ export-ready products.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'PMX Pharma Exchange' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PMX Pharma Exchange \u2014 Pakistan\'s B2B Pharmaceutical Export Marketplace',
    description: 'Connect with DRAP-certified Pakistani pharmaceutical manufacturers. WHO-GMP verified quality.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  verification: {
    google: 'GOOGLE_VERIFICATION_CODE_HERE',
  },
  alternates: {
    canonical: 'https://pmexchange.pk',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'PMX Pharma Exchange',
  url: 'https://pmexchange.pk',
  logo: 'https://pmexchange.pk/logo.png',
  description: 'Pakistan\'s first compliance-linked B2B pharmaceutical export marketplace',
  address: { '@type': 'PostalAddress', addressCountry: 'PK', addressLocality: 'Islamabad' },
  sameAs: ['https://github.com/mjqazi/PMExchange'],
  contactPoint: { '@type': 'ContactPoint', email: 'info@pmexchange.pk', contactType: 'customer service' },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'PMX Pharma Exchange',
  url: 'https://pmexchange.pk',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://pmexchange.pk/marketplace/search?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
