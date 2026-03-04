import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function AlbumDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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

  // Fetch the album details
  const { data: album } = await supabase
    .from('albums')
    .select('*')
    .eq('id', id)
    .single()

  if (!album) {
    notFound()
  }

  // Fetch all memories (photos/audio) inside this album
  const { data: memories } = await supabase
    .from('memories')
    .select('*')
    .eq('album_id', id)
    .order('created_at', { ascending: true })

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        <nav className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline">← Back to Dashboard</Link>
        </nav>

        <header className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900">{album.title}</h1>
          <p className="text-gray-500 mt-2 text-lg">{album.description}</p>
        </header>

        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Memories</h2>
            <Link 
              href={`/albums/${id}/upload`}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition"
            >
              + Add Photo/Audio
            </Link>
          </div>

          {memories && memories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {memories.map((memory) => (
                <div key={memory.id} className="border rounded-xl p-2 shadow-sm">
                  {/* Image/Audio Player will go here */}
                  <div className="aspect-square bg-gray-100 rounded-lg mb-2"></div>
                  <p className="font-medium px-2">{memory.title}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border-2 border-dashed rounded-3xl text-gray-400">
              This album is empty. Time to upload some memories!
            </div>
          )}
        </section>
      </div>
    </main>
  )
}