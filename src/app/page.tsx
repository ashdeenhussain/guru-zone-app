
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
  title: "Guru Zone — Pakistan Ka #1 Free Fire Tournament | JazzCash Withdrawal",
  description: "Guru Zone pe Free Fire tournaments khelo, 1v1 Battle Zone mein challenge do, aur JazzCash/EasyPaisa pe instant cash withdraw karo. Pakistan ka sabse trusted FF earning platform.",
  keywords: "free fire tournament pakistan, free fire earning app pakistan, FF tournament JazzCash, free fire top up pakistan, online earning game pakistan, free fire diamonds cheap pakistan, battle zone free fire, guru zone",
  authors: [{ name: "Guru Zone" }],
  robots: "index, follow",
  openGraph: {
    title: "Guru Zone — Pakistan Ka #1 Free Fire Tournament",
    description: "Khelo, jeeto, aur JazzCash pe withdraw karo. Pakistan ka #1 Free Fire tournament platform.",
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
