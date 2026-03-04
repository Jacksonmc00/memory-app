'use client'
import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function UploadMemoryPage() {
  const { id: albumId } = useParams()
  const router = useRouter()
  
  const [file, setFile] = useState<File | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  
  const mediaRecorder = useRef<MediaRecorder | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream)
      const chunks: Blob[] = []
      mediaRecorder.current.ondataavailable = (e) => chunks.push(e.data)
      mediaRecorder.current.onstop = () => setAudioBlob(new Blob(chunks, { type: 'audio/webm' }))
      mediaRecorder.current.start()
      setIsRecording(true)
    } catch (err) {
      alert("Mic access is required for audio stories.")
    }
  }

  const stopRecording = () => {
    mediaRecorder.current?.stop()
    setIsRecording(false)
    mediaRecorder.current?.stream.getTracks().forEach(track => track.stop())
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return alert('Please select a photo first')
    setIsUploading(true)

    try {
      // We use FormData to send the file to our PROXY route
      const formData = new FormData()
      formData.append('file', file)
      formData.append('albumId', albumId as string)
      formData.append('title', file.name)
      
      if (audioBlob) {
        formData.append('audio', audioBlob, 'story.webm')
      }

      // THIS IS THE KEY CHANGE: 
      // Pointing to /api/memories/upload (the folder we renamed/created)
      const res = await fetch('/api/memories/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      router.push(`/albums/${albumId}`)
      router.refresh()
    } catch (err: any) {
      console.error(err)
      alert(`Upload failed: ${err.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#fafafa] p-8 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl w-full bg-white rounded-[2.5rem] shadow-2xl p-10 border border-gray-100"
      >
        <h1 className="text-3xl font-black italic mb-8">Add a Memory</h1>
        
        <form onSubmit={handleUpload} className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Step 1: The Visual</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Step 2: The Story (Optional)</label>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
              {!isRecording ? (
                <button type="button" onClick={startRecording} className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold">Record Story</button>
              ) : (
                <button type="button" onClick={stopRecording} className="bg-black text-white px-4 py-2 rounded-lg font-bold animate-pulse">Stop Recording</button>
              )}
              {audioBlob && <span className="text-green-600 font-bold text-sm">✓ Audio Captured</span>}
            </div>
          </div>

          <button 
            type="submit"
            disabled={isUploading}
            className={`w-full py-4 rounded-2xl font-black text-white transition-all ${isUploading ? 'bg-gray-300' : 'bg-black hover:bg-gray-800'}`}
          >
            {isUploading ? 'SAVING TO VAULT...' : 'SAVE MEMORY'}
          </button>
        </form>
      </motion.div>
    </main>
  )
}