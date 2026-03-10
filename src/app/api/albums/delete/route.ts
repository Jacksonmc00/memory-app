import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { albumId, memories } = await request.json();

    // 1. Wipe all associated files from ThinkOn Storage
    // We loop through the memories passed from the frontend
    for (const memory of memories) {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: process.env.THINKON_BUCKET_NAME,
        Key: memory.storage_key,
      }));

      if (memory.audio_key) {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: process.env.THINKON_BUCKET_NAME,
          Key: memory.audio_key,
        }));
      }
    }

    // 2. Delete the Album from Supabase
    // Note: Ensure your DB foreign key for memories is set to "ON DELETE CASCADE"
    const { error } = await supabase
      .from('albums')
      .delete()
      .eq('id', albumId)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Album Delete Error:', error.message);
    return NextResponse.json({ error: 'Failed to delete album' }, { status: 500 });
  }
}