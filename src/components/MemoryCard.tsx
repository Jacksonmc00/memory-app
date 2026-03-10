'use client'
// ... keep imports same

export default function MemoryCard({ memory }: { memory: any }) {
  // ... keep delete logic same

  return (
    <div className="break-inside-avoid bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-700 hover:shadow-[0_20px_50px_rgba(166,159,146,0.1)]">
      <div className="relative group overflow-hidden">
        <img 
          src={memory.photoUrl} 
          className="w-full h-auto object-cover transition-transform duration-[2s] group-hover:scale-105"
        />
        {/* Delete button logic... */}
      </div>

      <div className="p-10 space-y-6">
        <div className="space-y-1">
          <span className="text-[9px] font-bold tracking-[0.2em] text-taupe uppercase">
            {new Date(memory.created_at).toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })}
          </span>
          <h3 className="text-2xl font-serif italic text-charcoal">
            {memory.title}
          </h3>
        </div>
      </div>
    </div>
  )
}