import type { Metadata } from "next";
import TopUpPageClient from "./TopUpPageClient";

export const metadata: Metadata = {
    title: "Free Fire Top Up Pakistan | Instant Diamonds via JazzCash & EasyPaisa",
    description:
        "Get instant Free Fire diamond top-ups in Pakistan. Buy Weekly/Monthly Memberships & Level Up Passes safely via EasyPaisa and JazzCash. Trusted platform since 2023. Fast WhatsApp delivery.",
    keywords: [
        "Free Fire Top up Pakistan",
        "FF Diamonds JazzCash",
        "Buy Free Fire Diamonds EasyPaisa",
        "Level Up Pass Free Fire",
        "Free Fire Membership Pakistan",
        "Guru Zone Top Up",
    ],
    alternates: { canonical: "/topup" },
    openGraph: {
        title: "Free Fire Top Up Pakistan | Instant Diamonds via JazzCash & EasyPaisa",
        description:
            "Get instant Free Fire diamond top-ups in Pakistan. Buy Weekly/Monthly Memberships & Level Up Passes safely via EasyPaisa and JazzCash. Trusted platform since 2023. Fast WhatsApp delivery.",
        url: "https://www.guru-zone.com/topup",
    },
};

export default function TopUpPage() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Free Fire Diamonds",
        "description": "Instant Free Fire diamond top-ups in Pakistan. Buy Weekly/Monthly Memberships & Level Up Passes.",
        "image": "https://www.guru-zone.com/logo.jpg",
        "brand": {
            "@type": "Brand",
            "name": "Guru Zone"
        },
        "offers": {
            "@type": "Offer",
            "url": "https://www.guru-zone.com/topup",
            "priceCurrency": "PKR",
            "price": "100", 
            "availability": "https://schema.org/InStock",
            "seller": {
                "@type": "Organization",
                "name": "Guru Zone"
            }
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "1250"
        }
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <TopUpPageClient />
        </>
    );
}
