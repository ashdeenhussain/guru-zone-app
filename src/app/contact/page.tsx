import { Metadata } from "next";
import ContactContent from "@/components/ContactContent";
import connectDB from "@/lib/db";
import LandingPageContent from "@/models/LandingPageContent";

export const metadata: Metadata = {
    title: "Contact Us",
    description: "Contact the Guru Zone support team for assistance with tournaments, withdrawals, or partnerships. We're here to help you with Pakistan's best esports experience.",
    keywords: ["Contact Guru Zone", "Esports Support", "Guru Zone WhatsApp", "Tournament Assistance"],
};

export default async function ContactPage() {
    let content = null;
    try {
        await connectDB();
        content = await LandingPageContent.findOne().lean();
    } catch (error) {
        console.error("Error fetching contact page content:", error);
    }

    return <ContactContent content={content ? JSON.parse(JSON.stringify(content)) : null} />;
}
