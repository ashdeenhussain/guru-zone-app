import type { Metadata } from 'next';
import Link from 'next/link';
import { Trophy, Users, Swords, Calendar, ArrowRight, MapPin, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: "Free Fire Tournament Lahore — Local Community Arena | Guru Zone",
  description: "Join the elite competitive circle in Lahore. Play free fire tournament lahore matches on the best ff earning app lahore has to offer. Withdraw your winnings instantly.",
  keywords: "free fire tournament lahore, ff earning app lahore, free fire tournament pakistan, online earning game pakistan, guru zone lahore",
  alternates: {
    canonical: "https://www.guru-zone.com/lahore",
  },
};

export default function LahoreCityPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8 pt-32 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -z-10 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />

      <div className="max-w-5xl mx-auto space-y-16">
        {/* Hero Area */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
            <MapPin className="w-4 h-4" /> Lahore Esports Hub
          </div>
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight leading-[0.95]">
            FREE FIRE TOURNAMENT <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-primary to-yellow-600">
              LAHORE CHALLENGERS
            </span>
          </h1>
          <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Lahore's premier hub for competitive Free Fire players. Play daily tournaments, compete in 1v1 arenas, and cash out instantly on the top <strong className="text-foreground font-semibold">ff earning app lahore</strong> community.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Link href="/signup">
              <button className="px-8 py-4 bg-primary text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-primary/20 text-xs sm:text-sm">
                Register & Play
              </button>
            </Link>
          </div>
        </div>

        {/* Local Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-3xl border border-border bg-card/30 backdrop-blur-sm">
          <div className="text-center space-y-1">
            <h3 className="text-2xl sm:text-3xl font-black text-primary">3,500+</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest font-semibold">Lahori Players</p>
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-2xl sm:text-3xl font-black text-primary">150K+</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest font-semibold">Coins Won Today</p>
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-2xl sm:text-3xl font-black text-primary">Daily</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest font-semibold">Custom Rooms</p>
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-2xl sm:text-3xl font-black text-primary">100%</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest font-semibold">Secure Payout</p>
          </div>
        </div>

        {/* Custom content */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
              Lahore Esports Scene is Heating Up!
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Guru Zone connects players from Lahore's top institutes and neighborhoods, including Johar Town, DHA, Gulberg, and Samanabad. Whether you want to test your squads in a full custom map battle or show your gunpower in a <strong className="text-foreground font-semibold">free fire tournament lahore</strong>, Guru Zone provides an official platform with anti-cheat protection.
            </p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-primary shrink-0" /> Fair-play monitored custom rooms.
              </li>
              <li className="flex items-center gap-2.5">
                <Swords className="w-4 h-4 text-primary shrink-0" /> Direct 1v1 challenges with high stakes.
              </li>
              <li className="flex items-center gap-2.5">
                <Trophy className="w-4 h-4 text-primary shrink-0" /> Winner takes all matches and weekly leaderboards.
              </li>
            </ul>
          </div>
          
          <div className="bg-card/40 border border-border/80 rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 p-16 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Active Room Highlights</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-muted/30 border border-border/50 rounded-2xl">
                <div>
                  <h4 className="font-bold text-sm text-foreground">Lahore Solo Clash</h4>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1.5 mt-1">
                    <Calendar className="w-3 h-3" /> Live Daily at 9:00 PM
                  </p>
                </div>
                <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">50 Entry</span>
              </div>

              <div className="flex justify-between items-center p-4 bg-muted/30 border border-border/50 rounded-2xl">
                <div>
                  <h4 className="font-bold text-sm text-foreground">Gulberg Squad Survival</h4>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1.5 mt-1">
                    <Calendar className="w-3 h-3" /> Saturday Night Special
                  </p>
                </div>
                <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">200 Entry</span>
              </div>
            </div>
            
            <Link href="/login">
              <button className="w-full py-3.5 bg-foreground text-background hover:scale-[1.02] active:scale-95 transition-all text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg">
                Enter Custom Rooms <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
