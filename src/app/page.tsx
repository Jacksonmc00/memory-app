import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Home() {
  // NEXT.JS 16 FIX: We must await the cookie store
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

  const { data: { user } } = await supabase.auth.getUser()

  const { data: albums } = await supabase
    .from('albums')
    .select('*')
    .order('created_at', { ascending: false })

  async function signOut() {
    'use server'
    const cookieStore = await cookies() // Await here too
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
          <h1 className="text-3xl font-bold text-gray-900 italic">Memory App</h1>
          <p className="text-gray-500">{user?.email}</p>
        </div>
        
        <div className="flex gap-4">
          <Link 
            href="/albums/new" 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition"
          >
            + New Album
          </Link>
          <form action={signOut}>
            <button className="text-gray-600 hover:text-red-600 px-4 py-2 transition font-medium">
              Sign Out
            </button>
          </form>
        </div>
      </header>

      <section className="max-w-6xl mx-auto">
        {albums && albums.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {albums.map((album) => (
              <div key={album.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="aspect-video bg-gray-100 flex items-center justify-center text-gray-400">
                   {/* ThinkOn images will go here soon */}
                   No Photos Yet
                </div>
                <div className="p-4">
                  <h2 className="font-bold text-lg text-gray-900">{album.title}</h2>
                  <p className="text-sm text-gray-500">{album.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <h3 className="text-xl font-medium text-gray-900">Your gallery is empty</h3>
            <p className="text-gray-500 mt-2">Ready to save some memories from Russell or the trapline?</p>
          </div>
        )}
      </section>
    </main>
  )
}