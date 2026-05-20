import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Free Fire 1v1 Pakistan — Battle Zone Challenges | Guru Zone",
  description: "Pakistan's premium Free Fire 1v1 Pakistan gaming zone. Set entry fees, challenge players 1v1 or 2v2, win custom matches, and withdraw cash instantly via JazzCash or EasyPaisa.",
  keywords: "free fire 1v1 pakistan, free fire tournament pakistan, 1v1 free fire pakistan, ff tournament app pakistan, guru zone, free fire challenge custom",
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
