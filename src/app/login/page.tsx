import { login, signup } from './actions'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { message: string; error: string }
}) {
  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto min-h-screen">
      <form
        className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground"
        action={login}
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Memory App Login</h1>
        
        <label className="text-md" htmlFor="email">Email</label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          name="email"
          placeholder="you@example.com"
          required
        />
        
        <label className="text-md" htmlFor="password">Password</label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          type="password"
          name="password"
          placeholder="••••••••"
          required
        />

        <button className="bg-blue-600 rounded-md px-4 py-2 text-white mb-2 hover:bg-blue-700 transition">
          Sign In
        </button>
        
        <button
          formAction={signup}
          className="border border-foreground/20 rounded-md px-4 py-2 text-foreground mb-2 hover:bg-gray-100 transition"
        >
          Sign Up
        </button>

        {searchParams?.error && (
          <p className="mt-4 p-4 bg-red-100 text-red-700 text-center rounded-md">
            {searchParams.error}
          </p>
        )}
        
        {searchParams?.message && (
          <p className="mt-4 p-4 bg-green-100 text-green-700 text-center rounded-md">
            {searchParams.message}
          </p>
        )}
      </form>
    </div>
  )
}