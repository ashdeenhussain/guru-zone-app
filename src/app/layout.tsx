import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";
import PromoModal from "@/components/PromoModal";
import { Toaster } from "sonner";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://guru-zone.com"),
  title: {
    default: "Guru Zone | Pakistan's No.1 Free Fire & Esports Platform",
    template: "%s | Guru Zone Esports",
  },
  description:
    "GURU ZONE is Pakistan's leading esports platform for Free Fire tournaments. Play daily matches, win real cash rewards, and withdraw instantly via JazzCash, EasyPaisa, or Bank Transfer.",
  keywords: [
    "Guru Zone",
    "GuruZone",
    "Guru Zone Free Fire",
    "Free Fire Tournament Pakistan",
    "Earn Money Playing Free Fire",
    "Free Fire Earnings App",
    "Paid Free Fire Tournaments",
    "Daily Esports Matches Pakistan",
    "Esports Tournament Platform",
    "Online Earning Games Pakistan",
    "JazzCash Earnings Game",
    "EasyPaisa Earning App",
    "FF Tournament App",
    "free fire tournament app in pakistan",
    "free fire tournament app earn money",
    "best tournament app",
    "esports tournament app",
    "best free fire tournament app",
    "best free fire tournament app in pakistan",
    "free fire esports tournament",
  ],
  authors: [{ name: "Guru Zone Team" }],
  creator: "Guru Zone",
  publisher: "Guru Zone Esports",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Guru Zone - Play, Compete & Earn Real Cash",
    description:
      "Join the elite arena of Guru Zone. Compete in daily Free Fire tournaments and win real money prizes with instant withdrawals in Pakistan.",
    url: "https://guru-zone.com",
    siteName: "Guru Zone",
    images: [
      {
        url: "/logo.jpg",
        width: 1200,
        height: 630,
        alt: "Guru Zone - The Ultimate Esports Platform",
      },
    ],
    locale: "en_PK",
    type: "website",
    },
  twitter: {
    card: "summary_large_image",
    title: "Guru Zone - Pakistan's Top Esports Platform",
    description: "Compete in Free Fire tournaments and earn real cash daily. Join the Guru Zone community now!",
    images: ["/logo.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/logo.jpg",
    shortcut: "/logo.jpg",
    apple: "/logo.jpg",
  },
  verification: {
    google: "i5YkqwsXg5MXjGSwYj4iTiIuiG3qHxlG1Ep-3lNrfdE",
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
          <PromoModal />
          <Toaster richColors position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
