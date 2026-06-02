import { Metadata } from "next";
import PolicyPage from "@/components/PolicyPage";
import { getLandingPageContent } from "@/lib/landing";

export const revalidate = 300;

export const metadata: Metadata = {
    title: "Refund Policy",
    description: "Learn about the refund conditions at Guru Zone, including tournament cancellations, wallet deposits, and shop purchases.",
};

export default async function Refund() {
    const content = await getLandingPageContent();
    const serializedContent = JSON.parse(JSON.stringify(content));

    return <PolicyPage type="refund" content={serializedContent} />;
}
