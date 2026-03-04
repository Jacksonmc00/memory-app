'use client'
import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export default function UploadMemoryPage() {
  const { id: albumId } = useParams()
  const router = useRouter()
  
  // State for files and recording
  const [file, setFile] = useState<File | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  
  const mediaRecorder = useRef<MediaRecorder | null>(null)

  // --- Audio Recording Logic ---
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder.current = new MediaRecorder(stream)
    const chunks: any[] = []
    mediaRecorder.current.ondataavailable = (e) => chunks.push(e.data)
    mediaRecorder.current.onstop = () => setAudioBlob(new Blob(chunks, { type: 'audio/webm' }))
    mediaRecorder.current.start()
    setIsRecording(true)
  }

  const stopRecording = () => {
    mediaRecorder.current?.stop()
    setIsRecording(false)
  }

  // --- The "ThinkOn" Upload Handshake ---
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return alert('Please select a photo first')
    setIsUploading(true)

    try {
      // 1. Get a Presigned URL from our Server Action
      const res = await fetch('/api/upload-url', {
        method: 'POST',
        body: JSON.stringify({ 
          fileName: file.name, 
          contentType: file.type,
          albumId 
        })
      })
      const { url, key } = await res.json()

      // 2. Upload DIRECTLY to ThinkOn S3
      await fetch(url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      })

      // 3. Save the record to Supabase
      // (We'll create a simple API route or action for this next)
      await fetch('/api/memories/create', {
        method: 'POST',
        body: JSON.stringify({ albumId, storageKey: key, title: file.name })
      })

      router.push(`/albums/${albumId}`)
    } catch (err) {
      console.error(err)
      alert('Upload failed. Check your ThinkOn CORS settings.')
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
          {/* Photo Picker */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Step 1: The Visual</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
            />
          </div>

          {/* Audio Recorder UI */}
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