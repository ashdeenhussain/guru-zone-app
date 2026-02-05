import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/api/'], // Disallow admin and api routes
        },
        sitemap: 'https://guru-zone.com/sitemap.xml',
    }
}
