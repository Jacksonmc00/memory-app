import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import Link from 'next/link'
import { notFound } from 'next/navigation'
import MemoryCard from '@/components/MemoryCard'
import DeleteAlbumButton from '@/components/DeleteAlbumButton'

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
    const photoCommand = new GetObjectCommand({ Bucket: process.env.THINKON_BUCKET_NAME, Key: memory.storage_key })
    const photoUrl = await getSignedUrl(s3Client, photoCommand, { expiresIn: 3600 })

    let audioUrl = null
    if (memory.audio_key) {
      const audioCommand = new GetObjectCommand({ Bucket: process.env.THINKON_BUCKET_NAME, Key: memory.audio_key })
      audioUrl = await getSignedUrl(s3Client, audioCommand, { expiresIn: 3600 })
    }
    return { ...memory, photoUrl, audioUrl }
  }))

  return (
    <main className="min-h-screen bg-[#fafafa] p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <nav className="flex justify-between items-center mb-12">
          <Link href="/" className="text-[10px] font-black tracking-widest text-gray-400 hover:text-black uppercase">
            ← Back to Archives
          </Link>
          <DeleteAlbumButton albumId={id} memories={memories || []} />
        </nav>

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="space-y-2">
            <h1 className="text-5xl font-black italic tracking-tighter uppercase text-gray-900 leading-none">
              {album.title}
            </h1>
            <p className="text-gray-400 text-lg font-medium max-w-2xl">{album.description}</p>
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
            <MemoryCard key={memory.id} memory={memory} />
          ))}
        </div>
      </div>
    </main>
  )
}