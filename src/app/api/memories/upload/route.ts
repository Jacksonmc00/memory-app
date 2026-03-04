import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { generateMemoryPath } from '@/lib/paths'

const s3Client = new S3Client({
  region: process.env.THINKON_REGION!,
  endpoint: process.env.THINKON_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.THINKON_ACCESS_KEY!,
    secretAccessKey: process.env.THINKON_SECRET_KEY!,
  },
  forcePathStyle: true,
});

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const albumId = formData.get('albumId') as string
    const title = formData.get('title') as string

    if (!file) throw new Error("No file provided")

    // Convert the file to a buffer for S3
    const buffer = Buffer.from(await file.arrayBuffer())
    const key = generateMemoryPath(user.id, albumId, file.name)

    // 1. Upload to ThinkOn (Server-to-Server, so NO CORS BLOCKS)
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.THINKON_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }))

    // 2. Insert record into Supabase
    const { error: dbError } = await supabase.from('memories').insert({
      album_id: albumId,
      user_id: user.id,
      storage_key: key,
      title: title,
    })

    if (dbError) throw dbError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Upload Error:', error.message)
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 })
  }
}