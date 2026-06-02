import { Metadata } from "next";
import PolicyPage from "@/components/PolicyPage";
import { getLandingPageContent } from "@/lib/landing";

export const revalidate = 300;

export const metadata: Metadata = {
    title: "Terms of Service",
    description: "Read the Terms of Service for using Guru Zone. Understand our rules regarding tournament eligibility, fair play, and virtual currency usage.",
};

export default async function Terms() {
    const content = await getLandingPageContent();
    const serializedContent = JSON.parse(JSON.stringify(content));

    return <PolicyPage type="terms" content={serializedContent} />;
}
