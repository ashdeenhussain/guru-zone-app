import { Metadata } from "next";
import PolicyPage from "@/components/PolicyPage";

export const metadata: Metadata = {
    title: "Refund Policy",
    description: "Learn about the refund conditions at Guru Zone, including tournament cancellations, wallet deposits, and shop purchases.",
};

export default function Refund() {
    return <PolicyPage type="refund" />;
}
