'use client'
import { useState } from 'react'
import { login, signup } from './actions'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const [isLoggingIn, setIsLoggingIn] = useState(true)

  return (
    <main className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 p-10 border border-gray-100"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black italic tracking-tighter text-gray-900">MEMORIES</h1>
          <p className="text-gray-400 text-sm mt-2 font-medium">
            {isLoggingIn ? 'Welcome back to the archive' : 'Create your private vault'}
          </p>
        </div>

        <form className="flex flex-col gap-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 ml-4">Email Address</label>
            <input 
              name="email" 
              type="email" 
              required 
              className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-black transition-all outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 ml-4">Password</label>
            <input 
              name="password" 
              type="password" 
              required 
              className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-black transition-all outline-none"
              placeholder="••••••••"
            />
          </div>

          <div className="flex flex-col gap-3 mt-6">
            <button 
              formAction={isLoggingIn ? login : signup}
              className="w-full bg-black text-white font-bold py-4 rounded-2xl hover:bg-gray-800 transition-all active:scale-[0.98]"
            >
              {isLoggingIn ? 'Sign In' : 'Create Account'}
            </button>
            
            <button 
              type="button"
              onClick={() => setIsLoggingIn(!isLoggingIn)}
              className="text-sm text-gray-400 font-medium hover:text-black transition-colors"
            >
              {isLoggingIn ? "Don't have an account? Sign up" : "Already have an account? Log in"}
            </button>
          </div>
        </form>
      </motion.div>
    </main>
  )
}