import type { Metadata } from 'next';
import MarketplaceShell from './MarketplaceShell';

export const metadata: Metadata = {
  title: 'Pharmaceutical Marketplace \u2014 Browse DRAP-Certified Medicines & Manufacturers',
  description: 'Browse 200+ export-ready pharmaceutical products from DRAP-certified Pakistani manufacturers. WHO-GMP verified quality. Compare prices, CQS scores, and certifications. Escrow-protected B2B transactions.',
  keywords: [
    'pharmaceutical marketplace Pakistan', 'DRAP certified medicines', 'WHO-GMP manufacturers',
    'buy medicines wholesale', 'pharmaceutical export Pakistan', 'generic drugs Pakistan',
    'bulk medicine supplier', 'pharma B2B marketplace',
  ],
  openGraph: {
    title: 'PMX Pharma Exchange \u2014 Browse Pharmaceutical Products & Manufacturers',
    description: 'Browse 200+ export-ready pharmaceutical products from DRAP-certified Pakistani manufacturers. WHO-GMP verified quality.',
    url: 'https://pmexchange.pk/marketplace',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'PMX Pharma Exchange Marketplace' }],
  },
  alternates: {
    canonical: 'https://pmexchange.pk/marketplace',
  },
};

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return <MarketplaceShell>{children}</MarketplaceShell>;
}
