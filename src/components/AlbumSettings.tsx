'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AlbumSettings({ album, memories }: { album: any, memories: any[] }) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(album.title)
  const [description, setDescription] = useState(album.description)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const res = await fetch('/api/albums/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumId: album.id, title, description }),
      })

      if (res.ok) {
        setIsEditing(false)
        router.refresh() // Updates the header text instantly
      }
    } catch (err) {
      alert("Update failed")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    const check = prompt("Type 'CONFIRM' to wipe this archive and all its photos:")
    if (check !== 'CONFIRM') return

    setLoading(true)
    const res = await fetch('/api/albums/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ albumId: album.id, memories }),
    })
    if (res.ok) router.push('/')
  }

  return (
    <div className="flex gap-6 items-center">
      <button 
        onClick={() => setIsEditing(true)}
        className="text-[10px] font-black tracking-widest text-gray-400 hover:text-black uppercase transition-colors"
      >
        Edit Archive
      </button>
      
      <button 
        onClick={handleDelete}
        className="text-[10px] font-black tracking-widest text-red-300 hover:text-red-600 uppercase transition-colors"
      >
        Delete
      </button>

      {/* Edit Modal Overlay */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-6">Edit Archive Details</h2>
            
            <form onSubmit={handleUpdate} className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Archive Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold focus:ring-2 focus:ring-black transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Description</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 font-medium h-32 focus:ring-2 focus:ring-black transition-all"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 bg-black text-white font-bold py-4 rounded-2xl hover:bg-gray-800 transition shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'SAVE CHANGES'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)}
                  className="px-8 py-4 font-bold text-gray-400 hover:text-black transition"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}