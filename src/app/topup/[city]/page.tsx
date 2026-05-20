import LandingPage from "@/components/LandingPage";
import type { Metadata } from 'next';
import connectDB from "@/lib/db";
import LandingPageContent from "@/models/LandingPageContent";

type Props = {
    params: Promise<{ city: string }>
};

export async function generateStaticParams() {
    const cities = ['lahore', 'karachi', 'islamabad', 'faisalabad', 'multan', 'peshawar', 'gujranwala', 'rawalpindi'];
    return cities.map((city) => ({
        city: city,
    }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { city: paramCity } = await params;
    const city = paramCity.charAt(0).toUpperCase() + paramCity.slice(1);
    
    return {
        title: `Free Fire Top Up & Tournaments in ${city} | Guru Zone`,
        description: `Looking for instant Free Fire top up or custom tournaments in ${city}? Get safe diamonds via JazzCash/EasyPaisa and join the best eSports community in ${city}.`,
        keywords: [`Free Fire Top Up ${city}`, `Buy FF Diamonds ${city}`, `Free Fire Tournaments ${city}`, `Guru Zone ${city}`],
        alternates: {
            canonical: `https://www.guru-zone.com/topup/${paramCity}`,
        },
        openGraph: {
            title: `Free Fire Top Up & Tournaments in ${city} | Guru Zone`,
            description: `Looking for instant Free Fire top up or custom tournaments in ${city}? Get safe diamonds via JazzCash/EasyPaisa and join the best eSports community in ${city}.`,
            url: `https://www.guru-zone.com/topup/${paramCity}`,
        }
    };
}

export default async function CityPage({ params }: Props) {
    const { city } = await params;
    const cityName = city.charAt(0).toUpperCase() + city.slice(1);

    // Fetch initial data for SEO pre-rendering
    let initialData = null;
    try {
        await connectDB();
        initialData = await LandingPageContent.findOne().lean();
    } catch (error) {
        console.error("Error fetching landing page data server-side:", error);
    }

    // JSON-LD: LocalBusiness + Product structured data for city-level SEO
    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "LocalBusiness",
                "@id": `https://www.guru-zone.com/topup/${city}`,
                "name": `Guru Zone - Free Fire Top Up ${cityName}`,
                "description": `Instant Free Fire diamond top-ups in ${cityName}. Buy diamonds, memberships & Level Up Passes safely via JazzCash and EasyPaisa.`,
                "url": `https://www.guru-zone.com/topup/${city}`,
                "logo": "https://www.guru-zone.com/logo.jpg",
                "image": "https://www.guru-zone.com/logo.jpg",
                "telephone": "+92-000-0000000",
                "areaServed": {
                    "@type": "City",
                    "name": cityName,
                    "containedInPlace": {
                        "@type": "Country",
                        "name": "Pakistan"
                    }
                },
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": cityName,
                    "addressCountry": "PK"
                },
                "sameAs": [
                    "https://www.guru-zone.com"
                ],
                "priceRange": "PKR 100 - PKR 5000",
                "openingHours": "Mo-Su 00:00-23:59",
                "paymentAccepted": "JazzCash, EasyPaisa",
                "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "4.8",
                    "reviewCount": "1250"
                }
            },
            {
                "@type": "Product",
                "name": `Free Fire Diamonds - ${cityName}`,
                "description": `Get instant Free Fire diamond top-ups in ${cityName} via JazzCash and EasyPaisa. 100% safe and official delivery to your UID.`,
                "brand": {
                    "@type": "Brand",
                    "name": "Guru Zone"
                },
                "offers": {
                    "@type": "Offer",
                    "url": `https://www.guru-zone.com/topup/${city}`,
                    "priceCurrency": "PKR",
                    "price": "100",
                    "availability": "https://schema.org/InStock",
                    "areaServed": cityName,
                    "seller": {
                        "@type": "Organization",
                        "name": "Guru Zone"
                    }
                }
            },
            {
                "@type": "FAQPage",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": `How to buy Free Fire Diamonds in ${cityName}?`,
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": `Guru Zone offers instant Free Fire top-ups in ${cityName} without any hassle. Simply enter your UID, select your package, and pay securely via JazzCash or EasyPaisa.`
                        }
                    },
                    {
                        "@type": "Question",
                        "name": `Are there any custom Free Fire tournaments in ${cityName}?`,
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": `Yes! Gamers from ${cityName} can join Guru Zone's daily custom rooms and Battle Zone matches to compete and earn real rewards.`
                        }
                    }
                ]
            }
        ]
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <LandingPage initialData={initialData ? JSON.parse(JSON.stringify(initialData)) : null} city={city} />
        </>
    );
}
