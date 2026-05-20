import type { Metadata } from "next";
import { Inter } from 'next/font/google'
import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";
import PromoModal from "@/components/PromoModal";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  metadataBase: new URL("https://www.guru-zone.com"),
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
    "free fire earning app pakistan",
    "ff tournament app pakistan",
    "free fire 1v1 pakistan",
    "ff tournament jazzcash withdrawal",
    "free fire top up pakistan",
    "free fire diamonds jazzcash",
    "free fire top up easypaisa",
    "free fire diamonds cheap pakistan",
    "free fire membership pakistan",
    "free fire player id top up",
    "free fire diamonds easypaisa discount",
    "free fire tournament lahore",
    "free fire tournament karachi",
    "free fire tournament islamabad",
    "free fire tournament gujranwala",
    "ff earning app lahore",
    "online earning game pakistan",
    "Earn Money Playing Free Fire",
    "Daily Esports Matches Pakistan",
    "Esports Tournament Platform",
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
      </head>
      <body
        className={`${inter.className} antialiased pb-20 bg-background text-foreground`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SportsOrganization",
              "name": "Guru Zone",
              "url": "https://www.guru-zone.com",
              "logo": "https://www.guru-zone.com/logo.png",
              "description": "Pakistan ka #1 Free Fire tournament platform. Khelo, jeeto aur JazzCash/EasyPaisa pe instant cash withdraw karo.",
              "foundingLocation": {
                "@type": "Place",
                "name": "Pakistan"
              },
              "sameAs": [
                "https://www.facebook.com/guruzone",
                "https://www.tiktok.com/@guruzone"
              ],
              "offers": {
                "@type": "Offer",
                "description": "Free Fire Tournament Entry",
                "price": "0",
                "priceCurrency": "PKR",
                "availability": "https://schema.org/InStock"
              }
            })
          }}
        />
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
