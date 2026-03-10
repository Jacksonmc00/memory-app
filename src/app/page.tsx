import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'

export default async function Dashboard() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: albums } = await supabase
    .from('albums')
    .select('*')
    .order('created_at', { ascending: false })

  // Generalized Templates for any user
  const templates = [
    { 
      title: "Home & Hearth", 
      desc: "Capture the evolution of your living space, garden projects, and daily life at home.",
      icon: "🏡"
    },
    { 
      title: "The Great Outdoors", 
      desc: "Document your adventures in nature, from weekend hikes to seasonal expeditions.",
      icon: "🌲"
    },
    { 
      title: "Milestones", 
      desc: "A dedicated space for life's biggest celebrations, anniversaries, and future dreams.",
      icon: "✨"
    }
  ]

  return (
    <main className="min-h-screen bg-linen text-charcoal p-8 md:p-24">
      <div className="max-w-6xl mx-auto">
        
        <header className="flex flex-col md:flex-row justify-between items-baseline gap-8 mb-24">
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter text-charcoal">
              Your Collection
            </h1>
            <div className="h-[1px] w-20 bg-taupe/30"></div>
          </div>
          
          <Link 
            href="/albums/new" 
            className="text-[10px] font-bold tracking-[0.3em] uppercase border-b border-charcoal pb-1 hover:text-taupe hover:border-taupe transition-all duration-300"
          >
            + Start New Archive
          </Link>
        </header>

        <section className="mb-32">
          {albums && albums.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
              {albums.map((album) => (
                <Link key={album.id} href={`/albums/${album.id}`} className="group block space-y-6">
                  <div className="aspect-[4/5] bg-white rounded-[2.5rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-700 group-hover:shadow-[0_30px_60px_rgba(166,159,146,0.12)] group-hover:-translate-y-2">
                    <div className="w-full h-full bg-[#F2F0ED]/50 flex items-center justify-center text-taupe/20">
                       <span className="text-4xl font-serif italic select-none">A</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 px-4">
                    <h2 className="text-3xl font-serif italic text-charcoal group-hover:text-taupe transition-colors duration-500">
                      {album.title}
                    </h2>
                    <p className="text-[10px] font-bold tracking-widest text-taupe uppercase">
                      Archive No. {album.id.slice(0, 4)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-24 border border-dashed border-taupe/20 rounded-[3rem] text-center bg-white/30">
              <p className="font-serif italic text-taupe text-lg">
                Your personal vault is waiting for its first story.
              </p>
            </div>
          )}
        </section>

        <section className="pt-24 border-t border-taupe/10">
          <div className="mb-12">
            <h3 className="text-[10px] font-bold tracking-[0.5em] text-taupe uppercase mb-2">Inspiration</h3>
            <p className="text-sm font-medium text-taupe/60 italic">Quick-start templates for your records</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {templates.map((template, i) => (
              <Link 
                key={i} 
                href={`/albums/new?title=${encodeURIComponent(template.title)}&desc=${encodeURIComponent(template.desc)}`}
                className="group cursor-pointer space-y-4"
              >
                <div className="aspect-square bg-taupe/5 rounded-[2rem] border border-taupe/10 flex items-center justify-center grayscale opacity-60 group-hover:opacity-100 group-hover:bg-white group-hover:border-taupe/30 transition-all duration-700 shadow-none group-hover:shadow-[0_20px_40px_rgba(166,159,146,0.1)]">
                  <span className="text-3xl opacity-40 group-hover:opacity-100 transition-opacity duration-700">
                    {template.icon}
                  </span>
                </div>
                <div className="px-2">
                  <h4 className="text-xl font-serif italic text-charcoal/70 group-hover:text-charcoal transition-colors duration-500">
                    {template.title}
                  </h4>
                  <p className="text-xs text-taupe leading-relaxed mt-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    {template.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}