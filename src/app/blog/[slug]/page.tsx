import React from "react";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("blog_posts")
    .select("meta_title, meta_description, featured_image")
    .eq("slug", resolvedParams.slug)
    .single();

  if (!post) return { title: "Not Found | Faithway Overseas" };

  return {
    title: `${post.meta_title} | Faithway Overseas`,
    description: post.meta_description,
    openGraph: {
      images: post.featured_image ? [post.featured_image] : [],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", resolvedParams.slug)
    .eq("is_published", true)
    .single();

  if (!post) notFound();

  return (
    <main className="pt-32 pb-24 min-h-screen bg-[#050505]">
      <article className="container-custom max-w-4xl">
        <Link 
          href="/blog" 
          className="inline-flex items-center gap-2 text-white/40 hover:text-white mb-12 transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs uppercase tracking-widest font-bold">Back to Insights</span>
        </Link>

        <header className="mb-12 md:mb-16">
          <div className="flex items-center gap-2 text-gold text-xs font-bold uppercase tracking-widest mb-6">
            <Calendar size={14} />
            {new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-outfit font-bold text-white leading-tight mb-8">
            {post.title}
          </h1>
        </header>

        {post.featured_image && (
          <div className="w-full aspect-video rounded-3xl overflow-hidden mb-16 border border-white/5 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={post.featured_image} 
              alt={post.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent opacity-40"></div>
          </div>
        )}

        <div className="prose prose-invert prose-lg max-w-none prose-headings:font-outfit prose-headings:font-bold prose-a:text-gold prose-a:no-underline hover:prose-a:text-gold/80 prose-img:rounded-2xl">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>
      </article>
    </main>
  );
}
