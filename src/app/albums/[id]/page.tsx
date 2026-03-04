import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import Link from 'next/link'
import { notFound } from 'next/navigation'

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

// In Next.js 15, params is a Promise
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

  // 1. Fetch Album metadata
  const { data: album, error: albumError } = await supabase
    .from('albums')
    .select('*')
    .eq('id', id)
    .single()

  // Debugging: If album is missing, check Vercel Logs for these:
  if (albumError) console.error("Supabase Album Error:", albumError.message);
  if (!album) {
    console.log(`No album found for ID: ${id}`);
    return notFound();
  }

  // 2. Fetch all memories associated with this album
  const { data: memories } = await supabase
    .from('memories')
    .select('*')
    .eq('album_id', id)
    .order('created_at', { ascending: false })

  // 3. Generate Signed URLs for private ThinkOn content
  const memoriesWithUrls = await Promise.all((memories || []).map(async (memory) => {
    try {
      // Generate Photo URL
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
        
        {/* Breadcrumb & Navigation */}
        <nav className="mb-8">
          <Link href="/" className="text-[10px] font-black tracking-[0.2em] text-gray-400 hover:text-black transition-colors uppercase">
            ← Back to Archives
          </Link>
        </nav>

        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="space-y-2">
            <h1 className="text-5xl font-black italic tracking-tighter uppercase text-gray-900 leading-none">
              {album.title}
            </h1>
            <p className="text-gray-400 text-lg font-medium max-w-2xl">
              {album.description || "No description provided for this archive."}
            </p>
          </div>
          
          <Link 
            href={`/albums/${id}/upload`}
            className="inline-flex items-center justify-center bg-black text-white px-8 py-4 rounded-2xl font-bold hover:bg-gray-800 transition shadow-xl shadow-gray-200 active:scale-95"
          >
            + ADD MEMORY
          </Link>
        </header>

        {/* Masonry-style Grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 space-y-8">
          {memoriesWithUrls.length > 0 ? (
            memoriesWithUrls.map((memory) => (
              <div 
                key={memory.id} 
                className="break-inside-avoid bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 hover:shadow-2xl hover:border-gray-200 transition-all duration-500 group"
              >
                {/* Image Container */}
                <div className="relative overflow-hidden aspect-auto">
                  {memory.photoUrl ? (
                    <img 
                      src={memory.photoUrl} 
                      alt={memory.title}
                      className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="aspect-video bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                      Image Unavailable
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black tracking-[0.2em] text-gray-300 uppercase">
                      Memory Record
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">
                      {new Date(memory.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    {memory.title}
                  </h3>

                  {/* Audio Story Player */}
                  {memory.audioUrl && (
                    <div className="pt-6 border-t border-gray-50">
                      <p className="text-[10px] font-black tracking-widest text-black uppercase mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                        Listen to Story
                      </p>
                      <audio controls className="w-full h-10 accent-black">
                        <source src={memory.audioUrl} type="audio/webm" />
                      </audio>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
              <p className="text-gray-400 font-bold uppercase tracking-widest italic">The archive is currently empty.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}