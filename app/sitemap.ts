import { MetadataRoute } from 'next';
import { SITE } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date();

    return [
        {
            url: SITE.url,
            lastModified: now,
            changeFrequency: 'yearly',
            priority: 1,
        },
        {
            url: `${SITE.url}/login`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.9,
        },
    ];
}
