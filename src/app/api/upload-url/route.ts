import { getUploadUrl } from '@/lib/s3'
import { generateMemoryPath } from '@/lib/paths'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { fileName, contentType, albumId } = await request.json()
  
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Generate the path: users/[id]/albums/[id]/timestamp_file.jpg
  const key = generateMemoryPath(user.id, albumId, fileName)

  try {
    const url = await getUploadUrl(key, contentType)
    return NextResponse.json({ url, key })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 })
  }
}