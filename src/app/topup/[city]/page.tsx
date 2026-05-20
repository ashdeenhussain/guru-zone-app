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
    
    // Fetch initial data for SEO pre-rendering
    let initialData = null;
    try {
        await connectDB();
        initialData = await LandingPageContent.findOne().lean();
    } catch (error) {
        console.error("Error fetching landing page data server-side:", error);
    }
    
    return <LandingPage initialData={initialData ? JSON.parse(JSON.stringify(initialData)) : null} city={city} />;
}
