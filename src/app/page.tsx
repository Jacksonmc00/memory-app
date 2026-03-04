import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Home() {
  const cookieStore = cookies()
  
  // Initialize Supabase for Server Component
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

  // 2. Fetch albums for this specific user
  // Thanks to the RLS we set up earlier, this is doubly secure
  const { data: albums, error } = await supabase
    .from('albums')
    .select('*')
    .order('created_at', { ascending: false })

  // Sign out action
  async function signOut() {
    'use server'
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
    <main className="min-h-screen bg-gray-50 p-8">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Memories</h1>
          <p className="text-gray-500">Welcome back, {user?.email}</p>
        </div>
        
        <div className="flex gap-4">
          <Link 
            href="/albums/new" 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + New Album
          </Link>
          <form action={signOut}>
            <button className="text-gray-600 hover:text-red-600 px-4 py-2 transition">
              Sign Out
            </button>
          </form>
        </div>
      </header>

      <section className="max-w-6xl mx-auto">
        {albums && albums.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {albums.map((album) => (
              <Link 
                key={album.id} 
                href={`/albums/${album.id}`}
                className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden border border-gray-100"
              >
                <div className="aspect-video bg-gray-200 overflow-hidden">
                  {album.cover_image_url ? (
                    <img 
                      src={album.cover_image_url} 
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Cover Image
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h2 className="font-semibold text-lg text-gray-900">{album.title}</h2>
                  <p className="text-sm text-gray-500 line-clamp-2">{album.description}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <h3 className="text-xl font-medium text-gray-900">No albums yet</h3>
            <p className="text-gray-500 mt-2">Create your first album to start saving memories.</p>
            <Link 
              href="/albums/new" 
              className="inline-block mt-6 text-blue-600 font-semibold"
            >
              Get started &rarr;
            </Link>
          </div>
        )}
      </section>
    </main>
  )
}