'use client'
import { useState, useRef } from 'react'

export default function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder.current = new MediaRecorder(stream)
    const chunks: Blob[] = []

    mediaRecorder.current.ondataavailable = (e) => chunks.push(e.data)
    mediaRecorder.current.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' })
      setAudioUrl(URL.createObjectURL(blob))
    }

    mediaRecorder.current.start()
    setIsRecording(true)
  }

  const stopRecording = () => {
    mediaRecorder.current?.stop()
    setIsRecording(false)
  }

  return (
    <div className="p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-center">
      <h3 className="font-bold text-lg mb-4">Record the Story</h3>
      
      {!isRecording ? (
        <button 
          onClick={startRecording}
          className="bg-red-500 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto hover:bg-red-600 transition shadow-lg"
        >
          <div className="w-4 h-4 bg-white rounded-full" />
        </button>
      ) : (
        <button 
          onClick={stopRecording}
          className="bg-gray-800 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto animate-pulse"
        >
          <div className="w-4 h-4 bg-white rounded-sm" />
        </button>
      )}

      {audioUrl && (
        <div className="mt-6">
          <p className="text-sm text-gray-500 mb-2">Preview your story:</p>
          <audio src={audioUrl} controls className="mx-auto" />
        </div>
      )}
    </div>
  )
}