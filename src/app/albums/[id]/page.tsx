import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import Link from 'next/link'
import { notFound } from 'next/navigation'
import MemoryCard from '@/components/MemoryCard'
import AlbumSettings from '@/components/AlbumSettings'

// Initialize S3 Client with ThinkOn credentials for generating viewing links
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
  const { data: album } = await supabase
    .from('albums')
    .select('*')
    .eq('id', id)
    .single()

  if (!album) return notFound()

  // 2. Fetch all memories associated with this album
  const { data: memories } = await supabase
    .from('memories')
    .select('*')
    .eq('album_id', id)
    .order('created_at', { ascending: false })

  // 3. Generate Signed URLs for private ThinkOn content
  const memoriesWithUrls = await Promise.all((memories || []).map(async (memory) => {
    try {
      // Generate Photo URLguest pass (1 hour)
      const photoCommand = new GetObjectCommand({
        Bucket: process.env.THINKON_BUCKET_NAME,
        Key: memory.storage_key,
      })
      const photoUrl = await getSignedUrl(s3Client, photoCommand, { expiresIn: 3600 })

      // Generate Audio URL (if it exists)
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
      console.error("S3 Link Generation Error:", s3Err);
      return { ...memory, photoUrl: '', audioUrl: null };
    }
  }))

  return (
    <main className="min-h-screen bg-[#fafafa] p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Navigation Bar with Edit/Delete Controls */}
        <nav className="flex justify-between items-center mb-12">
          <Link href="/" className="text-[10px] font-black tracking-[0.2em] text-gray-400 hover:text-black transition-colors uppercase">
            ← Back to Archives
          </Link>
          <AlbumSettings album={album} memories={memories || []} />
        </nav>

        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="space-y-2">
            <h1 className="text-5xl font-black italic tracking-tighter uppercase text-gray-900 leading-none">
              {album.title}
            </h1>
            <p className="text-gray-400 text-lg font-medium max-w-2xl">
              {album.description || "A private collection of captured moments."}
            </p>
          </div>
          
          <Link 
            href={`/albums/${id}/upload`}
            className="inline-flex items-center justify-center bg-black text-white px-8 py-4 rounded-2xl font-bold hover:bg-gray-800 transition shadow-xl shadow-gray-200 active:scale-95"
          >
            + ADD MEMORY
          </Link>
        </header>

        {/* Masonry-style Grid of Memory Cards */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 space-y-8">
          {memoriesWithUrls.length > 0 ? (
            memoriesWithUrls.map((memory) => (
              <MemoryCard key={memory.id} memory={memory} />
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
              <p className="text-gray-400 font-bold uppercase tracking-widest italic">The archive is currently empty.</p>
              <Link href={`/albums/${id}/upload`} className="text-black text-xs font-black underline mt-4 inline-block">Upload your first memory</Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}