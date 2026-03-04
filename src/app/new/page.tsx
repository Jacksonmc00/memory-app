import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function NewAlbumPage() {
  async function createAlbum(formData: FormData) {
    'use server'
    
    // In Next.js 16, we await the cookie store
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      redirect('/login')
    }

    const title = formData.get('title') as string
    const description = formData.get('description') as string

    const { error } = await supabase
      .from('albums')
      .insert({
        title,
        description,
        user_id: user.id,
      })

    if (error) {
      console.error('Supabase Error:', error.message)
      return
    }

    redirect('/')
  }

  return (
    <main className="max-w-2xl mx-auto p-8 min-h-screen flex flex-col justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Create New Album</h1>
        <form action={createAlbum} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="title" className="font-semibold text-gray-700">Album Title</label>
            <input
              id="title"
              name="title"
              type="text"
              required
              className="border rounded-xl p-3 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="e.g., Summer 2026 Trapping Trip"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="description" className="font-semibold text-gray-700">Description</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              className="border rounded-xl p-3 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="What is this album about?"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200"
            >
              Create Album
            </button>
            <a href="/" className="px-6 py-3 border rounded-xl hover:bg-gray-50 transition text-gray-600 font-medium">
              Cancel
            </a>
          </div>
        </form>
      </div>
    </main>
  )
}