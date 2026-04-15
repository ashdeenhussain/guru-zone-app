import { Metadata } from "next";
import PolicyPage from "@/components/PolicyPage";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "Our Privacy Policy outlines how Guru Zone collects, uses, and protects your personal and financial information. We prioritize your privacy and data security.",
};

export default function Privacy() {
    return <PolicyPage type="privacy" />;
}
