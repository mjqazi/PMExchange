import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/seller/', '/buyer/', '/admin/', '/login'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/seller/', '/buyer/', '/admin/', '/login'],
      },
    ],
    sitemap: 'https://pmexchange.pk/sitemap.xml',
  }
}
