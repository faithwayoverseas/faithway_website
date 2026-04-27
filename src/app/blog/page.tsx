import React from "react";
import { createClient } from "@/lib/supabase/server";
import { BlogPost } from "@/lib/types";
import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";

export const metadata = {
  title: "Insights & News | Faithway Overseas",
  description: "Expert insights, immigration news, and global mobility strategies from Faithway Overseas.",
};

export const revalidate = 3600; // Revalidate every hour

export default async function BlogPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  return (
    <main className="pt-32 pb-24 min-h-screen">
      <div className="container-custom">
        <header className="mb-16 md:mb-24 max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-outfit font-bold text-white mb-6 tracking-tighter">
            Global <span className="text-gold">Insights</span>
          </h1>
          <p className="text-lg md:text-xl text-white/50 font-light leading-relaxed">
            Stay informed with the latest updates on international mobility, immigration policies, and global investment opportunities.
          </p>
        </header>

        {!posts || posts.length === 0 ? (
          <div className="py-24 text-center glass-premium rounded-[3rem] border border-white/5">
            <p className="text-white/40 text-lg">No insights published yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post: BlogPost) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group h-full flex flex-col">
                <article className="glass-premium rounded-3xl border border-white/5 overflow-hidden transition-all duration-500 group-hover:border-white/10 group-hover:bg-white/[0.03] flex flex-col h-full">
                  <div className="aspect-[16/10] overflow-hidden bg-midnight relative">
                    {post.featured_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={post.featured_image} 
                        alt={post.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-royal/10 flex items-center justify-center">
                        <span className="text-4xl text-royal/20 font-bold font-outfit">FW</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent opacity-60"></div>
                  </div>
                  
                  <div className="p-8 flex flex-col flex-grow">
                    <div className="flex items-center gap-2 text-gold text-[10px] font-bold uppercase tracking-widest mb-4">
                      <Calendar size={12} />
                      {new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 line-clamp-2 group-hover:text-gold transition-colors">
                      {post.title}
                    </h2>
                    
                    <p className="text-white/50 text-sm leading-relaxed line-clamp-3 mb-8 flex-grow">
                      {post.meta_description || "Read full article to discover more insights..."}
                    </p>
                    
                    <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-widest group-hover:text-white transition-colors mt-auto">
                      Read Article <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
