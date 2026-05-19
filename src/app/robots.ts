import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/dashboard/',
                '/wallet/',
                '/api/',
                '/admin/',
                '/_next/'
            ],
        },
        sitemap: 'https://www.guru-zone.com/sitemap.xml',
    }
}
