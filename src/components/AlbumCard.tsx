'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface AlbumCardProps {
  id: string
  title: string
  description: string
  coverUrl?: string | null
}

export default function AlbumCard({ id, title, description, coverUrl }: AlbumCardProps) {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="relative break-inside-avoid mb-6 group cursor-pointer"
    >
      <Link href={`/albums/${id}`}>
        <div className="relative overflow-hidden rounded-3xl border border-gray-100 shadow-sm transition-shadow hover:shadow-xl">
          {/* Cover Image Placeholder */}
          <div className="bg-gray-100 min-h-[200px] flex items-center justify-center">
            {coverUrl ? (
              <img 
                src={coverUrl} 
                alt={title} 
                className="w-full h-auto object-cover"
              />
            ) : (
              <div className="flex flex-col items-center text-gray-400 p-8">
                <span className="text-4xl mb-2">📸</span>
                <p className="text-xs font-medium uppercase tracking-widest">No Photos Yet</p>
              </div>
            )}
          </div>

          {/* Glassmorphism Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/70 backdrop-blur-md border-t border-white/20 translate-y-2 group-hover:translate-y-0 transition-transform">
            <h3 className="font-bold text-gray-900 leading-tight">{title}</h3>
            <p className="text-xs text-gray-600 line-clamp-1 mt-1">{description}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}