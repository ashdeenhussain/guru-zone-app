
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import { redirect } from "next/navigation";
import LandingPage from "@/components/LandingPage";
import connectDB from "@/lib/db";
import LandingPageContent from "@/models/LandingPageContent";

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
