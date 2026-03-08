import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import Link from 'next/link'

// Initialize S3 Client with your ThinkOn credentials
const s3Client = new S3Client({
  region: process.env.THINKON_REGION!,
  endpoint: process.env.THINKON_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.THINKON_ACCESS_KEY!,
    secretAccessKey: process.env.THINKON_SECRET_KEY!,
  },
  forcePathStyle: true,
});

export default async function AlbumPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // Await params for Next.js 15 compatibility
  const { id } = await params;
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  // 1. Fetch Album metadata
  const { data: album, error: albumError } = await supabase
    .from('albums')
    .select('*')
    .eq('id', id)
    .single()

  // --- DEBUG BLOCK: Replace notFound() with clear feedback ---
  if (!album) {
    return (
      <main className="min-h-screen bg-black text-white p-20 font-mono">
        <h1 className="text-red-500 text-3xl font-bold mb-4 italic uppercase tracking-tighter">Debug: Archive Not Found</h1>
        <div className="space-y-4 bg-gray-900 p-8 rounded-3xl border border-gray-800">
          <p><span className="text-gray-500 uppercase text-[10px] font-bold">Target ID:</span> {id}</p>
          <p><span className="text-gray-500 uppercase text-[10px] font-bold">Supabase Error:</span> {albumError?.message || "None (likely RLS filtering)"}</p>
          <hr className="border-gray-800" />
          <p className="text-xs text-gray-400">
            If Error is empty, the database found 0 rows. This usually means the <code className="bg-black px-1">user_id</code> 
            in your <code className="bg-black px-1">albums</code> table doesn't match your current login ID, 
            or Row Level Security (RLS) is blocking the read.
          </p>
          <Link href="/" className="inline-block mt-4 text-white underline font-bold">← Return to Dashboard</Link>
        </div>
      </main>
    )
  }
  // --- END DEBUG BLOCK ---

  // 2. Fetch all memories associated with this album
  const { data: memories } = await supabase
    .from('memories')
    .select('*')
    .eq('album_id', id)
    .order('created_at', { ascending: false })

  // 3. Generate Signed URLs for private ThinkOn content
  const memoriesWithUrls = await Promise.all((memories || []).map(async (memory) => {
    try {
      const photoCommand = new GetObjectCommand({
        Bucket: process.env.THINKON_BUCKET_NAME,
        Key: memory.storage_key,
      })
      const photoUrl = await getSignedUrl(s3Client, photoCommand, { expiresIn: 3600 })

      let audioUrl = null
      if (memory.audio_key) {
        const audioCommand = new GetObjectCommand({
          Bucket: process.env.THINKON_BUCKET_NAME,
          Key: memory.audio_key,
        })
        audioUrl = await getSignedUrl(s3Client, audioCommand, { expiresIn: 3600 })
      }

      return { ...memory, photoUrl, audioUrl }
    } catch (s3Err) {
      console.error("S3 Link Error:", s3Err);
      return { ...memory, photoUrl: '', audioUrl: null };
    }
  }))

  return (
    <main className="min-h-screen bg-[#fafafa] p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <nav className="mb-8">
          <Link href="/" className="text-[10px] font-black tracking-[0.2em] text-gray-400 hover:text-black transition-colors uppercase">
            ← Back to Archives
          </Link>
        </nav>

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="space-y-2">
            <h1 className="text-5xl font-black italic tracking-tighter uppercase text-gray-900 leading-none">
              {album.title}
            </h1>
            <p className="text-gray-400 text-lg font-medium max-w-2xl">
              {album.description || "Private Canadian Archive"}
            </p>
          </div>
          <Link 
            href={`/albums/${id}/upload`}
            className="inline-flex items-center justify-center bg-black text-white px-8 py-4 rounded-2xl font-bold hover:bg-gray-800 transition shadow-xl shadow-gray-200"
          >
            + ADD MEMORY
          </Link>
        </header>

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 space-y-8">
          {memoriesWithUrls.map((memory) => (
            <div key={memory.id} className="break-inside-avoid bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 hover:shadow-2xl transition-all duration-500 group">
              <div className="relative overflow-hidden aspect-auto">
                <img 
                  src={memory.photoUrl} 
                  alt={memory.title}
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="p-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black tracking-[0.2em] text-gray-300 uppercase">Memory</span>
                  <span className="text-[10px] font-bold text-gray-400">{new Date(memory.created_at).toLocaleDateString()}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">{memory.title}</h3>
                {memory.audioUrl && (
                  <div className="pt-6 border-t border-gray-50">
                    <audio controls className="w-full h-10 accent-black">
                      <source src={memory.audioUrl} type="audio/webm" />
                    </audio>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}