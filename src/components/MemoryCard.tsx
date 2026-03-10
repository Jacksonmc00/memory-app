'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MemoryCard({ memory }: { memory: any }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm("Remove this memory from the collection?")) return
    setIsDeleting(true)

    try {
      const res = await fetch('/api/memories/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          memoryId: memory.id, 
          storageKey: memory.storage_key,
          audioKey: memory.audio_key 
        })
      })

      if (res.ok) router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className={`
      break-inside-avoid bg-white rounded-[2rem] overflow-hidden 
      transition-all duration-700 ease-in-out
      shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(140,134,122,0.1)]
      ${isDeleting ? 'opacity-20 scale-95' : 'opacity-100'}
    `}>
      {/* Image Container with Soft Treatment */}
      <div className="relative group overflow-hidden bg-[#F9F8F6]">
        {memory.photoUrl ? (
          <img 
            src={memory.photoUrl} 
            alt={memory.title} 
            className="w-full h-auto object-cover transition-transform duration-[1.5s] group-hover:scale-105"
          />
        ) : (
          <div className="aspect-square flex items-center justify-center text-[#D9D4CC]">
            <span className="text-2xl">📸</span>
          </div>
        )}

        {/* Subtle Overlay for the Delete Button */}
        <button 
          onClick={handleDelete}
          className="absolute top-6 right-6 p-3 rounded-full bg-white/60 backdrop-blur-md text-[#8C867A] opacity-0 group-hover:opacity-100 transition-all duration-300 hover:text-red-400 hover:bg-white"
          title="Remove memory"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </button>
      </div>

      {/* Content Section */}
      <div className="p-10 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-bold tracking-[0.2em] text-[#A69F92] uppercase">
              {new Date(memory.created_at).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h3 className="text-2xl font-serif italic text-[#2D2926] leading-snug">
            {memory.title}
          </h3>
        </div>

        {/* Audio Story Player - Muted Tones */}
        {memory.audioUrl && (
          <div className="pt-6 border-t border-[#F2F0ED]">
            <p className="text-[9px] font-bold tracking-widest text-[#A69F92] uppercase mb-4">Recorded Story</p>
            <audio controls className="w-full h-8 brightness-95 contrast-75">
              <source src={memory.audioUrl} type="audio/webm" />
            </audio>
          </div>
        )}
      </div>
    </div>
  )
}