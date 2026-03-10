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
      return { ...memory, photoUrl }
    } catch (err) {
      return { ...memory, photoUrl: '' }
    }
  }))

  return (
    <main className="min-h-screen bg-[#FDFCF8] text-[#2D2926]">
      {/* 1. Soft, Floating Navigation */}
      <nav className="sticky top-0 z-50 w-full bg-[#FDFCF8]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-24 flex justify-between items-center">
          <Link href="/" className="text-xs font-bold tracking-widest text-[#8C867A] hover:text-[#2D2926] transition-colors uppercase">
            ← Your Archives
          </Link>
          <AlbumSettings album={album} memories={memories || []} />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* 2. Natural, Warm Header */}
        <header className="text-center mb-20 space-y-6">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#A69F92] mb-4">
              Est. 2026 // Russell, Ontario
            </span>
            <h1 className="text-5xl md:text-7xl font-serif italic text-[#2D2926] leading-tight">
              {album.title}
            </h1>
            <div className="w-12 h-[1px] bg-[#D9D4CC] my-8"></div>
            <p className="text-[#6B655B] text-lg font-medium max-w-xl italic leading-relaxed">
              {album.description || "A collection of shared stories and quiet moments."}
            </p>
          </div>

          <div className="pt-8">
            <Link 
              href={`/albums/${id}/upload`}
              className="inline-flex items-center justify-center border border-[#D9D4CC] text-[#2D2926] px-10 py-4 rounded-full font-bold hover:bg-[#2D2926] hover:text-white transition-all duration-300"
            >
              Add a new memory
            </Link>
          </div>
        </header>

        {/* 3. The Gallery Grid */}
        <div className="columns-1 md:columns-2 gap-12 space-y-12">
          {memoriesWithUrls.map((memory) => (
            <MemoryCard key={memory.id} memory={memory} />
          ))}
        </div>
      </div>
    </main>
  )
}