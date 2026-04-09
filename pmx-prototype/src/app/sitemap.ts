import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://pmexchange.pk'

  // Static pages
  const staticPages = [
    { url: `${baseUrl}/marketplace`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${baseUrl}/marketplace/search`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.3 },
  ]

  // Product pages (from hardcoded marketplace data)
  const productIds = [
    'lg-metformin-500', 'lg-atorvastatin-40', 'lg-ciprofloxacin-500', 'lg-amoxicillin-250',
    'kp-metformin-500', 'kp-omeprazole-20', 'kp-amlodipine-5',
    'mm-paracetamol-500', 'mm-ibuprofen-400', 'mm-cetirizine-10',
    'fm-metformin-500', 'lg-losartan-50', 'kp-ranitidine-150',
    'mm-salbutamol-4', 'lg-glimepiride-2'
  ]

  const productPages = productIds.map(id => ({
    url: `${baseUrl}/marketplace/product/${id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Seller pages
  const sellerIds = ['lahore-generics', 'karachi-pharmacorp', 'multan-medgen', 'faisalabad-meds']
  const sellerPages = sellerIds.map(id => ({
    url: `${baseUrl}/marketplace/seller/${id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Search pages for key drug categories
  const categorySearches = [
    'metformin', 'amoxicillin', 'ciprofloxacin', 'atorvastatin', 'paracetamol',
    'ibuprofen', 'omeprazole', 'amlodipine', 'losartan', 'cetirizine',
    'cardiovascular', 'anti-diabetics', 'anti-infectives', 'analgesics',
    'gastrointestinal', 'respiratory',
    'pakistan pharmaceutical', 'WHO-GMP', 'DRAP certified', 'pharma export'
  ]
  const searchPages = categorySearches.map(q => ({
    url: `${baseUrl}/marketplace/search?q=${encodeURIComponent(q)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...productPages, ...sellerPages, ...searchPages]
}
