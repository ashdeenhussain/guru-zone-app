import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Free Fire 1v1 Battle Zone Pakistan — Direct Challenge | Guru Zone",
  description: "Pakistan ka pehla 1v1 aur 2v2 Free Fire direct challenge platform. Kisi bhi player ko challenge do, jeeto aur cash kamao. Sirf Guru Zone pe!",
  keywords: "free fire 1v1 pakistan, FF battle challenge, free fire direct challenge app, free fire earning challenge pakistan",
  alternates: {
    canonical: "https://www.guru-zone.com/battle-zone",
  },
};

export default function BattleZoneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
