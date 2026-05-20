import { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/blog'

const CITY_SLUGS = [
  'lahore', 'karachi', 'islamabad', 'faisalabad',
  'multan', 'peshawar', 'gujranwala', 'rawalpindi'
]

export default function sitemap(): MetadataRoute.Sitemap {
  const cityEntries: MetadataRoute.Sitemap = CITY_SLUGS.map((city) => ({
    url: `https://www.guru-zone.com/topup/${city}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.85,
  }))

  // Dynamically include all blog posts
  const blogEntries: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `https://www.guru-zone.com/blog/${post.slug}`,
    lastModified: new Date(post.dateModified),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  return [
    {
      url: 'https://www.guru-zone.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: 'https://www.guru-zone.com/battle-zone',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: 'https://www.guru-zone.com/topup',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...cityEntries,
    {
      url: 'https://www.guru-zone.com/dashboard/shop',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://www.guru-zone.com/blog',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...blogEntries,
    {
      url: 'https://www.guru-zone.com/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://www.guru-zone.com/contact',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]
}
