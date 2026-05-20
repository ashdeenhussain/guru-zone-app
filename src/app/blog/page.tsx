import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Calendar, User, ArrowRight, Trophy, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: "Guru Zone Blog — Free Fire Earning Guides & Tips",
  description: "Learn how to make money playing Free Fire in Pakistan. Read guides on the best online earning game pakistan strategies, tournaments, and cash withdrawal tips.",
  keywords: "online earning game pakistan, free fire se paise kaise kamayein, free fire tournament pakistan, guru zone blog, earn money gaming pakistan",
  alternates: {
    canonical: "https://www.guru-zone.com/blog",
  },
};

const posts = [
  {
    slug: "free-fire-se-paise-kaise-kamayein",
    title: "Free Fire Se Paise Kaise Kamayein? (5 Genuine Methods in 2026)",
    description: "Want to convert your gaming skills into cash? Here is a complete guide on how to earn money playing Free Fire in Pakistan with direct withdrawals via JazzCash and EasyPaisa.",
    date: "May 19, 2026",
    author: "Guru Zone Gaming Team",
    readTime: "6 min read",
    category: "Earning Guides",
  }
];

export default function BlogListPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8 pt-32 animate-in fade-in duration-700">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 relative">
          <div className="absolute inset-0 flex items-center justify-center -z-10 opacity-5">
            <BookOpen className="w-96 h-96 text-primary rotate-12" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Guru Zone Resource Center
          </span>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-4">
            Gaming & <span className="text-transparent bg-clip-text bg-gradient-to-b from-primary to-yellow-600">Online Earning</span> Blog
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-light">
            Stay updated with pro gaming tips, tournament strategies, and insights on the best <strong className="text-foreground font-semibold">online earning game pakistan</strong> platform.
          </p>
        </div>

        {/* Blog Post Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-1">
          {posts.map((post) => (
            <div 
              key={post.slug} 
              className="group relative bg-card/40 border border-border hover:border-primary/40 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-center transition-all duration-300 backdrop-blur-sm hover:shadow-2xl hover:shadow-primary/5"
            >
              {/* Image / Icon container */}
              <div className="relative w-full md:w-80 h-48 md:h-52 rounded-2xl overflow-hidden bg-muted shrink-0 border border-border">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background flex items-center justify-center">
                  <Trophy className="w-20 h-20 text-primary/30 group-hover:scale-110 group-hover:text-primary/50 transition-all duration-500" />
                </div>
                <div className="absolute top-4 left-4 bg-primary text-black text-[10px] font-black uppercase px-3 py-1 rounded-md">
                  {post.category}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col justify-between h-full space-y-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-primary" /> {post.date}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-border" />
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-primary" /> {post.author}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-foreground group-hover:text-primary transition-colors leading-tight">
                    <Link href={`/blog/${post.slug}`}>
                      {post.title}
                    </Link>
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed font-normal line-clamp-3">
                    {post.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-border/50 flex justify-between items-center">
                  <span className="text-xs text-muted-foreground font-semibold">{post.readTime}</span>
                  <Link href={`/blog/${post.slug}`}>
                    <button className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest hover:translate-x-1 transition-transform">
                      Read Guide <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
