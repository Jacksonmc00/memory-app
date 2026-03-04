'use client'
import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export default function UploadMemoryPage() {
  const { id: albumId } = useParams()
  const router = useRouter()
  
  const [file, setFile] = useState<File | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  
  const mediaRecorder = useRef<MediaRecorder | null>(null)

  // --- Audio Recording Logic ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream)
      const chunks: Blob[] = []
      
      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }
      
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setAudioBlob(blob)
      }
      
      mediaRecorder.current.start()
      setIsRecording(true)
    } catch (err) {
      alert("Microphone access denied. You can still upload the photo!")
    }
  }

  const stopRecording = () => {
    mediaRecorder.current?.stop()
    setIsRecording(false)
    // Stop all microphone tracks to turn off the "red dot" in browser
    mediaRecorder.current?.stream.getTracks().forEach(track => track.stop())
  }

  // --- The Proxy Upload Handler ---
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return alert('Please select a photo first')
    
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('albumId', albumId as string)
      formData.append('title', file.name)
      
      if (audioBlob) {
        formData.append('audio', audioBlob, 'story.webm')
      }

      // We send this to our OWN server route to bypass ThinkOn CORS
      const res = await fetch('/api/memories/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      // Success! Head back to the album gallery
      router.push(`/albums/${albumId}`)
      router.refresh() 
    } catch (err: any) {
      console.error('Upload Error:', err)
      alert(`Upload failed: ${err.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#fafafa] p-4 md:p-8 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 border border-gray-100"
      >
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-black italic tracking-tighter text-gray-900 uppercase">Add Memory</h1>
          <p className="text-gray-400 text-sm font-medium mt-1">Upload to your private Canadian vault</p>
        </header>
        
        <form onSubmit={handleUpload} className="space-y-8">
          {/* Photo Picker */}
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 ml-2">Visual Content</label>
            <div className="relative group">
              <input 
                type="file" 
                accept="image/*" 
                required
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-3 file:px-6
                  file:rounded-2xl file:border-0
                  file:text-sm file:font-bold
                  file:bg-black file:text-white
                  hover:file:bg-gray-800 file:transition-all
                  bg-gray-50 rounded-3xl p-2 border-2 border-dashed border-gray-100"
              />
            </div>
          </div>

          {/* Audio Story Section */}
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 ml-2">Voice Story (Optional)</label>
            <div className="flex items-center justify-between gap-4 p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-900 uppercase">Narrate this moment</p>
                <p className="text-[10px] text-gray-400">Record a 30-second memory</p>
              </div>

              {!isRecording ? (
                <button 
                  type="button" 
                  onClick={startRecording} 
                  className="bg-white border shadow-sm p-4 rounded-full hover:scale-110 transition-transform"
                >
                  <div className="w-4 h-4 bg-red-500 rounded-full" />
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={stopRecording} 
                  className="bg-black p-4 rounded-full animate-pulse"
                >
                  <div className="w-4 h-4 bg-white rounded-sm" />
                </button>
              )}
            </div>
            {audioBlob && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 ml-4">
                <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">● Audio Captured</span>
                <button type="button" onClick={() => setAudioBlob(null)} className="text-[10px] text-gray-400 hover:text-red-500 underline">Clear</button>
              </motion.div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button 
              type="submit"
              disabled={isUploading}
              className={`w-full py-5 rounded-[2rem] font-black text-sm tracking-widest uppercase transition-all shadow-xl shadow-gray-200
                ${isUploading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800 active:scale-95'}`}
            >
              {isUploading ? 'ARCHIVING...' : 'SAVE TO MEMORY APP'}
            </button>
          </div>
        </form>
      </motion.div>
    </main>
  )
}