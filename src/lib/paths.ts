export function generateMemoryPath(userId: string, albumId: string, fileName: string) {
  const timestamp = Date.now();
  const cleanName = fileName.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
  
  // Pattern: users/123/albums/456/171234567_photo.jpg
  return `users/${userId}/albums/${albumId}/${timestamp}_${cleanName}`;
}