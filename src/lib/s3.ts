import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.THINKON_REGION!,
  endpoint: process.env.THINKON_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.THINKON_ACCESS_KEY!,
    secretAccessKey: process.env.THINKON_SECRET_KEY!,
  },
  forcePathStyle: true, // Often required for S3-compatible providers like ThinkOn
});

export async function getUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.THINKON_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  // This URL will only be valid for 60 seconds
  return await getSignedUrl(s3Client, command, { expiresIn: 60 });
}