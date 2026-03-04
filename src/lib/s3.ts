import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  region: process.env.THINKON_REGION || "ca-central-1",
  endpoint: process.env.THINKON_ENDPOINT,
  credentials: {
    accessKeyId: process.env.THINKON_ACCESS_KEY!,
    secretAccessKey: process.env.THINKON_SECRET_KEY!,
  },
  forcePathStyle: true, // Required for most S3-compatible providers like ThinkOn
});