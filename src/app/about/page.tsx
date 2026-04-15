import { Metadata } from "next";
import AboutContent from "@/components/AboutContent";
import connectDB from "@/lib/db";
import LandingPageContent from "@/models/LandingPageContent";

export const metadata: Metadata = {
    title: "About Us",
    description: "Learn more about Guru Zone, Pakistan's leading esports platform. Our mission, vision, and the team behind the ultimate Free Fire tournament experience.",
    keywords: ["About Guru Zone", "Esports Mission", "Guru Zone Team", "Pakistan Gaming Platform"],
};

export default async function AboutPage() {
    let content = null;
    try {
        await connectDB();
        content = await LandingPageContent.findOne().lean();
    } catch (error) {
        console.error("Error fetching about page content:", error);
    }

    return <AboutContent content={content ? JSON.parse(JSON.stringify(content)) : null} />;
}
