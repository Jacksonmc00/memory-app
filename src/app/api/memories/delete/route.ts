import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

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
    const { memoryId, storageKey, audioKey } = await request.json()

    // 1. Delete from ThinkOn (Photo)
    await s3Client.send(new DeleteObjectCommand({
      Bucket: process.env.THINKON_BUCKET_NAME,
      Key: storageKey,
    }))

    // 2. Delete from ThinkOn (Audio if exists)
    if (audioKey) {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: process.env.THINKON_BUCKET_NAME,
        Key: audioKey,
      }))
    }

    // 3. Delete from Supabase (Database record)
    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('id', memoryId)
      .eq('user_id', user.id) // Security check: must own the record

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete Error:', error.message)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}