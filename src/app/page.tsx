
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import { redirect } from "next/navigation";
import LandingPage from "@/components/LandingPage";
import connectDB from "@/lib/db";
import LandingPageContent from "@/models/LandingPageContent";
import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Free Fire Tournament Pakistan — Guru Zone | No.1 FF Earning App",
  description: "Khelo aur jeeto! Guru Zone pe free fire tournament pakistan khelo, 1v1 Battle Zone join karo, aur fast ff tournament jazzcash withdrawal aur easypaisa payouts hasil karo. Pakistan ka trusted online earning game pakistan.",
  keywords: "free fire tournament pakistan, free fire earning app pakistan, ff tournament app pakistan, ff tournament jazzcash withdrawal, online earning game pakistan, free fire 1v1 pakistan, free fire top up pakistan, guru zone",
  authors: [{ name: "Guru Zone" }],
  robots: "index, follow",
  openGraph: {
    title: "Free Fire Tournament Pakistan — Guru Zone | Earning App",
    description: "Guru Zone pe Free Fire tournaments khelo, 1v1 challenges jeeto aur instant cash reward withdraw karo.",
    url: "https://www.guru-zone.com",
    type: "website",
  },
  alternates: {
    canonical: "https://www.guru-zone.com/",
  },
};

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    const userRole = (session.user as any).role;
    if (userRole === 'admin') {
      redirect("/admin");
    } else {
      redirect("/dashboard");
    }
  }

  // Fetch initial data for SEO pre-rendering
  let initialData = null;
  try {
    await connectDB();
    initialData = await LandingPageContent.findOne().lean();
  } catch (error) {
    console.error("Error fetching landing page data server-side:", error);
  }

  return <LandingPage initialData={initialData ? JSON.parse(JSON.stringify(initialData)) : null} />;
}
