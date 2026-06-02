import { Metadata } from "next";
import PolicyPage from "@/components/PolicyPage";
import { getLandingPageContent } from "@/lib/landing";

export const revalidate = 300;

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "Our Privacy Policy outlines how Guru Zone collects, uses, and protects your personal and financial information. We prioritize your privacy and data security.",
};

export default async function Privacy() {
    const content = await getLandingPageContent();
    const serializedContent = JSON.parse(JSON.stringify(content));

    return <PolicyPage type="privacy" content={serializedContent} />;
}
