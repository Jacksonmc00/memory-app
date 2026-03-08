'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MemoryCard({ memory }: { memory: any }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const deleteMemory = async () => {
    if (!confirm("Are you sure you want to delete this memory forever?")) return
    
    setIsDeleting(true)
    try {
      const res = await fetch('/api/memories/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          memoryId: memory.id, 
          storageKey: memory.storage_key,
          audioKey: memory.audio_key 
        }),
      })

      if (res.ok) {
        router.refresh() // Refresh the gallery to show it's gone
      }
    } catch (err) {
      alert("Delete failed")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className={`break-inside-avoid bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 group transition-opacity ${isDeleting ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
      <div className="relative">
        <img src={memory.photoUrl} alt={memory.title} className="w-full h-auto" />
        <button 
          onClick={deleteMemory}
          className="absolute top-4 right-4 bg-white/80 backdrop-blur-md p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-red-500"
        >
          {isDeleting ? '...' : '🗑️'}
        </button>
      </div>
      <div className="p-8">
        <h3 className="text-xl font-bold text-gray-900">{memory.title}</h3>
        {/* Audio Player Logic here... */}
      </div>
    </div>
  )
}