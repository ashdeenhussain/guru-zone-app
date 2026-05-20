import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Calendar, User, ArrowRight, Sparkles, Tag } from 'lucide-react';
import { getAllPosts } from '@/lib/blog';

export const metadata: Metadata = {
  title: "Guru Zone Blog — Free Fire Earning Guides & Top-Up Tips Pakistan",
  description:
    "Learn how to make money playing Free Fire in Pakistan. Read guides on the best online earning game pakistan strategies, cheap diamonds top-up, tournaments, and cash withdrawal tips.",
  keywords:
    "online earning game pakistan, free fire se paise kaise kamayein, free fire tournament pakistan, free fire diamonds cheap pakistan, guru zone blog, earn money gaming pakistan",
  alternates: {
    canonical: "https://www.guru-zone.com/blog",
  },
  openGraph: {
    title: "Guru Zone Blog — Free Fire Guides & Top-Up Tips",
    description: "Pro guides, tournament tips, and top-up strategies for Free Fire players in Pakistan.",
    url: "https://www.guru-zone.com/blog",
    siteName: "Guru Zone",
    images: [{ url: "/logo.jpg", width: 1200, height: 630 }],
    type: "website",
  },
};

const categoryColors: Record<string, string> = {
  "Earning Guides":    "text-primary bg-primary/10 border-primary/20",
  "Top-Up Guides":     "text-blue-400 bg-blue-400/10 border-blue-400/20",
  "Tournament Tips":   "text-green-400 bg-green-400/10 border-green-400/20",
  "Platform Reviews":  "text-purple-400 bg-purple-400/10 border-purple-400/20",
};

export default function BlogListPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8 pt-32 animate-in fade-in duration-700">
      <div className="max-w-5xl mx-auto">

        {/* ── Header ── */}
        <div className="text-center mb-16 relative">
          <div className="absolute inset-0 flex items-center justify-center -z-10 opacity-5">
            <BookOpen className="w-96 h-96 text-primary rotate-12" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Guru Zone Resource Center
          </span>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-4">
            Gaming &{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-primary to-yellow-600">
              Online Earning
            </span>{" "}
            Blog
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-light">
            Stay updated with pro gaming tips, tournament strategies, diamond top-up guides, and insights on the best{" "}
            <strong className="text-foreground font-semibold">online earning game pakistan</strong> platform.
          </p>
        </div>

        {/* ── Post Grid ── */}
        <div className="grid gap-8">
          {posts.map((post) => {
            const colorClass = categoryColors[post.category] ?? "text-primary bg-primary/10 border-primary/20";
            return (
              <article
                key={post.slug}
                className="group relative bg-card/40 border border-border hover:border-primary/40 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-stretch transition-all duration-300 backdrop-blur-sm hover:shadow-2xl hover:shadow-primary/5"
              >
                {/* Thumbnail placeholder */}
                <div className="relative w-full md:w-72 h-48 md:h-auto min-h-[180px] rounded-2xl overflow-hidden bg-muted shrink-0 border border-border flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
                  <BookOpen className="relative z-10 w-16 h-16 text-primary/20 group-hover:text-primary/40 group-hover:scale-110 transition-all duration-500" />
                  <div className={`absolute top-4 left-4 inline-flex items-center gap-1.5 border text-[10px] font-black uppercase px-3 py-1 rounded-md ${colorClass}`}>
                    <Tag className="w-3 h-3" /> {post.category}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" /> {post.dateDisplay}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-border" />
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-primary" /> {post.author}
                      </span>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-black text-foreground group-hover:text-primary transition-colors leading-tight">
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    </h2>

                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                      {post.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border/50 flex justify-between items-center">
                    <span className="text-xs text-muted-foreground font-semibold">{post.readTime}</span>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest hover:translate-x-1 transition-transform"
                      aria-label={`Read more about ${post.title}`}
                    >
                      Read Guide <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* ── Bottom CTA ── */}
        <div className="mt-16 text-center p-10 rounded-3xl bg-card/40 border border-border/60 backdrop-blur-sm">
          <h2 className="text-2xl font-black uppercase text-foreground mb-2">
            Ready to Start Earning?
          </h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
            Join Pakistan&apos;s #1 Free Fire tournament platform. Play, compete, and withdraw real cash daily.
          </p>
          <Link href="/signup">
            <button className="px-8 py-3.5 bg-primary text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-primary/20 text-sm">
              Join Guru Zone Free
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
