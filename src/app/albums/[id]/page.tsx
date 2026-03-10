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

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
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
    <main className="min-h-screen bg-linen text-charcoal">
      <nav className="sticky top-0 z-50 w-full bg-linen/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-24 flex justify-between items-center">
          <Link href="/" className="text-[10px] font-bold tracking-[0.3em] text-taupe hover:text-charcoal transition-colors uppercase">
            ← Archives
          </Link>
          <AlbumSettings album={album} memories={memories || []} />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <header className="text-center mb-20 space-y-6">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-taupe mb-4">
              Est. 2026 // Ontario, CA
            </span>
            <h1 className="text-6xl md:text-8xl font-serif italic text-charcoal leading-tight">
              {album.title}
            </h1>
            <div className="w-12 h-[1px] bg-taupe/30 my-8"></div>
            {/* The descriptive text has been removed from here */}
          </div>

          <div className="pt-8">
            <Link 
              href={`/albums/${id}/upload`}
              className="inline-flex items-center justify-center border border-taupe/30 text-charcoal px-10 py-4 rounded-full font-bold hover:bg-charcoal hover:text-white transition-all duration-500"
            >
              Add a new memory
            </Link>
          </div>
        </header>

        <div className="columns-1 md:columns-2 gap-12 space-y-12">
          {memoriesWithUrls.map((memory) => (
            <MemoryCard key={memory.id} memory={memory} />
          ))}
        </div>
      </div>
    </main>
  )
}