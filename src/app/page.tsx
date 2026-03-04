import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AlbumCard from '@/components/AlbumCard'

export default async function Home() {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
      },
    }
  )

  // 1. Get the current user
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Fetch albums with the latest first
  const { data: albums } = await supabase
    .from('albums')
    .select('*')
    .order('created_at', { ascending: false })

  // Sign out action (Server Action)
  async function signOut() {
    'use server'
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <main className="min-h-screen bg-[#fafafa] pb-20">
      {/* Premium Header */}
      <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 italic">
              MEMORIES
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">
              {user?.email?.split('@')[0]} / Ontario, CA
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <Link 
              href="/albums/new" 
              className="bg-black text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
            >
              + Create Album
            </Link>
            <form action={signOut}>
              <button className="text-gray-400 hover:text-red-500 text-sm font-medium transition-colors">
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Hero / Stats Section */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-5xl font-bold text-gray-900 tracking-tighter">
              Your Collection
            </h2>
            <p className="text-gray-500 mt-2 max-w-md">
              A private archive of your life in Russell, the trapline, and the road to Calabogie 2027.
            </p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl px-6 py-4 shadow-sm">
            <span className="text-3xl font-black text-black">{albums?.length || 0}</span>
            <span className="ml-2 text-sm text-gray-400 font-bold uppercase tracking-widest">Total Albums</span>
          </div>
        </div>
      </section>

      {/* Masonry Feed */}
      <section className="max-w-7xl mx-auto px-6">
        {albums && albums.length > 0 ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {albums.map((album) => (
              <AlbumCard 
                key={album.id}
                id={album.id}
                title={album.title}
                description={album.description}
                coverUrl={album.cover_image_url}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <span className="text-3xl">🎞️</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Start your archive</h3>
            <p className="text-gray-500 mt-2 text-center max-w-xs">
              Every memory needs a home. Create your first album to begin.
            </p>
            <Link 
              href="/albums/new" 
              className="mt-8 text-black font-bold border-b-2 border-black pb-1 hover:text-gray-600 hover:border-gray-600 transition"
            >
              Create your first album &rarr;
            </Link>
          </div>
        )}
      </section>
    </main>
  )
}