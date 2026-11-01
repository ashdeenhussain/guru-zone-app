import type { Metadata } from "next";
import IdValuationClient from "./IdValuationClient";
import { VALUATION_FAQS } from "@/lib/valuation";

export const metadata: Metadata = {
    title: "Free Fire ID Valuation & Market Price Calculator Pakistan | Check FF ID Price",
    description:
        "Calculate the real market price of your Free Fire ID instantly. Free online Free Fire account price estimator with live PKR rates for Evo Guns, Sakura bundles, Gloo walls, and player level. No login needed.",
    keywords: [
        "Free Fire ID Valuation",
        "Free Fire ID Price Calculator",
        "Free Fire Account Price Pakistan",
        "How much is my Free Fire ID worth",
        "Sell Free Fire ID Pakistan",
        "Free Fire ID Price Estimator",
        "Sakura ID price Pakistan",
        "Max Evo Gun account price",
        "Guru Zone Free Fire ID Calculator",
        "Free Fire ID check online"
    ],
    alternates: { canonical: "/id-valuation" },
    openGraph: {
        title: "Free Fire ID Valuation & Market Price Estimator | Guru Zone",
        description:
            "Calculate the real market value of your Free Fire account instantly. Interactive Free Fire ID calculator with PKR prices for Evo Guns, OG bundles, and profile stats.",
        url: "https://www.guru-zone.com/id-valuation",
        siteName: "Guru Zone Esports",
        images: [
            {
                url: "/logo.jpg",
                width: 1200,
                height: 630,
                alt: "Free Fire ID Valuation Tool Pakistan",
            },
        ],
        locale: "en_PK",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Free Fire ID Valuation Tool | How Much is Your Account Worth?",
        description: "Check your Free Fire ID market value instantly with our free interactive calculator. Live PKR rates in Pakistan.",
        images: ["/logo.jpg"],
    },
};

export default function IdValuationPage() {
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": VALUATION_FAQS.map((faq) => ({
            "@type": "Question",
            "name": faq.q,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.a
            }
        }))
    };

    const applicationSchema = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Free Fire ID Valuation & Market Price Calculator",
        "url": "https://www.guru-zone.com/id-valuation",
        "applicationCategory": "GameApplication, UtilityApplication",
        "operatingSystem": "All",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "PKR"
        },
        "description": "Free online Free Fire ID price calculator to estimate market resale value in Pakistan based on Evo Guns, OG season bundles, player level, and inventory."
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(applicationSchema) }}
            />
            <IdValuationClient />
        </>
    );
}
