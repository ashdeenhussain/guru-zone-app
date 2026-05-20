import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, User, Clock } from 'lucide-react';
import { getPostBySlug, getAllSlugs } from '@/lib/blog';

/* ─────────────────────────────────────────
   Static params – pre-renders all known slugs
───────────────────────────────────────── */
export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

/* ─────────────────────────────────────────
   Dynamic SEO metadata per article
───────────────────────────────────────── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Article Not Found | Guru Zone',
      description: 'This blog post does not exist.',
    };
  }

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    authors: [{ name: post.author }],
    alternates: {
      canonical: `https://www.guru-zone.com/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://www.guru-zone.com/blog/${post.slug}`,
      siteName: 'Guru Zone',
      images: [{ url: post.image, width: 1200, height: 630, alt: post.title }],
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.dateModified,
      authors: [post.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [post.image],
    },
  };
}

/* ─────────────────────────────────────────
   Article JSON-LD Schema
───────────────────────────────────────── */
function ArticleSchema({ post }: { post: ReturnType<typeof getPostBySlug> }) {
  if (!post) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    image: post.image,
    datePublished: post.date,
    dateModified: post.dateModified,
    author: {
      '@type': 'Organization',
      name: 'Guru Zone',
      url: 'https://www.guru-zone.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Guru Zone',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.guru-zone.com/logo.jpg',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.guru-zone.com/blog/${post.slug}`,
    },
    keywords: post.keywords,
    inLanguage: 'en-PK',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/* ─────────────────────────────────────────
   Breadcrumb JSON-LD Schema
───────────────────────────────────────── */
function BreadcrumbSchema({ post }: { post: ReturnType<typeof getPostBySlug> }) {
  if (!post) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.guru-zone.com' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.guru-zone.com/blog' },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `https://www.guru-zone.com/blog/${post.slug}`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/* ─────────────────────────────────────────
   Page Component
───────────────────────────────────────── */
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  return (
    <>
      <ArticleSchema post={post} />
      <BreadcrumbSchema post={post} />

      <div className="min-h-screen bg-background text-foreground pt-28 pb-20 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-700">
        <div className="max-w-3xl mx-auto">

          {/* ── Breadcrumb nav ── */}
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-2 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li className="text-border">/</li>
              <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
              <li className="text-border">/</li>
              <li className="text-foreground/50 truncate max-w-[160px]">{post.category}</li>
            </ol>
          </nav>

          {/* ── Back link ── */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 font-bold text-sm uppercase tracking-wider group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Blog
          </Link>

          {/* ── Article header ── */}
          <header className="space-y-6 mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-wider">
              {post.category}
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-foreground">
              {post.title}
            </h1>

            <p className="text-muted-foreground text-lg leading-relaxed">
              {post.description}
            </p>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-muted-foreground font-bold uppercase tracking-wider border-y border-border/50 py-4">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <time dateTime={post.date}>{post.dateDisplay}</time>
              </span>
              <span className="hidden sm:inline w-1.5 h-1.5 rounded-full bg-border" />
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                {post.author}
              </span>
              <span className="hidden sm:inline w-1.5 h-1.5 rounded-full bg-border" />
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                {post.readTime}
              </span>
            </div>
          </header>

          {/* ── Hero graphic ── */}
          <div className="relative w-full h-56 sm:h-72 rounded-3xl overflow-hidden bg-card/60 border border-border mb-12 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background/80 to-background" />
            <div className="relative z-10 text-center px-6">
              <p className="text-primary font-black text-5xl sm:text-7xl opacity-10 absolute inset-0 flex items-center justify-center select-none">
                GZ
              </p>
              <span className="relative z-20 inline-flex items-center gap-2 px-5 py-2.5 bg-primary/10 border border-primary/30 rounded-full text-primary text-sm font-black uppercase tracking-widest">
                {post.category}
              </span>
            </div>
          </div>

          {/* ── Article body – Tailwind Typography ── */}
          <article
            className={[
              'prose prose-invert prose-yellow max-w-none',
              'prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight',
              'prose-h2:text-2xl prose-h2:text-foreground prose-h2:mt-10',
              'prose-h3:text-xl prose-h3:text-foreground',
              'prose-p:text-muted-foreground prose-p:leading-relaxed',
              'prose-strong:text-foreground',
              'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
              'prose-li:text-muted-foreground',
              'prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-xl prose-blockquote:py-1',
              'prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none',
              'prose-ol:text-muted-foreground prose-ul:text-muted-foreground',
            ].join(' ')}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* ── CTA Footer ── */}
          <div className="mt-16 p-8 rounded-3xl bg-card/40 border border-border/60 backdrop-blur-sm text-center space-y-4">
            <h2 className="text-2xl font-black uppercase text-foreground">
              Ready to Dominate? 🏆
            </h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Abhi register karein, custom challenge post karein aur apni Free Fire skills se real cash kamayein.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link href="/signup">
                <button
                  id="blog-cta-signup"
                  className="px-7 py-3 bg-primary text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-primary/20 text-xs sm:text-sm"
                >
                  Register Now — It&apos;s Free
                </button>
              </Link>
              <Link href="/topup">
                <button
                  id="blog-cta-topup"
                  className="px-7 py-3 bg-card border border-border text-foreground font-black uppercase tracking-widest rounded-xl hover:border-primary/40 hover:scale-105 active:scale-95 transition-all text-xs sm:text-sm"
                >
                  Top-Up Diamonds
                </button>
              </Link>
            </div>
          </div>

          {/* ── Back to blog ── */}
          <div className="mt-10 text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-bold text-sm uppercase tracking-wider group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              View All Articles
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
