import type { Metadata } from "next";
import TopUpPageClient from "./TopUpPageClient";

export const metadata: Metadata = {
    title: "Free Fire Diamond Top Up | Buy FF Diamonds Pakistan - Guru Zone",
    description:
        "Buy Free Fire Diamonds, Weekly Membership & Monthly Membership instantly via JazzCash or EasyPaisa. 100% safe & official Free Fire top up in Pakistan. No login required.",
    keywords: [
        "free fire top up pakistan",
        "free fire diamonds jazzcash",
        "free fire diamonds easypaisa",
        "buy ff diamonds pakistan",
        "free fire membership pakistan",
        "garena free fire top up",
        "free fire uid top up",
        "free fire cheap diamonds",
        "ff diamonds whatsapp",
    ],
    alternates: { canonical: "/topup" },
    openGraph: {
        title: "Buy Free Fire Diamonds – Guru Zone Official Top Up",
        description:
            "Fast & secure Free Fire diamond top-ups in Pakistan. Pay via JazzCash or EasyPaisa. Delivered to your UID instantly.",
        url: "https://www.guru-zone.com/topup",
    },
};

export default function TopUpPage() {
    return <TopUpPageClient />;
}
