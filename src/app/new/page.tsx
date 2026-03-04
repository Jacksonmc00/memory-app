import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function NewAlbumPage() {
  async function createAlbum(formData: FormData) {
    'use server'
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    const title = formData.get('title') as string
    const description = formData.get('description') as string

    const { error } = await supabase
      .from('albums')
      .insert({
        title,
        description,
        user_id: user?.id,
      })

    if (error) {
      console.error(error)
      return
    }

    redirect('/')
  }

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Create New Album</h1>
      <form action={createAlbum} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="title" className="font-medium text-gray-700">Album Title</label>
          <input
            id="title"
            name="title"
            type="text"
            required
            className="border rounded-lg p-2"
            placeholder="e.g., Summer 2026 Trapping Trip"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="description" className="font-medium text-gray-700">Description</label>
          <textarea
            id="description"
            name="description"
            rows={4}
            className="border rounded-lg p-2"
            placeholder="What is this album about?"
          />
        </div>

        <div className="flex gap-4 mt-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Create Album
          </button>
          <a href="/" className="px-6 py-2 border rounded-lg hover:bg-gray-50">
            Cancel
          </a>
        </div>
      </form>
    </main>
  )
}