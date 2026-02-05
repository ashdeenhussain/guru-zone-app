import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";
import { Toaster } from "sonner";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Guru Zone | The Ultimate Esports Tournament Platform",
    template: "%s | Guru Zone - Play & Earn",
  },
  description:
    "Join Guru Zone to play daily Free Fire tournaments, earn real cash rewards, and compete with top gamers in Pakistan.",
  keywords: [
    "Free Fire Tournament",
    "Earn Money Gaming",
    "Guru Zone",
    "Esports Pakistan",
    "Online Earning",
  ],
  openGraph: {
    title: "Guru Zone - Compete & Win",
    description:
      "Join Guru Zone to play daily Free Fire tournaments, earn real cash rewards, and compete with top gamers in Pakistan.",
    url: "https://guru-zone.com",
    siteName: "Guru Zone",
    images: [
      {
        url: "/logo.jpg", // Ensure this image exists in public folder
        width: 800,
        height: 600,
        alt: "Guru Zone Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  icons: {
    icon: "/logo.jpg",
    shortcut: "/logo.jpg",
    apple: "/logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.className} antialiased pb-20 bg-background text-foreground`}
      >
        <Providers>
          <Navbar />
          {children}
          <Toaster richColors position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
