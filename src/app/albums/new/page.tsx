import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function NewAlbumPage({
  searchParams,
}: {
  searchParams: Promise<{ title?: string; desc?: string }>
}) {
  // Grab the pre-filled data from the Quick Start templates
  const { title: defaultTitle, desc: defaultDesc } = await searchParams;

  async function createAlbum(formData: FormData) {
    'use server'
    
    const cookieStore = await cookies()
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
    if (!user) redirect('/login')

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
    <main className="min-h-screen bg-linen p-8 md:p-24 flex items-center justify-center">
      <div className="w-full max-w-xl bg-white rounded-[3rem] p-12 shadow-[0_20px_50px_rgba(166,159,146,0.1)]">
        
        <header className="mb-10">
          <h1 className="text-4xl font-serif italic text-charcoal mb-2">Start New Archive</h1>
          <p className="text-sm font-medium text-taupe italic">
            {defaultTitle ? "Guided by your selected template" : "Create a space for your records"}
          </p>
        </header>

        <form action={createAlbum} className="space-y-8">
          <div className="space-y-2">
            <label htmlFor="title" className="text-[10px] font-bold uppercase tracking-widest text-taupe">
              Archive Name
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              defaultValue={defaultTitle || ""}
              className="w-full bg-linen/30 border-none rounded-2xl p-4 font-serif italic text-xl text-charcoal focus:ring-1 focus:ring-taupe/30 outline-none transition-all"
              placeholder="e.g. Seasonal Observations"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-[10px] font-bold uppercase tracking-widest text-taupe">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={defaultDesc || ""}
              className="w-full bg-linen/30 border-none rounded-2xl p-4 font-medium text-charcoal focus:ring-1 focus:ring-taupe/30 outline-none transition-all"
              placeholder="What stories live here?"
            />
          </div>

          <div className="flex flex-col gap-4 pt-4">
            <button
              type="submit"
              className="w-full bg-charcoal text-white font-bold py-5 rounded-2xl hover:bg-taupe transition-all duration-500 shadow-xl shadow-taupe/10 active:scale-[0.98]"
            >
              CREATE ARCHIVE
            </button>
            
            <Link 
              href="/" 
              className="text-center text-[10px] font-bold tracking-widest text-taupe uppercase hover:text-charcoal transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}