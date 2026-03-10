import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import Link from 'next/link'
import { notFound } from 'next/navigation'
import MemoryCard from '@/components/MemoryCard'
import AlbumSettings from '@/components/AlbumSettings'

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
  const { id } = await params;
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: album } = await supabase.from('albums').select('*').eq('id', id).single()
  if (!album) return notFound()

  const { data: memories } = await supabase
    .from('memories')
    .select('*')
    .eq('album_id', id)
    .order('created_at', { ascending: false })

  const memoriesWithUrls = await Promise.all((memories || []).map(async (memory) => {
    try {
      const photoCommand = new GetObjectCommand({ Bucket: process.env.THINKON_BUCKET_NAME, Key: memory.storage_key })
      const photoUrl = await getSignedUrl(s3Client, photoCommand, { expiresIn: 3600 })

      let audioUrl = null
      if (memory.audio_key) {
        const audioCommand = new GetObjectCommand({ Bucket: process.env.THINKON_BUCKET_NAME, Key: memory.audio_key })
        audioUrl = await getSignedUrl(s3Client, audioCommand, { expiresIn: 3600 })
      }
      return { ...memory, photoUrl, audioUrl }
    } catch (err) {
      return { ...memory, photoUrl: '', audioUrl: null }
    }
  }))

  return (
    <main className="min-h-screen bg-[#fafafa]">
      {/* 1. Glassmorphism Navigation */}
      <nav className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-xl border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <Link href="/" className="group flex items-center gap-2">
            <span className="text-[10px] font-black tracking-[0.3em] text-gray-400 group-hover:text-black transition-colors uppercase">
              ← Return to Dashboard
            </span>
          </Link>
          <AlbumSettings album={album} memories={memories || []} />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        {/* 2. Editorial Header Section */}
        <header className="relative mb-24">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <span className="h-[1px] w-12 bg-black"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">
                Established 2026 // Private Archive
              </span>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-6">
                <h1 className="text-6xl md:text-9xl font-black italic tracking-tighter uppercase text-gray-900 leading-[0.85] animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {album.title}
                </h1>
                <p className="text-gray-500 text-lg font-medium max-w-xl border-l-2 border-gray-100 pl-6 ml-1 leading-relaxed">
                  {album.description || "A collection of moments captured in time, preserved in the Canadian cloud."}
                </p>
              </div>

              <Link 
                href={`/albums/${id}/upload`}
                className="group relative inline-flex items-center justify-center bg-black text-white px-10 py-5 rounded-2xl font-bold transition-all hover:pr-14 active:scale-95 shadow-2xl shadow-gray-200"
              >
                <span>ADD TO ARCHIVE</span>
                <span className="absolute right-6 opacity-0 group-hover:opacity-100 transition-all">→</span>
              </Link>
            </div>
          </div>
        </header>

        {/* 3. Refined Masonry Grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-10 space-y-10">
          {memoriesWithUrls.length > 0 ? (
            memoriesWithUrls.map((memory) => (
              <MemoryCard key={memory.id} memory={memory} />
            ))
          ) : (
            <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-gray-100 shadow-sm">
              <div className="text-4xl mb-4">🎞️</div>
              <p className="text-gray-400 font-bold uppercase tracking-widest italic text-sm">
                This archive is currently empty.
              </p>
              <Link href={`/albums/${id}/upload`} className="mt-6 inline-block text-black text-xs font-black border-b-2 border-black pb-1 hover:text-gray-400 hover:border-gray-400 transition">
                Create the first record
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}