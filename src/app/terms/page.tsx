import { Metadata } from "next";
import PolicyPage from "@/components/PolicyPage";

export const metadata: Metadata = {
    title: "Terms of Service",
    description: "Read the Terms of Service for using Guru Zone. Understand our rules regarding tournament eligibility, fair play, and virtual currency usage.",
};

export default function Terms() {
    return <PolicyPage type="terms" />;
}
