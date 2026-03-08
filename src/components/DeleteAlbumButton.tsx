'use client'
import { useRouter } from 'next/navigation'

export default function DeleteAlbumButton({ albumId, memories }: { albumId: string, memories: any[] }) {
  const router = useRouter()

  const deleteAlbum = async () => {
    const confirmation = prompt("To delete this entire album and ALL its photos, type 'DELETE':")
    if (confirmation !== 'DELETE') return

    // You would create a similar API route for /api/albums/delete
    const res = await fetch('/api/albums/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ albumId, memories })
    })

    if (res.ok) router.push('/')
  }

  return (
    <button onClick={deleteAlbum} className="text-[10px] font-bold text-gray-300 hover:text-red-500 transition-colors uppercase tracking-widest">
      Delete Album
    </button>
  )
}